import { NextRequest, NextResponse } from "next/server";
import { dbQuery } from "../../../../lib/amostDb";
import { getCurrentAmostUser } from "../../../../lib/amostServerAuth";
import { createEventJoinFeedPost } from "../../../../lib/communityFeedAutoPost";

export const dynamic = "force-dynamic";

function toPositiveBigInt(value: unknown) {
  const clean = String(value || "").trim();

  return /^\d+$/.test(clean) ? clean : null;
}

function hasColumn(columns: string[], columnName: string) {
  return columns.includes(columnName);
}

function pickColumn(columns: string[], candidates: string[]) {
  return candidates.find((column) => hasColumn(columns, column)) || null;
}

function getUserId(user: any) {
  return Number(user?.id || user?.user_id || user?.userId || 0);
}

function appendInsertValue(
  columns: string[],
  insertColumns: string[],
  values: any[],
  placeholders: string[],
  columnName: string,
  value: any,
) {
  if (!hasColumn(columns, columnName)) return;

  insertColumns.push(columnName);
  values.push(value);
  placeholders.push(`$${values.length}`);
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
    [tableName],
  );

  return result.rows.map((row: any) => String(row.column_name));
}

async function ensureEventRegistrationsTable() {
  await dbQuery(
    `
      CREATE TABLE IF NOT EXISTS event_registrations (
        id BIGSERIAL PRIMARY KEY,
        event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        participant_number VARCHAR(50),
        status VARCHAR(30) NOT NULL DEFAULT 'registered',
        notes TEXT,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
        UNIQUE(event_id, user_id)
      )
    `,
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
    [eventId],
  );

  return result.rows.length > 0;
}

async function getExistingRegistration(eventId: string, userId: number) {
  const result = await dbQuery(
    `
      SELECT *
      FROM event_registrations
      WHERE event_id = $1
        AND user_id = $2
      LIMIT 1
    `,
    [eventId, userId],
  );

  return result.rows[0] || null;
}

async function createParticipantNumber(eventId: string) {
  const result = await dbQuery(
    `
      SELECT COUNT(*)::int AS total
      FROM event_registrations
      WHERE event_id = $1
    `,
    [eventId],
  );

  const total = Number(result.rows[0]?.total || 0) + 1;

  return `A-${String(1000 + total).padStart(4, "0")}`;
}

function addOptionalTimestampColumns(
  columns: string[],
  insertColumns: string[],
  placeholders: string[],
) {
  if (hasColumn(columns, "created_at")) {
    insertColumns.push("created_at");
    placeholders.push("NOW()");
  }

  if (hasColumn(columns, "updated_at")) {
    insertColumns.push("updated_at");
    placeholders.push("NOW()");
  }
}

function buildRegistrationInsertPayload(input: {
  columns: string[];
  eventId: string;
  userId: number;
  participantNumber: string;
}) {
  const insertColumns: string[] = [];
  const values: any[] = [];
  const placeholders: string[] = [];

  appendInsertValue(
    input.columns,
    insertColumns,
    values,
    placeholders,
    "event_id",
    input.eventId,
  );

  appendInsertValue(
    input.columns,
    insertColumns,
    values,
    placeholders,
    "user_id",
    input.userId,
  );

  const numberColumn = pickColumn(input.columns, [
    "participant_number",
    "registration_number",
    "bib_number",
    "bib",
    "number",
    "nomor_peserta",
  ]);

  if (numberColumn) {
    appendInsertValue(
      input.columns,
      insertColumns,
      values,
      placeholders,
      numberColumn,
      input.participantNumber,
    );
  }

  const statusColumn = pickColumn(input.columns, [
    "status",
    "registration_status",
    "join_status",
  ]);

  if (statusColumn) {
    appendInsertValue(
      input.columns,
      insertColumns,
      values,
      placeholders,
      statusColumn,
      "registered",
    );
  }

  appendInsertValue(
    input.columns,
    insertColumns,
    values,
    placeholders,
    "notes",
    "Daftar melalui halaman public event AMOST.",
  );

  addOptionalTimestampColumns(input.columns, insertColumns, placeholders);

  return {
    insertColumns,
    values,
    placeholders,
  };
}

export async function POST(request: NextRequest, context: any) {
  try {
    const params = await Promise.resolve(context.params);
    const eventId = toPositiveBigInt(params?.id);

    if (!eventId) {
      return NextResponse.json(
        { ok: false, message: "ID event tidak valid." },
        { status: 400 },
      );
    }

    const user = await getCurrentAmostUser(request);
    const userId = getUserId(user);

    if (!user || !userId) {
      return NextResponse.json(
        {
          ok: false,
          message: "Silakan login untuk daftar event.",
          code: "UNAUTHORIZED",
        },
        { status: 401 },
      );
    }

    const exists = await eventExists(eventId);

    if (!exists) {
      return NextResponse.json(
        { ok: false, message: "Event tidak ditemukan." },
        { status: 404 },
      );
    }

    await ensureEventRegistrationsTable();

    const existing = await getExistingRegistration(eventId, userId);

    if (existing) {
      return NextResponse.json({
        ok: true,
        alreadyRegistered: true,
        registration: existing,
        message: "Kamu sudah terdaftar pada event ini.",
      });
    }

    const columns = await getColumns("event_registrations");
    const participantNumber = await createParticipantNumber(eventId);

    const payload = buildRegistrationInsertPayload({
      columns,
      eventId,
      userId,
      participantNumber,
    });

    const result = await dbQuery(
      `
        INSERT INTO event_registrations (${payload.insertColumns.join(", ")})
        VALUES (${payload.placeholders.join(", ")})
        RETURNING *
      `,
      payload.values,
    );

    let feedPost: any = null;

    try {
      feedPost = await createEventJoinFeedPost({
        eventId,
        userId,
        participantNumber,
      });
    } catch (feedError) {
      console.error("Auto community feed post after join failed:", feedError);
      feedPost = {
        ok: false,
        skipped: true,
        message: "Pendaftaran berhasil, tetapi auto-post timeline gagal.",
      };
    }

    return NextResponse.json({
      ok: true,
      alreadyRegistered: false,
      registration: result.rows[0],
      participantNumber,
      feedPost,
      message: "Berhasil daftar event.",
    });
  } catch (error: any) {
    console.error("POST /api/events/[id]/join failed:", error);

    const message = String(error?.message || "Pendaftaran event gagal.");

    if (message.includes("duplicate") || message.includes("unique")) {
      return NextResponse.json({
        ok: true,
        alreadyRegistered: true,
        message: "Kamu sudah terdaftar pada event ini.",
      });
    }

    return NextResponse.json(
      {
        ok: false,
        message,
        error: message,
      },
      { status: 500 },
    );
  }
}
