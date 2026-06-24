import { NextRequest, NextResponse } from "next/server";
import { dbQuery } from "../../lib/amostDb";

export const dynamic = "force-dynamic";

const EVENT_TABLE = "events";

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim().toLowerCase() || "";

    const eventColumns = await getColumns(EVENT_TABLE);

    if (eventColumns.length === 0) {
      return NextResponse.json({
        ok: true,
        events: [],
        data: [],
        total: 0,
        message: "Tabel events belum ditemukan.",
      });
    }

    const titleSql = textColumn(
      eventColumns,
      ["title", "event_title", "event_name", "name"],
      "'Event #' || e.id::text",
      "title"
    );

    const slugSql = textColumn(eventColumns, ["slug"], "e.id::text", "slug");

    const categorySql = textColumn(
      eventColumns,
      ["category", "sport_type", "type"],
      "'Event'",
      "category"
    );

    const statusSql = textColumn(
      eventColumns,
      ["status", "event_status"],
      "'published'",
      "status"
    );

    const locationSql = textColumn(
      eventColumns,
      ["location", "venue", "place", "city"],
      "'Lokasi menyusul'",
      "location"
    );

    const descriptionSql = textColumn(
      eventColumns,
      ["description", "summary", "content", "notes"],
      "'Event olahraga outdoor AMOST.'",
      "description"
    );

    const routeDistanceSql = numberColumn(
      eventColumns,
      ["distance_km", "route_distance_km", "distance"],
      "0",
      "distance_km"
    );

    const quotaSql = numberColumn(
      eventColumns,
      ["quota", "total_quota", "max_participants"],
      "0",
      "quota"
    );

    const doorprizeSql = numberColumn(
      eventColumns,
      ["doorprize_count", "doorprize_total", "doorprize"],
      "0",
      "doorprize_count"
    );

    const feeSql = numberColumn(
      eventColumns,
      ["registration_fee", "fee", "price", "ticket_price"],
      "0",
      "registration_fee"
    );

    const dateColumn = pickColumn(eventColumns, [
      "event_date",
      "start_date",
      "date",
      "start_time",
      "created_at",
    ]);

    const dateSql = dateColumn
      ? `e.${dateColumn} AS event_date`
      : `NULL::timestamp AS event_date`;

    const imageSql = textColumn(
      eventColumns,
      ["image_url", "banner_url", "poster_url", "cover_image"],
      "NULL::text",
      "image_url"
    );

    const hasRegistrations = await hasTable("event_registrations");

    const participantCountSql = hasRegistrations
      ? `(
          SELECT COUNT(*)::int
          FROM event_registrations er
          WHERE er.event_id = e.id
        ) AS participant_count`
      : `0 AS participant_count`;

    const whereParts: string[] = [];
    const params: any[] = [];

    if (query) {
      params.push(`%${query}%`);
      whereParts.push(
        `LOWER(CONCAT_WS(' ', e.id::text, ${
          pickColumn(eventColumns, ["title", "event_title", "event_name", "name"])
            ? `e.${pickColumn(eventColumns, ["title", "event_title", "event_name", "name"])}::text`
            : "''"
        }, ${
          pickColumn(eventColumns, ["location", "venue", "place", "city"])
            ? `e.${pickColumn(eventColumns, ["location", "venue", "place", "city"])}::text`
            : "''"
        })) LIKE $${params.length}`
      );
    }

    const whereSql = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";
    const orderColumn = pickColumn(eventColumns, [
      "event_date",
      "start_date",
      "date",
      "start_time",
      "created_at",
      "id",
    ]);
    const orderSql = orderColumn ? `ORDER BY e.${orderColumn} DESC NULLS LAST` : "ORDER BY e.id DESC";

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
          ${participantCountSql}
        FROM events e
        ${whereSql}
        ${orderSql}
        LIMIT 200
      `,
      params
    );

    return NextResponse.json({
      ok: true,
      events: result.rows,
      data: result.rows,
      total: result.rows.length,
    });
  } catch (error: any) {
    console.error("GET /api/events failed:", error);

    return NextResponse.json(
      {
        ok: false,
        message: error?.message || "Data event belum bisa dimuat.",
        error: error?.message || "Data event belum bisa dimuat.",
      },
      { status: 500 }
    );
  }
}
