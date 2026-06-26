import { NextRequest, NextResponse } from "next/server";
import { dbQuery } from "../../lib/amostDb";
import { getCurrentAmostUser } from "../../lib/amostServerAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function ident(name: string) {
  return `"${name.replace(/"/g, '""')}"`;
}

function toPositiveBigInt(value: unknown) {
  const clean = String(value || "").trim();
  return /^\d+$/.test(clean) ? clean : null;
}

function sanitizeFilename(value: unknown, fallback: string) {
  const raw = String(value || fallback)
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-");

  const name = raw || fallback;
  return name.toLowerCase().endsWith(".gpx") ? name : `${name}.gpx`;
}

function normalizeRole(role: unknown) {
  return String(role || "").trim().toLowerCase();
}

function isAdminRole(role: unknown) {
  const clean = normalizeRole(role);
  return clean === "super_admin" || clean === "staff_amost";
}

function hasColumn(columns: string[], columnName: string) {
  return columns.includes(columnName);
}

function pickColumn(columns: string[], candidates: string[]) {
  return candidates.find((column) => hasColumn(columns, column)) || null;
}

async function getColumns(tableName: string) {
  const result = await dbQuery(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
      ORDER BY ordinal_position
    `,
    [tableName],
  );

  return result.rows.map((row: any) => String(row.column_name));
}

async function hasTable(tableName: string) {
  const result = await dbQuery(
    `
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = $1
      LIMIT 1
    `,
    [tableName],
  );

  return result.rows.length > 0;
}

async function isRegisteredOrJoined(eventId: string, userId: number | string) {
  const checks = [
    { table: "event_registrations", eventCols: ["event_id", "training_id"], userCols: ["user_id", "member_id", "athlete_id"] },
    { table: "event_joins", eventCols: ["event_id", "training_id"], userCols: ["user_id", "member_id", "athlete_id"] },
  ];

  for (const check of checks) {
    if (!(await hasTable(check.table))) continue;

    const columns = await getColumns(check.table);
    const eventCol = pickColumn(columns, check.eventCols);
    const userCol = pickColumn(columns, check.userCols);

    if (!eventCol || !userCol) continue;

    const result = await dbQuery(
      `
        SELECT 1
        FROM ${ident(check.table)}
        WHERE ${ident(eventCol)}::text = $1
          AND ${ident(userCol)}::text = $2
        LIMIT 1
      `,
      [eventId, String(userId)],
    );

    if (result.rows.length > 0) return true;
  }

  return false;
}

type GpxPoint = {
  lat: number;
  lng: number;
  ele?: number | null;
  time?: string | null;
};

function safeNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function normalizeRoutePoint(item: any): GpxPoint | null {
  if (Array.isArray(item)) {
    const lat = safeNumber(item[0]);
    const lng = safeNumber(item[1]);

    if (lat === null || lng === null) return null;

    return {
      lat,
      lng,
      ele: safeNumber(item[2]),
      time: typeof item[3] === "string" ? item[3] : null,
    };
  }

  if (!item || typeof item !== "object") return null;

  const lat = safeNumber(item.lat ?? item.latitude);
  const lng = safeNumber(item.lng ?? item.lon ?? item.longitude);

  if (lat === null || lng === null) return null;

  return {
    lat,
    lng,
    ele: safeNumber(item.ele ?? item.elevation ?? item.altitude),
    time: typeof item.time === "string" ? item.time : typeof item.timestamp === "string" ? item.timestamp : null,
  };
}

function parseRoutePathJson(value: unknown): GpxPoint[] {
  if (!value) return [];

  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    const array = Array.isArray(parsed)
      ? parsed
      : Array.isArray((parsed as any)?.points)
        ? (parsed as any).points
        : Array.isArray((parsed as any)?.route)
          ? (parsed as any).route
          : [];

    return array
      .map(normalizeRoutePoint)
      .filter(Boolean) as GpxPoint[];
  } catch {
    return [];
  }
}

function escapeXml(value: unknown) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildGpxFromPoints(points: GpxPoint[], title: string) {
  const trkpts = points
    .map((point) => {
      const ele = point.ele !== null && point.ele !== undefined ? `<ele>${point.ele}</ele>` : "";
      const time = point.time ? `<time>${escapeXml(point.time)}</time>` : "";
      return `      <trkpt lat="${point.lat}" lon="${point.lng}">${ele}${time}</trkpt>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="AMOST" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${escapeXml(title)}</name>
  </metadata>
  <trk>
    <name>${escapeXml(title)}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>
`;
}

function ensureGpxText(value: unknown) {
  const text = String(value || "").trim();

  if (!text) return "";

  if (text.startsWith("<?xml") || text.includes("<gpx")) {
    return text;
  }

  try {
    const decoded = Buffer.from(text, "base64").toString("utf8");

    if (decoded.includes("<gpx")) return decoded;
  } catch {
    // ignore
  }

  return text;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = toPositiveBigInt(searchParams.get("id") || searchParams.get("event_id"));

    if (!eventId) {
      return NextResponse.json(
        { ok: false, message: "ID event tidak valid." },
        { status: 400 },
      );
    }

    const user = await getCurrentAmostUser(request);

    if (!user) {
      return NextResponse.json(
        { ok: false, message: "Silakan login untuk download GPX." },
        { status: 401 },
      );
    }

    const allowed = isAdminRole(user.role || user.roleName) || (await isRegisteredOrJoined(eventId, user.id));

    if (!allowed) {
      return NextResponse.json(
        { ok: false, message: "GPX hanya dapat diunduh oleh peserta event atau admin." },
        { status: 403 },
      );
    }

    if (!(await hasTable("events"))) {
      return NextResponse.json(
        { ok: false, message: "Tabel events belum tersedia." },
        { status: 404 },
      );
    }

    const columns = await getColumns("events");
    const idCol = pickColumn(columns, ["id", "event_id"]) || "id";
    const titleCol = pickColumn(columns, ["title", "event_title", "event_name", "name"]);
    const filenameCol = pickColumn(columns, ["gpx_filename", "route_file", "route_name"]);
    const gpxContentCol = pickColumn(columns, ["gpx_content", "gpx_file", "gpx_data", "gpx", "route_gpx"]);
    const routeJsonCol = pickColumn(columns, ["route_path_json", "route_points_json", "path_json"]);

    const result = await dbQuery(
      `
        SELECT
          ${ident(idCol)}::text AS id,
          ${titleCol ? `${ident(titleCol)}::text` : `('event-' || ${ident(idCol)}::text)`} AS title,
          ${filenameCol ? `${ident(filenameCol)}::text` : `null::text`} AS filename,
          ${gpxContentCol ? ident(gpxContentCol) : `null`} AS gpx_content,
          ${routeJsonCol ? ident(routeJsonCol) : `null`} AS route_path_json
        FROM events
        WHERE ${ident(idCol)}::text = $1
        LIMIT 1
      `,
      [eventId],
    );

    const event = result.rows[0];

    if (!event) {
      return NextResponse.json(
        { ok: false, message: "Event tidak ditemukan." },
        { status: 404 },
      );
    }

    let gpxText = ensureGpxText(event.gpx_content);

    if (!gpxText) {
      const points = parseRoutePathJson(event.route_path_json);

      if (points.length >= 2) {
        gpxText = buildGpxFromPoints(points, event.title || `Event ${event.id}`);
      }
    }

    if (!gpxText) {
      return NextResponse.json(
        {
          ok: false,
          message: "GPX belum tersedia untuk event ini.",
          code: "GPX_NOT_AVAILABLE",
        },
        { status: 404 },
      );
    }

    const filename = sanitizeFilename(event.filename || event.title, `amost-event-${event.id}.gpx`);

    return new NextResponse(gpxText, {
      status: 200,
      headers: {
        "Content-Type": "application/gpx+xml; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("GET /api/gpx-download failed:", error);

    return NextResponse.json(
      {
        ok: false,
        message: error?.message || "GPX belum bisa diunduh.",
        error: error?.message || "GPX belum bisa diunduh.",
      },
      { status: 500 },
    );
  }
}
