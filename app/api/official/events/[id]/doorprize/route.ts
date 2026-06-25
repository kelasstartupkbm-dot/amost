import { NextRequest, NextResponse } from "next/server";
import { dbQuery } from "../../../../../lib/amostDb";
import {
  getCurrentAmostUser,
  jsonError,
} from "../../../../../lib/amostServerAuth";
import { createDoorprizeWinnerFeedPost } from "../../../../../lib/communityFeedAutoPost";

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

  await dbQuery(
    `
      CREATE INDEX IF NOT EXISTS event_doorprize_winners_event_user_idx
      ON event_doorprize_winners(event_id, user_id)
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

async function getRegistrationColumns() {
  return getTableColumns("event_registrations");
}

async function getEligibleParticipants(eventId: string) {
  const columns = await getRegistrationColumns();

  if (columns.length === 0) {
    return {
      sourceTable: null,
      rows: [],
    };
  }

  const userColumn = pickColumn(columns, [
    "user_id",
    "member_id",
    "athlete_id",
    "participant_user_id",
  ]);

  const eventColumn = pickColumn(columns, ["event_id", "training_id"]);

  if (!userColumn || !eventColumn) {
    return {
      sourceTable: "event_registrations",
      rows: [],
    };
  }

  const participantNumberColumn = pickColumn(columns, [
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

  const participantNumberSql = participantNumberColumn
    ? `er.${participantNumberColumn}::text AS participant_number`
    : `'P-' || er.id::text AS participant_number`;

  const statusFilterSql = statusColumn
    ? `AND LOWER(COALESCE(er.${statusColumn}::text, 'registered')) NOT IN ('cancelled', 'canceled', 'deleted', 'inactive')`
    : "";

  const result = await dbQuery(
    `
      SELECT
        er.id AS registration_id,
        er.${eventColumn} AS event_id,
        er.${userColumn} AS user_id,
        ${participantNumberSql},
        u.full_name,
        u.email
      FROM event_registrations er
      LEFT JOIN users u ON u.id = er.${userColumn}
      WHERE er.${eventColumn} = $1
        ${statusFilterSql}
        AND NOT EXISTS (
          SELECT 1
          FROM event_doorprize_winners w
          WHERE w.event_id = er.${eventColumn}
            AND w.user_id = er.${userColumn}
        )
      ORDER BY er.id ASC
      LIMIT 1000
    `,
    [eventId]
  );

  return {
    sourceTable: "event_registrations",
    rows: result.rows,
  };
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

async function readJsonBody(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return {};
  }
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

    await ensureDoorprizeTable();

    const eligible = await getEligibleParticipants(eventId);
    const winners = await getWinners(eventId);

    return NextResponse.json({
      ok: true,
      eventId,
      sourceTable: eligible.sourceTable,
      eligible: eligible.rows,
      winners,
      eligibleTotal: eligible.rows.length,
      winnersTotal: winners.length,
    });
  } catch (error: any) {
    console.error("GET /api/official/events/[id]/doorprize failed:", error);

    return jsonError(
      error?.message || "Data doorprize event belum bisa dimuat.",
      500,
      {
        code: "SERVER_ERROR",
      }
    );
  }
}

export async function POST(request: NextRequest, context: any) {
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

    const exists = await eventExists(eventId);

    if (!exists) {
      return jsonError("Event tidak ditemukan.", 404, {
        code: "EVENT_NOT_FOUND",
      });
    }

    const canAccess = await userCanAccessEvent(user, eventId);

    if (!canAccess) {
      return jsonError("Akses event ditolak.", 403, {
        code: "FORBIDDEN",
      });
    }

    await ensureDoorprizeTable();

    const body = await readJsonBody(request);
    const prizeName = String(body?.prizeName || body?.prize_name || "Doorprize")
      .trim()
      .slice(0, 150);
    const notes = String(body?.notes || "").trim().slice(0, 500);

    const eligible = await getEligibleParticipants(eventId);

    if (eligible.rows.length === 0) {
      return jsonError(
        "Belum ada peserta eligible untuk diundi, atau semua peserta sudah pernah menang.",
        400,
        {
          code: "NO_ELIGIBLE_PARTICIPANTS",
        }
      );
    }

    const randomIndex = Math.floor(Math.random() * eligible.rows.length);
    const selected = eligible.rows[randomIndex];

    const insertResult = await dbQuery(
      `
        INSERT INTO event_doorprize_winners (
          event_id,
          user_id,
          participant_number,
          prize_name,
          notes,
          drawn_by,
          drawn_at,
          created_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          NOW(),
          NOW()
        )
        RETURNING *
      `,
      [
        eventId,
        selected.user_id,
        selected.participant_number,
        prizeName || "Doorprize",
        notes || null,
        user.id,
      ]
    );

    const winner = insertResult.rows[0];

    let feedPost: any = null;

    try {
      feedPost = await createDoorprizeWinnerFeedPost({
        eventId,
        winnerUserId: selected.user_id,
        drawnByUserId: user.id,
        participantNumber: selected.participant_number,
        prizeName: prizeName || "Doorprize",
      });
    } catch (feedError) {
      console.error("Auto community feed post after doorprize failed:", feedError);
      feedPost = {
        ok: false,
        skipped: true,
        message: "Doorprize berhasil diundi, tetapi auto-post timeline gagal.",
      };
    }

    const winners = await getWinners(eventId);
    const nextEligible = await getEligibleParticipants(eventId);

    return NextResponse.json({
      ok: true,
      message: "Doorprize berhasil diundi.",
      data: {
        ...winner,
        full_name: selected.full_name,
        email: selected.email,
      },
      winner: {
        ...winner,
        full_name: selected.full_name,
        email: selected.email,
      },
      feedPost,
      winners,
      eligible: nextEligible.rows,
      winnersTotal: winners.length,
      eligibleTotal: nextEligible.rows.length,
    });
  } catch (error: any) {
    console.error("POST /api/official/events/[id]/doorprize failed:", error);

    return jsonError(error?.message || "Gagal mengundi doorprize.", 500, {
      code: "SERVER_ERROR",
    });
  }
}
