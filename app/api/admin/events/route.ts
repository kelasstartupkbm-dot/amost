import { NextRequest, NextResponse } from "next/server";
import { dbQuery } from "../../../lib/amostDb";

export const dynamic = "force-dynamic";

type DbRow = Record<string, any>;

function quoteIdentifier(identifier: string) {
  return `"${identifier.replace(/"/g, '""')}"`;
}

function getRows(result: any): DbRow[] {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.rows)) return result.rows;
  return [];
}

function normalizeEvent(row: Record<string, any>) {
  return {
    ...row,
    id: row.id,
    title: row.title || row.name || row.event_name || row.event_title || `Event #${row.id}`,
    name: row.name || row.title || row.event_name || row.event_title || `Event #${row.id}`,
    event_name: row.event_name || row.title || row.name || row.event_title || `Event #${row.id}`,
    category: row.category || row.sport_type || row.type || row.event_type || "Event",
    status: row.status || row.event_status || "Draft",
    quota: row.quota ?? row.total_quota ?? row.max_participants ?? 0,
    total_quota: row.total_quota ?? row.quota ?? row.max_participants ?? 0,
    participant_count:
      row.participant_count ??
      row.total_participants ??
      row.registered_count ??
      row.join_count ??
      0,
    total_participants:
      row.total_participants ??
      row.participant_count ??
      row.registered_count ??
      row.join_count ??
      0,
    doorprize_count: row.doorprize_count ?? row.doorprize_total ?? row.doorprize ?? 0,
    doorprize_total: row.doorprize_total ?? row.doorprize_count ?? row.doorprize ?? 0,
    image_url:
      row.image_url ||
      row.cover_image_url ||
      row.banner_url ||
      row.poster_url ||
      row.cover_image ||
      row.image ||
      "",
    cover_image_url:
      row.cover_image_url ||
      row.image_url ||
      row.banner_url ||
      row.poster_url ||
      row.cover_image ||
      row.image ||
      "",
  };
}

function createSlug(value: string) {
  return String(value || "event")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "event";
}

