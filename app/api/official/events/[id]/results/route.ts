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

async function userCanViewParticipantPage(user: AuthUserLike, eventId: string) {
  if (isGlobalAdmin(user)) {
    return true;
  }

  const isRegistered = await userIsRegistered(eventId, user.id);

  if (isRegistered) {
    return true;
  }

  return userIsOfficial(eventId, user.id);
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

    const canView = await userCanViewParticipantPage(user, eventId);

    if (!canView) {
      return jsonError("Daftar event terlebih dahulu untuk melihat results.", 403, {
        code: "NOT_REGISTERED",
      });
    }

    const tableExists = await hasTable("event_results");

    if (!tableExists) {
      return NextResponse.json({
        ok: true,
        eventId,
        data: [],
        items: [],
        total: 0,
        message: "Belum ada tabel hasil event.",
      });
    }

    const result = await dbQuery(
      `
        SELECT
          r.id AS result_id,
          r.event_id,
          r.user_id,
          u.full_name,
          u.email,
          er.participant_number,
          r.distance_km AS distance,
          r.duration_seconds AS duration,
          r.avg_speed_kmh AS avg_speed,
          r.status AS result_status,
          COALESCE(r.updated_at, r.created_at) AS submitted_at
        FROM event_results r
        LEFT JOIN users u ON u.id = r.user_id
        LEFT JOIN event_registrations er
          ON er.event_id = r.event_id
         AND er.user_id = r.user_id
        WHERE r.event_id = $1
        ORDER BY
          CASE WHEN UPPER(COALESCE(r.status, '')) = 'FINISH' THEN 0 ELSE 1 END,
          r.duration_seconds ASC NULLS LAST,
          r.id ASC
        LIMIT 500
      `,
      [eventId]
    );

    return NextResponse.json({
      ok: true,
      eventId,
      data: result.rows,
      items: result.rows,
      total: result.rows.length,
    });
  } catch (error: any) {
    console.error("GET /api/events/[id]/results failed:", error);

    return jsonError(error?.message || "Data results belum bisa dimuat.", 500, {
      code: "SERVER_ERROR",
    });
  }
}
