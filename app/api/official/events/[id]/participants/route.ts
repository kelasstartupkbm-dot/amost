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

const REGISTRATION_TABLE_CANDIDATES = [
  "event_registrations",
  "event_registration",
  "event_joins",
  "event_participants",
  "participants",
];

function toPositiveBigInt(value: unknown) {
  const clean = String(value || "").trim();

  if (!/^\d+$/.test(clean)) {
    return null;
  }

  return clean;
}

function isGlobalAdmin(user: AuthUserLike | null) {
  const role = String(user?.roleName || user?.role || "")
    .trim()
    .toLowerCase();

  return role === "super_admin" || role === "staff_amost";
}

function hasColumn(columns: string[], columnName: string) {
  return columns.includes(columnName);
}

function pickColumn(columns: string[], candidates: string[]) {
  return candidates.find((column) => hasColumn(columns, column)) || null;
}

async function getTableColumns(tableName: string) {
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

async function findRegistrationTable() {
  for (const tableName of REGISTRATION_TABLE_CANDIDATES) {
    const columns = await getTableColumns(tableName);

    if (columns.length === 0) {
      continue;
    }

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
  if (isGlobalAdmin(user)) {
    return true;
  }

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

    const registrationTable = await findRegistrationTable();

    if (!registrationTable) {
      return NextResponse.json({
        ok: true,
        eventId,
        sourceTable: null,
        data: [],
        items: [],
        total: 0,
        message:
          "Tabel pendaftaran peserta belum ditemukan. Cek event_registrations atau event_joins.",
      });
    }

    const { tableName, columns, eventColumn, userColumn } = registrationTable;

    const numberColumn = pickColumn(columns, [
      "participant_number",
      "registration_number",
      "bib_number",
      "bib",
      "number",
      "nomor_peserta",
    ]);

    const statusColumn = pickColumn(columns, [
      "status",
      "registration_status",
      "join_status",
    ]);

    const createdColumn = pickColumn(columns, [
      "created_at",
      "registered_at",
      "joined_at",
      "created",
    ]);

    const participantNumberSql = numberColumn
      ? `r.${numberColumn}::text AS participant_number`
      : `'P-' || r.id::text AS participant_number`;

    const statusSql = statusColumn
      ? `r.${statusColumn}::text AS registration_status`
      : `'registered' AS registration_status`;

    const createdAtSql = createdColumn
      ? `r.${createdColumn} AS registered_at`
      : `NULL::timestamp AS registered_at`;

    const orderSql = createdColumn
      ? `r.${createdColumn} DESC NULLS LAST, r.id DESC`
      : `r.id DESC`;

    const result = await dbQuery(
      `
        SELECT
          r.id AS registration_id,
          r.${eventColumn} AS event_id,
          r.${userColumn} AS user_id,
          u.full_name,
          u.email,
          ${participantNumberSql},
          ${statusSql},
          ${createdAtSql}
        FROM ${tableName} r
        LEFT JOIN users u ON u.id = r.${userColumn}
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
    console.error("GET /api/official/events/[id]/participants failed:", error);

    return jsonError(
      error?.message || "Data peserta event belum bisa dimuat.",
      500,
      {
        code: "SERVER_ERROR",
      }
    );
  }
}
