import { NextRequest, NextResponse } from "next/server";
import { dbQuery } from "../../../../../lib/amostDb";
import {
  getCurrentAmostUser,
  jsonError,
} from "../../../../../lib/amostServerAuth";

export const dynamic = "force-dynamic";

type AuthUserLike = {
  id: number;
  role?: string | null;
  roleName?: string | null;
};

type ColumnInfo = {
  column_name: string;
  data_type: string;
};

const RESULT_TABLE_CANDIDATES = [
  "training_results",
  "event_results",
  "race_results",
  "tracking_results",
  "results",
];

function toPositiveBigInt(value: unknown) {
  const clean = String(value || "").trim();
  if (!/^\d+$/.test(clean)) return null;
  return clean;
}

function isGlobalAdmin(user: AuthUserLike | null) {
  const role = String(user?.roleName || user?.role || "")
    .trim()
    .toLowerCase();

  return role === "super_admin" || role === "staff_amost";
}

function hasColumn(columns: ColumnInfo[], columnName: string) {
  return columns.some((column) => column.column_name === columnName);
}

function pickColumn(columns: ColumnInfo[], candidates: string[]) {
  return (
    candidates.find((candidate) =>
      columns.some((column) => column.column_name === candidate)
    ) || null
  );
}

function safeColumnSql(
  columns: ColumnInfo[],
  candidates: string[],
  fallbackSql: string,
  alias: string
) {
  const found = pickColumn(columns, candidates);
  if (found) return `r.${found} AS ${alias}`;
  return `${fallbackSql} AS ${alias}`;
}

async function getTableColumns(tableName: string) {
  const result = await dbQuery(
    `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
      ORDER BY ordinal_position
    `,
    [tableName]
  );

  return result.rows.map((row: any) => ({
    column_name: String(row.column_name),
    data_type: String(row.data_type),
  })) as ColumnInfo[];
}

async function findResultTable() {
  for (const tableName of RESULT_TABLE_CANDIDATES) {
    const columns = await getTableColumns(tableName);

    if (columns.length === 0) continue;

    const eventColumn = pickColumn(columns, ["event_id", "training_id"]);
    const userColumn = pickColumn(columns, [
      "user_id",
      "member_id",
      "athlete_id",
      "participant_user_id",
    ]);

    if (eventColumn && userColumn) {
      return {
        tableName,
        columns,
        eventColumn,
        userColumn,
      };
    }
  }

  return null;
}

async function userCanAccessEvent(user: AuthUserLike, eventId: string) {
  if (isGlobalAdmin(user)) return true;

  const result = await dbQuery(
    `
      SELECT id
      FROM event_officials
      WHERE event_id = $1
        AND user_id = $2
        AND status = 'active'
      LIMIT 1
    `,
    [eventId, user.id]
  );

  return result.rows.length > 0;
}

export async function GET(request: NextRequest, context: any) {
  try {
    const params = await context.params;
    const eventId = toPositiveBigInt(params?.id);

    if (!eventId) {
      return jsonError("ID event tidak valid.", 400, {
        code: "INVALID_EVENT_ID",
      });
    }

    const user = await getCurrentAmostUser(request);

    if (!user) {
      return jsonError("Sesi login tidak valid. Silakan login ulang.", 401, {
        code: "UNAUTHORIZED",
      });
    }

    const canAccess = await userCanAccessEvent(user, eventId);

    if (!canAccess) {
      return jsonError("Akses event ditolak.", 403, {
        code: "FORBIDDEN",
      });
    }

    const resultTable = await findResultTable();

    if (!resultTable) {
      return NextResponse.json({
        ok: true,
        eventId,
        sourceTable: null,
        data: [],
        items: [],
        total: 0,
        message:
          "Tabel hasil event belum ditemukan. Cek training_results atau event_results.",
      });
    }

    const { tableName, columns, eventColumn, userColumn } = resultTable;

    const distanceSql = safeColumnSql(
      columns,
      ["distance_km", "total_distance_km", "distance", "total_distance"],
      "NULL",
      "distance"
    );

    const durationSql = safeColumnSql(
      columns,
      [
        "duration_seconds",
        "moving_time_seconds",
        "elapsed_time_seconds",
        "duration",
        "moving_time",
        "elapsed_time",
      ],
      "NULL",
      "duration"
    );

    const avgSpeedSql = safeColumnSql(
      columns,
      ["avg_speed_kmh", "average_speed_kmh", "avg_speed", "average_speed"],
      "NULL",
      "avg_speed"
    );

    const statusSql = safeColumnSql(
      columns,
      ["status", "result_status", "finish_status"],
      "'REVIEW'",
      "result_status"
    );

    const createdSql = safeColumnSql(
      columns,
      ["created_at", "submitted_at", "finished_at", "updated_at"],
      "NULL::timestamp",
      "submitted_at"
    );

    const orderColumn = pickColumn(columns, [
      "created_at",
      "submitted_at",
      "finished_at",
      "updated_at",
      "id",
    ]);

    const orderSql = orderColumn ? `r.${orderColumn} DESC NULLS LAST` : `r.id DESC`;

    const result = await dbQuery(
      `
        SELECT
          r.id AS result_id,
          r.${eventColumn} AS event_id,
          r.${userColumn} AS user_id,
          u.full_name,
          u.email,
          er.participant_number,
          ${distanceSql},
          ${durationSql},
          ${avgSpeedSql},
          ${statusSql},
          ${createdSql}
        FROM ${tableName} r
        LEFT JOIN users u ON u.id = r.${userColumn}
        LEFT JOIN event_registrations er
          ON er.event_id = r.${eventColumn}
         AND er.user_id = r.${userColumn}
        WHERE r.${eventColumn} = $1
        ORDER BY ${orderSql}
        LIMIT 500
      `,
      [eventId]
    );

    return NextResponse.json({
      ok: true,
      eventId,
      sourceTable: tableName,
      data: result.rows,
      items: result.rows,
      total: result.rows.length,
    });
  } catch (error: any) {
    console.error("GET /api/official/events/[id]/results failed:", error);

    return jsonError(
      error?.message || "Data results event belum bisa dimuat.",
      500,
      {
        code: "SERVER_ERROR",
      }
    );
  }
}
