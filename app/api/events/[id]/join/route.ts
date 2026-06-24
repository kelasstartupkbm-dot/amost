import { NextRequest, NextResponse } from "next/server";
import { dbQuery } from "../../../../lib/amostDb";
import { getCurrentAmostUser, jsonError } from "../../../../lib/amostServerAuth";

export const dynamic = "force-dynamic";

type ColumnInfo = {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
};

function toPositiveBigInt(value: unknown) {
  const clean = String(value || "").trim();

  if (!/^\d+$/.test(clean)) {
    return null;
  }

  return clean;
}

function hasColumn(columns: ColumnInfo[], columnName: string) {
  return columns.some((column) => column.column_name === columnName);
}

function findColumn(columns: ColumnInfo[], candidates: string[]) {
  return (
    candidates.find((candidate) =>
      columns.some((column) => column.column_name === candidate)
    ) || null
  );
}

function getColumnType(columns: ColumnInfo[], columnName: string) {
  return (
    columns.find((column) => column.column_name === columnName)?.data_type || ""
  ).toLowerCase();
}

function isNumericType(dataType: string) {
  return [
    "smallint",
    "integer",
    "bigint",
    "numeric",
    "real",
    "double precision",
  ].includes(dataType);
}

function createParticipantNumber(
  columns: ColumnInfo[],
  columnName: string,
  eventId: string,
  userId: number,
  sequence: number
) {
  const dataType = getColumnType(columns, columnName);

  if (isNumericType(dataType)) {
    return sequence;
  }

  const padded = String(sequence).padStart(4, "0");
  return `A-${padded}`;
}

function pushInsertValue(
  insertColumns: string[],
  placeholders: string[],
  values: unknown[],
  columnName: string,
  value: unknown
) {
  insertColumns.push(columnName);
  values.push(value);
  placeholders.push(`$${values.length}`);
}

async function getTableColumns(tableName: string) {
  const result = await dbQuery(
    `
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
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
    is_nullable: String(row.is_nullable),
    column_default: row.column_default ? String(row.column_default) : null,
  })) as ColumnInfo[];
}

async function ensureEventRegistrationsTable() {
  const columns = await getTableColumns("event_registrations");

  if (columns.length > 0) {
    return columns;
  }

  await dbQuery(
    `
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
    `
  );

  return getTableColumns("event_registrations");
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

async function getExistingRegistration(eventId: string, userId: number) {
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

  return result.rows[0] || null;
}

async function getNextParticipantSequence(eventId: string) {
  const result = await dbQuery(
    `
      SELECT COUNT(*)::int AS total
      FROM event_registrations
      WHERE event_id = $1
    `,
    [eventId]
  );

  const total = Number(result.rows[0]?.total || 0);
  return total + 1;
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

    const columns = await ensureEventRegistrationsTable();

    if (!hasColumn(columns, "event_id") || !hasColumn(columns, "user_id")) {
      return jsonError(
        "Struktur tabel event_registrations belum valid. Kolom event_id dan user_id wajib ada.",
        500,
        {
          code: "INVALID_REGISTRATION_TABLE",
        }
      );
    }

    const existing = await getExistingRegistration(eventId, Number(user.id));

    if (existing) {
      return NextResponse.json({
        ok: true,
        alreadyRegistered: true,
        message: "Kamu sudah terdaftar pada event ini.",
        data: existing,
      });
    }

    const insertColumns: string[] = [];
    const placeholders: string[] = [];
    const values: unknown[] = [];

    pushInsertValue(insertColumns, placeholders, values, "event_id", eventId);
    pushInsertValue(insertColumns, placeholders, values, "user_id", Number(user.id));

    const statusColumn = findColumn(columns, [
      "status",
      "registration_status",
      "join_status",
    ]);

    if (statusColumn) {
      pushInsertValue(
        insertColumns,
        placeholders,
        values,
        statusColumn,
        "registered"
      );
    }

    const participantNumberColumn = findColumn(columns, [
      "participant_number",
      "registration_number",
      "bib_number",
      "bib",
      "number",
      "nomor_peserta",
    ]);

    if (participantNumberColumn) {
      const sequence = await getNextParticipantSequence(eventId);
      const participantNumber = createParticipantNumber(
        columns,
        participantNumberColumn,
        eventId,
        Number(user.id),
        sequence
      );

      pushInsertValue(
        insertColumns,
        placeholders,
        values,
        participantNumberColumn,
        participantNumber
      );
    }

    if (hasColumn(columns, "created_at")) {
      insertColumns.push("created_at");
      placeholders.push("NOW()");
    }

    if (hasColumn(columns, "updated_at")) {
      insertColumns.push("updated_at");
      placeholders.push("NOW()");
    }

    if (hasColumn(columns, "registered_at")) {
      insertColumns.push("registered_at");
      placeholders.push("NOW()");
    }

    if (hasColumn(columns, "joined_at")) {
      insertColumns.push("joined_at");
      placeholders.push("NOW()");
    }

    const insertResult = await dbQuery(
      `
        INSERT INTO event_registrations (
          ${insertColumns.join(", ")}
        )
        VALUES (
          ${placeholders.join(", ")}
        )
        RETURNING *
      `,
      values
    );

    return NextResponse.json({
      ok: true,
      alreadyRegistered: false,
      message: "Berhasil daftar event.",
      data: insertResult.rows[0],
    });
  } catch (error: any) {
    console.error("POST /api/events/[id]/join failed:", error);

    const message = String(error?.message || "");

    if (message.includes("duplicate") || message.includes("unique")) {
      return NextResponse.json({
        ok: true,
        alreadyRegistered: true,
        message: "Kamu sudah terdaftar pada event ini.",
      });
    }

    return jsonError(error?.message || "Gagal daftar event.", 500, {
      code: "SERVER_ERROR",
    });
  }
}
