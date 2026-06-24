import { NextRequest, NextResponse } from "next/server";
import { dbQuery } from "../../../lib/amostDb";
import { getCurrentAmostUser, jsonError } from "../../../lib/amostServerAuth";

export const dynamic = "force-dynamic";

function hasColumn(columns: string[], columnName: string) {
  return columns.includes(columnName);
}

function eventTextColumn(
  columns: string[],
  candidates: string[],
  fallbackSql: string,
  alias: string
) {
  const found = candidates.find((column) => hasColumn(columns, column));

  if (found) {
    return `e.${found} AS ${alias}`;
  }

  return `${fallbackSql} AS ${alias}`;
}

function eventNumberColumn(
  columns: string[],
  candidates: string[],
  fallbackSql: string,
  alias: string
) {
  const found = candidates.find((column) => hasColumn(columns, column));

  if (found) {
    return `e.${found} AS ${alias}`;
  }

  return `${fallbackSql} AS ${alias}`;
}

async function getEventColumns() {
  const result = await dbQuery(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'events'
      ORDER BY ordinal_position
    `
  );

  return result.rows.map((row: any) => String(row.column_name));
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentAmostUser(request);

    if (!user) {
      return jsonError("Sesi login tidak valid. Silakan login ulang.", 401, {
        code: "UNAUTHORIZED",
      });
    }

    const eventColumns = await getEventColumns();

    const eventTitleSql = eventTextColumn(
      eventColumns,
      ["title", "event_title", "event_name", "name"],
      "'Event #' || eo.event_id::text",
      "event_title"
    );

    const eventNameSql = eventTextColumn(
      eventColumns,
      ["title", "event_title", "event_name", "name"],
      "'Event #' || eo.event_id::text",
      "event_name"
    );

    const slugSql = eventTextColumn(
      eventColumns,
      ["slug"],
      "NULL::text",
      "slug"
    );

    const eventStatusSql = eventTextColumn(
      eventColumns,
      ["status", "event_status"],
      "NULL::text",
      "event_status"
    );

    const categorySql = eventTextColumn(
      eventColumns,
      ["category", "sport_type", "type"],
      "'Event'",
      "category"
    );

    const locationSql = eventTextColumn(
      eventColumns,
      ["location", "venue", "place"],
      "NULL::text",
      "location"
    );

    const quotaSql = eventNumberColumn(
      eventColumns,
      ["quota", "total_quota", "max_participants"],
      "0",
      "quota"
    );

    const doorprizeSql = eventNumberColumn(
      eventColumns,
      ["doorprize_count", "doorprize_total", "doorprize"],
      "0",
      "doorprize_count"
    );

    const result = await dbQuery(
      `
        SELECT
          eo.id,
          eo.event_id,
          eo.user_id,
          eo.permission_level,
          eo.status,
          eo.notes,
          eo.created_at,
          eo.updated_at,
          ${eventTitleSql},
          ${eventNameSql},
          ${slugSql},
          ${eventStatusSql},
          ${categorySql},
          ${locationSql},
          ${quotaSql},
          ${doorprizeSql}
        FROM event_officials eo
        LEFT JOIN events e ON e.id = eo.event_id
        WHERE eo.user_id = $1
          AND eo.status = 'active'
        ORDER BY eo.created_at DESC, eo.id DESC
      `,
      [user.id]
    );

    return NextResponse.json({
      ok: true,
      data: result.rows,
      items: result.rows,
      total: result.rows.length,
      hasOfficialAccess: result.rows.length > 0,
    });
  } catch (error: any) {
    console.error("GET /api/account/event-officials failed:", error);

    return jsonError(
      error?.message || "Data akses Official Event belum bisa dimuat.",
      500,
      {
        code: "SERVER_ERROR",
      }
    );
  }
}
