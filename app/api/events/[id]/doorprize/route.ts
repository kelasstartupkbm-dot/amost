import { NextRequest, NextResponse } from "next/server";
import { dbQuery } from "../../../../lib/amostDb";
import { getCurrentAmostUser } from "../../../../lib/amostServerAuth";

export const dynamic = "force-dynamic";

type ColumnSet = Set<string>;

function jsonError(message: string, status = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json(
    {
      ok: false,
      message,
      ...extra,
    },
    { status },
  );
}

function toPositiveBigInt(value: unknown) {
  const clean = String(value || "").trim();

  if (!/^\d+$/.test(clean)) return null;

  return clean;
}

function getUserId(user: any) {
  return Number(user?.id || user?.user_id || user?.userId || 0);
}

function normalizeRole(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function isGlobalAdmin(user: any) {
  const role = normalizeRole(
    user?.role ||
      user?.roleName ||
      user?.role_name ||
      user?.roleLabel ||
      user?.role_label,
  );

  const roleId = Number(user?.role_id || user?.roleId || 0);

  return role === "super_admin" || role === "staff_amost" || roleId === 1 || roleId === 2;
}

async function resolveEventId(context: any) {
  const params = await Promise.resolve(context?.params);
  return toPositiveBigInt(params?.id);
}

async function ensureDoorprizeTable() {
  await dbQuery(
    `
    CREATE TABLE IF NOT EXISTS event_doorprize_winners (
      id BIGSERIAL PRIMARY KEY,
      event_id BIGINT NOT NULL,
      user_id BIGINT NOT NULL,
      participant_number VARCHAR(50),
      prize_name VARCHAR(150),
      notes TEXT,
      drawn_by BIGINT,
      drawn_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
    )
    `,
  );

  await dbQuery(
    `
    CREATE INDEX IF NOT EXISTS event_doorprize_winners_event_id_idx
    ON event_doorprize_winners(event_id)
    `,
  );

  await dbQuery(
    `
    CREATE INDEX IF NOT EXISTS event_doorprize_winners_event_user_idx
    ON event_doorprize_winners(event_id, user_id)
    `,
  );
}

async function ensureEventRegistrationsTable() {
  await dbQuery(
    `
    CREATE TABLE IF NOT EXISTS event_registrations (
      id BIGSERIAL PRIMARY KEY,
      event_id BIGINT NOT NULL,
      user_id BIGINT NOT NULL,
      participant_number VARCHAR(50),
      status VARCHAR(30) DEFAULT 'registered',
      notes TEXT,
      created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
      UNIQUE(event_id, user_id)
    )
    `,
  );
}

async function getTableColumns(tableName: string): Promise<ColumnSet> {
  const result = await dbQuery(
    `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
    `,
    [tableName],
  );

  return new Set(result.rows.map((row: any) => String(row.column_name)));
}

function quotedColumn(tableAlias: string, columnName: string) {
  return `${tableAlias}."${columnName.replace(/"/g, '""')}"`;
}

function firstExistingExpression(
  columns: ColumnSet,
  tableAlias: string,
  candidateColumns: string[],
  fallbackSql: string,
) {
  const expressions = candidateColumns
    .filter((columnName) => columns.has(columnName))
    .map((columnName) => `NULLIF(${quotedColumn(tableAlias, columnName)}::text, '')`);

  if (expressions.length === 0) return fallbackSql;

  return `COALESCE(${expressions.join(", ")}, ${fallbackSql})`;
}

function pickEventTitle(eventRow: any, eventId: string) {
  return (
    String(
      eventRow?.title ||
        eventRow?.event_title ||
        eventRow?.name ||
        eventRow?.event_name ||
        "",
    ).trim() || `Event #${eventId}`
  );
}

async function getEvent(eventId: string) {
  const result = await dbQuery(
    `
    SELECT *
    FROM events
    WHERE id = $1
    LIMIT 1
    `,
    [eventId],
  );

  return result.rows[0] || null;
}

async function isRegisteredParticipant(eventId: string, userId: number) {
  const result = await dbQuery(
    `
    SELECT id
    FROM event_registrations
    WHERE event_id = $1
      AND user_id = $2
    LIMIT 1
    `,
    [eventId, userId],
  );

  return result.rows.length > 0;
}

async function isActiveEventOfficial(eventId: string, userId: number) {
  const result = await dbQuery(
    `
    SELECT id
    FROM event_officials
    WHERE event_id = $1
      AND user_id = $2
      AND COALESCE(status, 'active') = 'active'
    LIMIT 1
    `,
    [eventId, userId],
  );

  return result.rows.length > 0;
}

async function getEligibleTotal(eventId: string) {
  const result = await dbQuery(
    `
    SELECT COUNT(*)::int AS total
    FROM event_registrations er
    WHERE er.event_id = $1
      AND NOT EXISTS (
        SELECT 1
        FROM event_doorprize_winners w
        WHERE w.event_id = er.event_id
          AND w.user_id = er.user_id
      )
    `,
    [eventId],
  );

  return Number(result.rows[0]?.total || 0);
}

async function getParticipantTotal(eventId: string) {
  const result = await dbQuery(
    `
    SELECT COUNT(*)::int AS total
    FROM event_registrations
    WHERE event_id = $1
    `,
    [eventId],
  );

  return Number(result.rows[0]?.total || 0);
}

async function getWinners(eventId: string) {
  const userColumns = await getTableColumns("users");
  const winnerNameSql = firstExistingExpression(
    userColumns,
    "u",
    ["full_name", "fullName", "name", "username", "display_name"],
    "u.email::text",
  );
  const drawerNameSql = firstExistingExpression(
    userColumns,
    "du",
    ["full_name", "fullName", "name", "username", "display_name"],
    "du.email::text",
  );

  const result = await dbQuery(
    `
    SELECT
      w.id,
      w.event_id,
      w.user_id,
      w.participant_number,
      w.prize_name,
      w.notes,
      w.drawn_by,
      w.drawn_at,
      w.created_at,
      ${winnerNameSql} AS full_name,
      u.email AS email,
      ${drawerNameSql} AS drawn_by_name
    FROM event_doorprize_winners w
    LEFT JOIN users u ON u.id = w.user_id
    LEFT JOIN users du ON du.id = w.drawn_by
    WHERE w.event_id = $1
    ORDER BY w.drawn_at DESC NULLS LAST, w.id DESC
    `,
    [eventId],
  );

  return result.rows;
}

export async function GET(request: NextRequest, context: any) {
  try {
    const eventId = await resolveEventId(context);

    if (!eventId) {
      return jsonError("ID event tidak valid.", 400);
    }

    let user: any = null;

    try {
      user = await getCurrentAmostUser(request);
    } catch (error) {
      console.error("doorprize public auth error", error);
    }

    const userId = getUserId(user);

    if (!userId) {
      return jsonError("Login diperlukan untuk membuka halaman doorprize.", 401);
    }

    await ensureDoorprizeTable();
    await ensureEventRegistrationsTable();

    const eventRow = await getEvent(eventId);

    if (!eventRow) {
      return jsonError("Event tidak ditemukan.", 404);
    }

    const globalAdmin = isGlobalAdmin(user);
    const official = globalAdmin ? true : await isActiveEventOfficial(eventId, userId);
    const registered = official ? true : await isRegisteredParticipant(eventId, userId);

    if (!globalAdmin && !official && !registered) {
      return jsonError(
        "Halaman doorprize hanya bisa diakses peserta terdaftar, Official Event, Staff AMOST, atau Super Admin.",
        403,
      );
    }

    const [eligibleTotal, participantTotal, winners] = await Promise.all([
      getEligibleTotal(eventId),
      getParticipantTotal(eventId),
      getWinners(eventId),
    ]);

    const event = {
      ...eventRow,
      title: pickEventTitle(eventRow, eventId),
    };

    return NextResponse.json({
      ok: true,
      event,
      canDraw: Boolean(globalAdmin || official),
      canView: true,
      eligibleTotal,
      participantTotal,
      winnersTotal: winners.length,
      winners,
      latestWinner: winners[0] || null,
    });
  } catch (error: any) {
    console.error("GET /api/events/[id]/doorprize failed:", error);

    return jsonError(
      "Doorprize belum bisa dimuat.",
      500,
      {
        detail: String(error?.message || error),
      },
    );
  }
}
