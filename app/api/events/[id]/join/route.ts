import { NextRequest, NextResponse } from "next/server";
import { dbQuery } from "../../../../lib/amostDb";
import { getCurrentAmostUser } from "../../../../lib/amostServerAuth";
import { isEventRegistrationClosed } from "../../../../lib/amostEventStatus";

type DbRow = Record<string, any>;

function getRows(result: any): DbRow[] {
  if (Array.isArray(result)) return result as DbRow[];
  if (Array.isArray(result?.rows)) return result.rows as DbRow[];
  return [];
}

function isNumericId(value: string): boolean {
  return /^[0-9]+$/.test(value);
}

function getUserId(user: any): number | null {
  const raw = user?.id ?? user?.user_id ?? user?.userId;
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function normalizeRegistration(row: DbRow | null) {
  if (!row) return null;

  return {
    id: row.id,
    event_id: row.event_id,
    user_id: row.user_id,
    participant_number: row.participant_number ?? null,
    status: row.status ?? "registered",
    created_at: row.created_at ?? null,
  };
}

async function getEventColumns(): Promise<Set<string>> {
  const result = await dbQuery(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'events'
    `
  );

  return new Set(getRows(result).map((row) => String(row.column_name)));
}

async function findEvent(eventParam: string): Promise<DbRow | null> {
  const columns = await getEventColumns();
  const whereParts: string[] = [];
  const values: any[] = [];

  if (isNumericId(eventParam) && columns.has("id")) {
    values.push(Number(eventParam));
    whereParts.push(`id = $${values.length}`);
  }

  const slugCandidateColumns = [
    "slug",
    "event_slug",
    "code",
    "event_code",
    "short_slug",
  ];

  for (const column of slugCandidateColumns) {
    if (columns.has(column)) {
      values.push(eventParam);
      whereParts.push(`${column} = $${values.length}`);
    }
  }

  if (whereParts.length === 0) return null;

  const result = await dbQuery(
    `
      SELECT *
      FROM events
      WHERE ${whereParts.join(" OR ")}
      LIMIT 1
    `,
    values
  );

  return getRows(result)[0] ?? null;
}

async function ensureRegistrationTable() {
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS event_registrations (
      id BIGSERIAL PRIMARY KEY,
      event_id BIGINT NOT NULL,
      user_id BIGINT NOT NULL,
      participant_number VARCHAR(50),
      status VARCHAR(30) NOT NULL DEFAULT 'registered',
      created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
      CONSTRAINT event_registrations_unique_event_user UNIQUE (event_id, user_id)
    )
  `);

  await dbQuery(`
    CREATE INDEX IF NOT EXISTS event_registrations_event_id_idx
    ON event_registrations(event_id)
  `);

  await dbQuery(`
    CREATE INDEX IF NOT EXISTS event_registrations_user_id_idx
    ON event_registrations(user_id)
  `);
}

async function getExistingRegistration(eventId: number, userId: number): Promise<DbRow | null> {
  const result = await dbQuery(
    `
      SELECT *
      FROM event_registrations
      WHERE event_id = $1
        AND user_id = $2
      LIMIT 1
    `,
    [eventId, userId]
  );

  return getRows(result)[0] ?? null;
}

async function createParticipantNumber(eventId: number): Promise<string> {
  const result = await dbQuery(
    `
      SELECT COUNT(*)::int AS total
      FROM event_registrations
      WHERE event_id = $1
    `,
    [eventId]
  );

  const total = Number(getRows(result)[0]?.total ?? 0);
  return `A-${String(total + 1).padStart(4, "0")}`;
}

export async function POST(request: NextRequest, context: any) {
  try {
    const params = await context.params;
    const eventParam = String(params?.id ?? "").trim();

    if (!eventParam) {
      return NextResponse.json(
        { ok: false, code: "INVALID_EVENT_ID", message: "Event tidak valid." },
        { status: 400 }
      );
    }

    const user = await getCurrentAmostUser(request);
    const userId = getUserId(user);

    if (!userId) {
      return NextResponse.json(
        {
          ok: false,
          code: "LOGIN_REQUIRED",
          message: "Silakan login terlebih dahulu untuk daftar event.",
        },
        { status: 401 }
      );
    }

    const event = await findEvent(eventParam);

    if (!event) {
      return NextResponse.json(
        { ok: false, code: "EVENT_NOT_FOUND", message: "Event tidak ditemukan." },
        { status: 404 }
      );
    }

    const eventId = Number(event.id);

    if (!Number.isFinite(eventId) || eventId <= 0) {
      return NextResponse.json(
        { ok: false, code: "INVALID_EVENT_ID", message: "Event tidak valid." },
        { status: 400 }
      );
    }

    const registrationClosed = isEventRegistrationClosed({
      status: event.status,
      registrationStatus: event.registration_status ?? event.registrationStatus,
      eventDate: event.event_date ?? event.date,
      startAt: event.start_at ?? event.startAt,
      endAt: event.end_at ?? event.endAt,
    });

    if (registrationClosed) {
      return NextResponse.json(
        {
          ok: false,
          code: "REGISTRATION_CLOSED",
          message: "Pendaftaran event sudah ditutup atau event sudah selesai.",
        },
        { status: 409 }
      );
    }

    await ensureRegistrationTable();

    const existing = await getExistingRegistration(eventId, userId);

    if (existing) {
      return NextResponse.json({
        ok: true,
        code: "ALREADY_REGISTERED",
        message: "Kamu sudah terdaftar pada event ini.",
        data: normalizeRegistration(existing),
        registration: normalizeRegistration(existing),
      });
    }

    const participantNumber = await createParticipantNumber(eventId);

    const insertResult = await dbQuery(
      `
        INSERT INTO event_registrations (
          event_id,
          user_id,
          participant_number,
          status,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, 'registered', NOW(), NOW())
        ON CONFLICT (event_id, user_id)
        DO UPDATE SET
          updated_at = NOW()
        RETURNING *
      `,
      [eventId, userId, participantNumber]
    );

    const registration = getRows(insertResult)[0] ?? null;

    return NextResponse.json({
      ok: true,
      code: "REGISTERED",
      message: "Berhasil daftar event.",
      data: normalizeRegistration(registration),
      registration: normalizeRegistration(registration),
    });
  } catch (error: any) {
    console.error("POST /api/events/[id]/join error", error);

    return NextResponse.json(
      {
        ok: false,
        code: "JOIN_EVENT_FAILED",
        message: error?.message || "Gagal daftar event.",
      },
      { status: 500 }
    );
  }
}
