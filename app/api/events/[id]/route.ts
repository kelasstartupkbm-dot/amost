import { NextRequest, NextResponse } from "next/server";
import { dbQuery } from "../../../lib/amostDb";
import { getCurrentAmostUser } from "../../../lib/amostServerAuth";

export const dynamic = "force-dynamic";

function hasColumn(columns: string[], columnName: string) {
  return columns.includes(columnName);
}

function pickColumn(columns: string[], candidates: string[]) {
  return candidates.find((column) => hasColumn(columns, column)) || null;
}

function textColumn(
  columns: string[],
  candidates: string[],
  fallbackSql: string,
  alias: string
) {
  const found = pickColumn(columns, candidates);
  return found ? `e.${found}::text AS ${alias}` : `${fallbackSql} AS ${alias}`;
}

function numberColumn(
  columns: string[],
  candidates: string[],
  fallbackSql: string,
  alias: string
) {
  const found = pickColumn(columns, candidates);
  return found ? `COALESCE(e.${found}, 0) AS ${alias}` : `${fallbackSql} AS ${alias}`;
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
    [tableName]
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
    [tableName]
  );

  return result.rows.length > 0;
}

function isNumeric(value: string) {
  return /^\d+$/.test(value);
}

export async function GET(request: NextRequest, context: any) {
  try {
    const params = await context.params;
    const rawId = String(params?.id || "").trim();

    if (!rawId) {
      return NextResponse.json(
        { ok: false, message: "ID event tidak valid." },
        { status: 400 }
      );
    }

    const eventColumns = await getColumns("events");

    if (eventColumns.length === 0) {
      return NextResponse.json(
        { ok: false, message: "Tabel events belum ditemukan." },
        { status: 404 }
      );
    }

    const titleSql = textColumn(
      eventColumns,
      ["title", "event_title", "event_name", "name"],
      "'Event #' || e.id::text",
      "title"
    );
    const slugColumn = pickColumn(eventColumns, ["slug"]);
    const slugSql = slugColumn ? `e.${slugColumn}::text AS slug` : `e.id::text AS slug`;
    const categorySql = textColumn(eventColumns, ["category", "sport_type", "type"], "'Event'", "category");
    const statusSql = textColumn(eventColumns, ["status", "event_status"], "'published'", "status");
    const locationSql = textColumn(eventColumns, ["location", "venue", "place", "city"], "'Lokasi menyusul'", "location");
    const descriptionSql = textColumn(eventColumns, ["description", "summary", "content", "notes"], "'Event olahraga outdoor AMOST.'", "description");
    const routeDistanceSql = numberColumn(eventColumns, ["distance_km", "route_distance_km", "distance"], "0", "distance_km");
    const quotaSql = numberColumn(eventColumns, ["quota", "total_quota", "max_participants"], "0", "quota");
    const doorprizeSql = numberColumn(eventColumns, ["doorprize_count", "doorprize_total", "doorprize"], "0", "doorprize_count");
    const feeSql = numberColumn(eventColumns, ["registration_fee", "fee", "price", "ticket_price"], "0", "registration_fee");
    const dateColumn = pickColumn(eventColumns, ["event_date", "start_date", "date", "start_time", "created_at"]);
    const dateSql = dateColumn ? `e.${dateColumn} AS event_date` : `NULL::timestamp AS event_date`;
    const imageSql = textColumn(eventColumns, ["image_url", "banner_url", "poster_url", "cover_image"], "NULL::text", "image_url");
    const routeFileSql = textColumn(eventColumns, ["gpx_filename", "route_file", "route_name"], "NULL::text", "route_file");

    const hasRegistrations = await hasTable("event_registrations");
    const participantCountSql = hasRegistrations
      ? `(
          SELECT COUNT(*)::int
          FROM event_registrations er
          WHERE er.event_id = e.id
        ) AS participant_count`
      : `0 AS participant_count`;

    const whereSql = isNumeric(rawId)
      ? "e.id = $1"
      : slugColumn
        ? `e.${slugColumn} = $1`
        : "e.id::text = $1";

    const result = await dbQuery(
      `
        SELECT
          e.id,
          ${titleSql},
          ${slugSql},
          ${categorySql},
          ${statusSql},
          ${locationSql},
          ${descriptionSql},
          ${dateSql},
          ${routeDistanceSql},
          ${quotaSql},
          ${doorprizeSql},
          ${feeSql},
          ${imageSql},
          ${routeFileSql},
          ${participantCountSql}
        FROM events e
        WHERE ${whereSql}
        LIMIT 1
      `,
      [rawId]
    );

    const event = result.rows[0] || null;

    if (!event) {
      return NextResponse.json(
        { ok: false, message: "Event tidak ditemukan." },
        { status: 404 }
      );
    }

    const user = await getCurrentAmostUser(request).catch(() => null);
    let registration = null;

    if (user && hasRegistrations) {
      const registrationResult = await dbQuery(
        `
          SELECT *
          FROM event_registrations
          WHERE event_id = $1
            AND user_id = $2
          ORDER BY id DESC
          LIMIT 1
        `,
        [event.id, user.id]
      );

      registration = registrationResult.rows[0] || null;
    }

    return NextResponse.json({
      ok: true,
      event,
      data: event,
      user,
      registration,
      isRegistered: Boolean(registration),
    });
  } catch (error: any) {
    console.error("GET /api/events/[id] failed:", error);

    return NextResponse.json(
      {
        ok: false,
        message: error?.message || "Detail event belum bisa dimuat.",
        error: error?.message || "Detail event belum bisa dimuat.",
      },
      { status: 500 }
    );
  }
}
