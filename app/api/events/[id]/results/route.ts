import { NextRequest, NextResponse } from "next/server";
import { dbQuery } from "../../../../lib/amostDb";
import { getCurrentAmostUser } from "../../../../lib/amostServerAuth";

export const dynamic = "force-dynamic";

type ColumnMap = {
  resultIdCol: string | null;
  eventCol: string | null;
  userCol: string | null;
  distanceCol: string | null;
  durationCol: string | null;
  avgSpeedCol: string | null;
  statusCol: string | null;
  submittedCol: string | null;
};

function ident(name: string) {
  return `"${name.replace(/"/g, '""')}"`;
}

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

async function hasTable(tableName: string) {
  const result = await dbQuery(
    `
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = $1
      LIMIT 1
    `,
    [tableName],
  );

  return result.rows.length > 0;
}

async function eventExists(eventId: string) {
  const result = await dbQuery(
    `
      SELECT id
      FROM events
      WHERE id::text = $1
      LIMIT 1
    `,
    [eventId],
  );

  return result.rows.length > 0;
}

function buildColumnMap(columns: string[]): ColumnMap {
  return {
    resultIdCol: pickColumn(columns, ["id", "result_id"]),
    eventCol: pickColumn(columns, ["event_id", "training_id"]),
    userCol: pickColumn(columns, ["user_id", "member_id", "athlete_id"]),
    distanceCol: pickColumn(columns, ["distance_km", "distance", "total_distance_km"]),
    durationCol: pickColumn(columns, [
      "moving_time_seconds",
      "duration_seconds",
      "elapsed_time_seconds",
      "time_seconds",
      "duration",
    ]),
    avgSpeedCol: pickColumn(columns, ["avg_speed_kmh", "average_speed_kmh", "avg_speed"]),
    statusCol: pickColumn(columns, ["status", "result_status", "finish_status"]),
    submittedCol: pickColumn(columns, ["finished_at", "submitted_at", "created_at", "updated_at"]),
  };
}

export async function GET(request: NextRequest, context: any) {
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

    if (!user) {
      return NextResponse.json(
        { ok: false, message: "Silakan login untuk melihat results." },
        { status: 401 },
      );
    }

    const hasEvents = await hasTable("events");

    if (!hasEvents || !(await eventExists(eventId))) {
      return NextResponse.json(
        { ok: false, message: "Event tidak ditemukan." },
        { status: 404 },
      );
    }

    const hasResults = await hasTable("training_results");

    if (!hasResults) {
      return NextResponse.json({
        ok: true,
        data: [],
        items: [],
        total: 0,
        message: "Tabel training_results belum tersedia.",
      });
    }

    const resultColumns = await getColumns("training_results");
    const usersColumns = await getColumns("users");
    const registrationsColumns = (await hasTable("event_registrations"))
      ? await getColumns("event_registrations")
      : [];

    const map = buildColumnMap(resultColumns);

    if (!map.eventCol || !map.userCol) {
      return NextResponse.json({
        ok: true,
        data: [],
        items: [],
        total: 0,
        message: "Kolom event_id/user_id pada training_results belum lengkap.",
      });
    }

    const userNameCol = pickColumn(usersColumns, ["full_name", "name", "nama", "username", "email"]);
    const userEmailCol = pickColumn(usersColumns, ["email", "user_email"]);
    const registrationEventCol = pickColumn(registrationsColumns, ["event_id", "training_id"]);
    const registrationUserCol = pickColumn(registrationsColumns, ["user_id", "member_id", "athlete_id"]);
    const registrationNumberCol = pickColumn(registrationsColumns, [
      "participant_number",
      "registration_number",
      "bib_number",
      "bib",
      "number",
      "nomor_peserta",
    ]);

    const canJoinRegistration = Boolean(
      registrationEventCol &&
        registrationUserCol &&
        registrationNumberCol &&
        registrationsColumns.length > 0,
    );

    const orderCol = map.submittedCol || map.resultIdCol || map.eventCol;

    const result = await dbQuery(
      `
        SELECT
          ${map.resultIdCol ? `r.${ident(map.resultIdCol)}::text` : `concat(r.${ident(map.eventCol)}::text, '-', r.${ident(map.userCol)}::text)`} AS result_id,
          r.${ident(map.eventCol)}::text AS event_id,
          r.${ident(map.userCol)}::text AS user_id,
          ${userNameCol ? `u.${ident(userNameCol)}::text` : `'Tanpa Nama'::text`} AS full_name,
          ${userEmailCol ? `u.${ident(userEmailCol)}::text` : `''::text`} AS email,
          ${canJoinRegistration ? `er.${ident(registrationNumberCol!)}::text` : `null::text`} AS participant_number,
          ${map.distanceCol ? `r.${ident(map.distanceCol)}` : `null`} AS distance,
          ${map.durationCol ? `r.${ident(map.durationCol)}` : `null`} AS duration,
          ${map.avgSpeedCol ? `r.${ident(map.avgSpeedCol)}` : `null`} AS avg_speed,
          ${map.statusCol ? `r.${ident(map.statusCol)}::text` : `'REVIEW'::text`} AS result_status,
          ${map.submittedCol ? `r.${ident(map.submittedCol)}` : `null::timestamp`} AS submitted_at
        FROM training_results r
        LEFT JOIN users u ON u.id::text = r.${ident(map.userCol)}::text
        ${
          canJoinRegistration
            ? `
              LEFT JOIN event_registrations er
                ON er.${ident(registrationEventCol!)}::text = r.${ident(map.eventCol)}::text
               AND er.${ident(registrationUserCol!)}::text = r.${ident(map.userCol)}::text
            `
            : ""
        }
        WHERE r.${ident(map.eventCol)}::text = $1
        ORDER BY r.${ident(orderCol!)} DESC NULLS LAST
        LIMIT 300
      `,
      [eventId],
    );

    return NextResponse.json({
      ok: true,
      data: result.rows,
      items: result.rows,
      total: result.rows.length,
    });
  } catch (error: any) {
    console.error("GET /api/events/[id]/results failed:", error);

    return NextResponse.json(
      {
        ok: false,
        message: error?.message || "Results event belum bisa dimuat.",
        error: error?.message || "Results event belum bisa dimuat.",
      },
      { status: 500 },
    );
  }
}
