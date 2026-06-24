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
    `
  );

  await dbQuery(
    `
      CREATE INDEX IF NOT EXISTS event_doorprize_winners_event_id_idx
      ON event_doorprize_winners(event_id)
    `
  );
}

async function eventExists(eventId: string) {
  const result = await dbQuery(
    `
      SELECT id
      FROM events
      WHERE id = $1
      LIMIT 1
    `,
    [eventId]
  );

  return result.rows.length > 0;
}

async function userIsRegistered(eventId: string, userId: number) {
  const tableExists = await hasTable("event_registrations");

  if (!tableExists) {
    return false;
  }

  const result = await dbQuery(
    `
      SELECT id
      FROM event_registrations
      WHERE event_id = $1
        AND user_id = $2
      LIMIT 1
    `,
    [eventId, userId]
  );

  return result.rows.length > 0;
}

async function userIsOfficial(eventId: string, userId: number) {
  const tableExists = await hasTable("event_officials");

  if (!tableExists) {
    return false;
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
    [eventId, userId]
  );

  return result.rows.length > 0;
}

async function userCanViewDoorprize(user: AuthUserLike, eventId: string) {
  if (isGlobalAdmin(user)) {
    return true;
  }

  const isRegistered = await userIsRegistered(eventId, user.id);

  if (isRegistered) {
    return true;
  }

  return userIsOfficial(eventId, user.id);
}

async function userCanDrawDoorprize(user: AuthUserLike, eventId: string) {
  if (isGlobalAdmin(user)) {
    return true;
  }

  return userIsOfficial(eventId, user.id);
}

async function getEligibleParticipants(eventId: string) {
  const tableExists = await hasTable("event_registrations");

  if (!tableExists) {
    return [];
  }

  const result = await dbQuery(
    `
      SELECT
        er.id AS registration_id,
        er.event_id,
        er.user_id,
        er.participant_number,
        u.full_name,
        u.email
      FROM event_registrations er
      LEFT JOIN users u ON u.id = er.user_id
      WHERE er.event_id = $1
        AND LOWER(COALESCE(er.status::text, 'registered')) NOT IN ('cancelled', 'canceled', 'deleted', 'inactive')
        AND NOT EXISTS (
          SELECT 1
          FROM event_doorprize_winners w
          WHERE w.event_id = er.event_id
            AND w.user_id = er.user_id
        )
      ORDER BY er.id ASC
      LIMIT 1000
    `,
    [eventId]
  );

  return result.rows;
}

async function getWinners(eventId: string) {
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
        u.full_name,
        u.email,
        drawer.full_name AS drawn_by_name
      FROM event_doorprize_winners w
      LEFT JOIN users u ON u.id = w.user_id
      LEFT JOIN users drawer ON drawer.id = w.drawn_by
      WHERE w.event_id = $1
      ORDER BY w.drawn_at DESC, w.id DESC
      LIMIT 500
    `,
    [eventId]
  );

  return result.rows;
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
      return jsonError("Silakan login terlebih dahulu.", 401, {
        code: "UNAUTHORIZED",
      });
    }

    const exists = await eventExists(eventId);

    if (!exists) {
      return jsonError("Event tidak ditemukan.", 404, {
        code: "EVENT_NOT_FOUND",
      });
    }

    const canView = await userCanViewDoorprize(user, eventId);

    if (!canView) {
      return jsonError(
        "Daftar event terlebih dahulu untuk melihat doorprize.",
        403,
        {
          code: "NOT_REGISTERED",
        }
      );
    }

    await ensureDoorprizeTable();

    const eligible = await getEligibleParticipants(eventId);
    const winners = await getWinners(eventId);
    const canDraw = await userCanDrawDoorprize(user, eventId);

    return NextResponse.json({
      ok: true,
      eventId,
      canDraw,
      eligible: canDraw ? eligible : [],
      winners,
      eligibleTotal: eligible.length,
      winnersTotal: winners.length,
    });
  } catch (error: any) {
    console.error("GET /api/events/[id]/doorprize failed:", error);

    return jsonError(error?.message || "Data doorprize belum bisa dimuat.", 500, {
      code: "SERVER_ERROR",
    });
  }
}