function asText(value: unknown) {
  return String(value ?? "").trim();
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function getEventColumns() {
  const columnsResult = await dbQuery(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'events'
      ORDER BY ordinal_position
    `
  );

  return getRows(columnsResult).map((row) => String(row.column_name));
}

async function makeUniqueSlug(baseSlug: string, columns: string[]) {
  const slugColumn = ["slug", "event_slug", "code", "event_code"].find((column) =>
    columns.includes(column)
  );

  if (!slugColumn) return baseSlug;

  let candidate = baseSlug;
  let counter = 2;

  while (counter < 500) {
    const result = await dbQuery(
      `
        SELECT id
        FROM events
        WHERE ${quoteIdentifier(slugColumn)} = $1
        LIMIT 1
      `,
      [candidate]
    );

    if (getRows(result).length === 0) return candidate;

    candidate = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return `${baseSlug}-${Date.now()}`;
}

function putIfColumn(
  target: Record<string, any>,
  columns: string[],
  column: string,
  value: any
) {
  if (columns.includes(column)) {
    target[column] = value;
  }
}


async function tableExists(tableName: string) {
  const result = await dbQuery(
    `
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = $1
      LIMIT 1
    `,
    [tableName]
  );

  return getRows(result).length > 0;
}

export async function GET() {
  try {
    const columns = await getEventColumns();

    if (columns.length === 0) {
      return NextResponse.json({
        ok: true,
        events: [],
        data: [],
        message: "Tabel events belum ditemukan.",
      });
    }

    const orderColumn =
      ["updated_at", "created_at", "start_date", "event_date", "id"].find((column) =>
        columns.includes(column)
      ) || columns[0];

    const hasRegistrations = await tableExists("event_registrations");

    const participantSelect = hasRegistrations
      ? `
        COALESCE(reg_stats.participant_count, 0)::int AS participant_count,
        COALESCE(reg_stats.participant_count, 0)::int AS total_participants
      `
      : `
        0::int AS participant_count,
        0::int AS total_participants
      `;

    const participantJoin = hasRegistrations
      ? `
        LEFT JOIN (
          SELECT
            event_id,
            COUNT(*)::int AS participant_count
          FROM event_registrations
          GROUP BY event_id
        ) reg_stats ON reg_stats.event_id = e.id
      `
      : "";

    const result = await dbQuery(
      `
        SELECT
          e.*,
          ${participantSelect}
        FROM events e
        ${participantJoin}
        ORDER BY e.${quoteIdentifier(orderColumn)} DESC NULLS LAST
        LIMIT 200
      `
    );

    const events = getRows(result).map(normalizeEvent);

    return NextResponse.json({
      ok: true,
      events,
      data: events,
      total: events.length,
    });
  } catch (error: any) {
    console.error("GET /api/admin/events failed:", error);

    return NextResponse.json(
      {
        ok: false,
        message:
          error?.message ||
          "Data event belum bisa dimuat dari database.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const title = asText(body.title || body.name || body.event_name);
    const location = asText(body.location || body.city);
    const startDate = asText(body.startDate || body.start_date || body.event_date || body.date);

    if (!title) {
      return NextResponse.json(
        { ok: false, message: "Nama event wajib diisi." },
        { status: 400 }
      );
    }

    if (!location) {
      return NextResponse.json(
        { ok: false, message: "Lokasi event wajib diisi." },
        { status: 400 }
      );
    }

    if (!startDate) {
      return NextResponse.json(
        { ok: false, message: "Tanggal mulai wajib diisi." },
        { status: 400 }
      );
    }

    const columns = await getEventColumns();

    if (columns.length === 0) {
      return NextResponse.json(
        { ok: false, message: "Tabel events belum ditemukan." },
        { status: 500 }
      );
    }

    const baseSlug = createSlug(asText(body.slug) || title);
    const slug = await makeUniqueSlug(baseSlug, columns);

    const eventType = asText(body.eventType || body.event_type || body.category || "Sepeda");
    const endDate = asText(body.endDate || body.end_date) || startDate;
    const description = asText(body.description);
    const status = asText(body.status || "draft");

    const distanceKm = asNumber(body.distanceKm ?? body.distance_km ?? body.distance, 0);
    const ticketPrice = asNumber(body.ticketPrice ?? body.ticket_price ?? body.price ?? body.fee, 0);
    const maxParticipants = asNumber(
      body.maxParticipants ?? body.max_participants ?? body.quota ?? body.total_quota,
      0
    );
    const doorprizeCount = asNumber(
      body.doorprizeCount ?? body.doorprize_count ?? body.doorprize_total ?? body.doorprize,
      0
    );

    const coverImage = asText(body.coverImage || body.cover_image || body.image_url || body.cover_image_url);
    const gpxFilename = asText(body.gpxFilename || body.gpx_filename);
    const gpxContent = asText(body.gpxContent || body.gpx_content || body.route_gpx);

    const insertData: Record<string, any> = {};

    putIfColumn(insertData, columns, "title", title);
    putIfColumn(insertData, columns, "name", title);
    putIfColumn(insertData, columns, "event_name", title);
    putIfColumn(insertData, columns, "event_title", title);

    putIfColumn(insertData, columns, "slug", slug);
    putIfColumn(insertData, columns, "event_slug", slug);
    putIfColumn(insertData, columns, "code", slug);
    putIfColumn(insertData, columns, "event_code", slug);

    putIfColumn(insertData, columns, "description", description);
    putIfColumn(insertData, columns, "event_description", description);

    putIfColumn(insertData, columns, "category", eventType);
    putIfColumn(insertData, columns, "sport_type", eventType);
    putIfColumn(insertData, columns, "type", eventType);
    putIfColumn(insertData, columns, "event_type", eventType);

    putIfColumn(insertData, columns, "location", location);
    putIfColumn(insertData, columns, "city", location);

    putIfColumn(insertData, columns, "start_date", startDate);
    putIfColumn(insertData, columns, "start_at", startDate);
    putIfColumn(insertData, columns, "event_date", startDate);
    putIfColumn(insertData, columns, "date", startDate);

    putIfColumn(insertData, columns, "end_date", endDate);
    putIfColumn(insertData, columns, "end_at", endDate);

    putIfColumn(insertData, columns, "distance_km", distanceKm);
    putIfColumn(insertData, columns, "distance", distanceKm);

    putIfColumn(insertData, columns, "ticket_price", ticketPrice);
    putIfColumn(insertData, columns, "registration_fee", ticketPrice);
    putIfColumn(insertData, columns, "price", ticketPrice);
    putIfColumn(insertData, columns, "fee", ticketPrice);

    putIfColumn(insertData, columns, "max_participants", maxParticipants);
    putIfColumn(insertData, columns, "quota", maxParticipants);
    putIfColumn(insertData, columns, "total_quota", maxParticipants);

    putIfColumn(insertData, columns, "doorprize_count", doorprizeCount);
    putIfColumn(insertData, columns, "doorprize_total", doorprizeCount);
    putIfColumn(insertData, columns, "doorprize", doorprizeCount);

    putIfColumn(insertData, columns, "cover_image", coverImage);
    putIfColumn(insertData, columns, "cover_image_url", coverImage);
    putIfColumn(insertData, columns, "image_url", coverImage);
    putIfColumn(insertData, columns, "banner_url", coverImage);
    putIfColumn(insertData, columns, "poster_url", coverImage);
    putIfColumn(insertData, columns, "image", coverImage);

    putIfColumn(insertData, columns, "gpx_filename", gpxFilename);
    putIfColumn(insertData, columns, "route_gpx_filename", gpxFilename);

    putIfColumn(insertData, columns, "gpx_content", gpxContent);
    putIfColumn(insertData, columns, "route_gpx", gpxContent);
    putIfColumn(insertData, columns, "gpx_data", gpxContent);

    putIfColumn(insertData, columns, "status", status);
    putIfColumn(insertData, columns, "event_status", status);
    putIfColumn(insertData, columns, "registration_status", status === "published" ? "open" : "closed");

    const now = new Date().toISOString();
    putIfColumn(insertData, columns, "created_at", now);
    putIfColumn(insertData, columns, "updated_at", now);

    const keys = Object.keys(insertData).filter((key) => columns.includes(key));

    if (keys.length === 0) {
      return NextResponse.json(
        { ok: false, message: "Tidak ada kolom events yang cocok untuk disimpan." },
        { status: 500 }
      );
    }

    const sqlColumns = keys.map(quoteIdentifier).join(", ");
    const placeholders = keys.map((_, index) => `$${index + 1}`).join(", ");
    const values = keys.map((key) => insertData[key]);

    const result = await dbQuery(
      `
        INSERT INTO events (${sqlColumns})
        VALUES (${placeholders})
        RETURNING *
      `,
      values
    );

    const event = normalizeEvent(getRows(result)[0] || {});

    return NextResponse.json({
      ok: true,
      message: "Event berhasil dibuat.",
      event,
      data: event,
    });
  } catch (error: any) {
    console.error("POST /api/admin/events failed:", error);

    return NextResponse.json(
      {
        ok: false,
        message: error?.message || "Event gagal disimpan.",
      },
      { status: 500 }
    );
  }
}
