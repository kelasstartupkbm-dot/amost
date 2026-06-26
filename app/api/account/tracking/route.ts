import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hashSessionToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DbUser = {
  id: string;
  email: string;
  username: string;
  name: string;
  role: string;
  athlete_type?: string | null;
  photo_url?: string | null;
};

type TableCache = Map<string, boolean>;
type ColumnCache = Map<string, boolean>;

function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json(
    { ok: false, message, ...(extra || {}) },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function cleanValue(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function safeNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function safeString(value: unknown, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function ident(name: string) {
  return `"${name.replace(/"/g, '""')}"`;
}

async function tableExists(client: any, cache: TableCache, tableName: string) {
  if (cache.has(tableName)) return cache.get(tableName)!;

  const result = await client.query("select to_regclass($1) is not null as exists", [
    `public.${tableName}`,
  ]);

  const exists = Boolean(result.rows?.[0]?.exists);
  cache.set(tableName, exists);
  return exists;
}

async function columnExists(client: any, cache: ColumnCache, tableName: string, columnName: string) {
  const key = `${tableName}.${columnName}`;
  if (cache.has(key)) return cache.get(key)!;

  const result = await client.query(
    `
      select exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = $1
          and column_name = $2
      ) as exists
    `,
    [tableName, columnName],
  );

  const exists = Boolean(result.rows?.[0]?.exists);
  cache.set(key, exists);
  return exists;
}

async function firstExistingColumn(
  client: any,
  cache: ColumnCache,
  tableName: string,
  candidates: string[],
) {
  for (const column of candidates) {
    if (await columnExists(client, cache, tableName, column)) return column;
  }

  return null;
}

function eventDateExpression(alias: string, columnName: string | null) {
  return columnName ? `${alias}.${ident(columnName)}` : `null::timestamp`;
}

function eventTextExpression(alias: string, columnName: string | null, fallbackSql: string) {
  return columnName ? `${alias}.${ident(columnName)}::text` : fallbackSql;
}

async function getCurrentUser(client: any, req: NextRequest): Promise<DbUser | null> {
  const token = req.cookies.get("amost_session")?.value || "";

  if (!token) return null;

  const tokenHash = hashSessionToken(token);

  const result = await client.query(
    `
      select
        users.id::text as id,
        users.full_name::text as name,
        users.email::text as email,
        coalesce(users.phone::text, '') as username,
        roles.name::text as role,
        sessions.expires_at
      from sessions
      join users on users.id = sessions.user_id
      join roles on roles.id = users.role_id
      where sessions.token_hash = $1
        and sessions.expires_at > now()
      limit 1
    `,
    [tokenHash],
  );

  const row = result.rows?.[0];
  if (!row) return null;

  return {
    id: safeString(row.id),
    email: safeString(row.email),
    username: safeString(row.username),
    name: safeString(row.name || row.email || "AMOST User"),
    role: safeString(row.role || "umum"),
    athlete_type: null,
    photo_url: null,
  };
}

async function getResultColumns(client: any, tableCache: TableCache, columnCache: ColumnCache) {
  const hasResults = await tableExists(client, tableCache, "training_results");

  if (!hasResults) {
    return {
      hasResults: false,
      resultEventCol: null,
      resultUserCol: null,
      resultIdCol: null,
      resultDistanceCol: null,
      resultTimeCol: null,
      resultAvgSpeedCol: null,
      resultStatusCol: null,
      resultCreatedCol: null,
    };
  }

  return {
    hasResults,
    resultEventCol: await firstExistingColumn(client, columnCache, "training_results", [
      "event_id",
      "training_id",
    ]),
    resultUserCol: await firstExistingColumn(client, columnCache, "training_results", [
      "user_id",
      "member_id",
      "athlete_id",
    ]),
    resultIdCol: await firstExistingColumn(client, columnCache, "training_results", ["id"]),
    resultDistanceCol: await firstExistingColumn(client, columnCache, "training_results", [
      "distance_km",
      "distance",
      "total_distance_km",
    ]),
    resultTimeCol: await firstExistingColumn(client, columnCache, "training_results", [
      "moving_time_seconds",
      "duration_seconds",
      "elapsed_time_seconds",
      "time_seconds",
    ]),
    resultAvgSpeedCol: await firstExistingColumn(client, columnCache, "training_results", [
      "avg_speed_kmh",
      "average_speed_kmh",
      "avg_speed",
    ]),
    resultStatusCol: await firstExistingColumn(client, columnCache, "training_results", [
      "status",
      "result_status",
      "finish_status",
    ]),
    resultCreatedCol: await firstExistingColumn(client, columnCache, "training_results", [
      "finished_at",
      "created_at",
      "updated_at",
    ]),
  };
}

async function getEventRowsFromSource(input: {
  client: any;
  tableCache: TableCache;
  columnCache: ColumnCache;
  user: DbUser;
  sourceTable: string;
  sourceLabel: string;
}) {
  const { client, tableCache, columnCache, user, sourceTable, sourceLabel } = input;

  const hasEvents = await tableExists(client, tableCache, "events");
  const hasSource = await tableExists(client, tableCache, sourceTable);

  if (!hasEvents || !hasSource) return [];

  const eventIdCol = await firstExistingColumn(client, columnCache, "events", ["id", "event_id"]);
  const eventNameCol = await firstExistingColumn(client, columnCache, "events", [
    "title",
    "event_title",
    "event_name",
    "name",
  ]);
  const eventStatusCol = await firstExistingColumn(client, columnCache, "events", [
    "status",
    "event_status",
  ]);
  const eventDateCol = await firstExistingColumn(client, columnCache, "events", [
    "event_date",
    "start_date",
    "date",
    "start_time",
    "created_at",
  ]);

  const gpxColumns = (
    await Promise.all(
      [
        "gpx_content",
        "gpx_file",
        "gpx_filename",
        "route_file",
        "route_name",
        "route_path_json",
        "gpx_url",
      ].map(async (column) =>
        (await columnExists(client, columnCache, "events", column)) ? column : null,
      ),
    )
  ).filter(Boolean) as string[];

  const sourceEventCol = await firstExistingColumn(client, columnCache, sourceTable, [
    "event_id",
    "training_id",
  ]);
  const sourceUserCol = await firstExistingColumn(client, columnCache, sourceTable, [
    "user_id",
    "member_id",
    "athlete_id",
  ]);
  const sourceBibCol = await firstExistingColumn(client, columnCache, sourceTable, [
    "participant_number",
    "registration_number",
    "bib_number",
    "bib",
    "number",
    "nomor_peserta",
    "start_number",
  ]);
  const sourceStatusCol = await firstExistingColumn(client, columnCache, sourceTable, [
    "status",
    "registration_status",
    "join_status",
  ]);
  const sourceCreatedCol = await firstExistingColumn(client, columnCache, sourceTable, [
    "created_at",
    "joined_at",
    "registered_at",
    "updated_at",
  ]);

  if (!eventIdCol || !sourceEventCol || !sourceUserCol) return [];

  const resultColumns = await getResultColumns(client, tableCache, columnCache);
  const canJoinResult = Boolean(
    resultColumns.hasResults &&
      resultColumns.resultEventCol &&
      resultColumns.resultUserCol,
  );

  const resultOrderCol =
    resultColumns.resultCreatedCol ||
    resultColumns.resultIdCol ||
    resultColumns.resultEventCol;

  const resultLateral = canJoinResult
    ? `
      left join lateral (
        select
          ${
            resultColumns.resultDistanceCol
              ? `r.${ident(resultColumns.resultDistanceCol)}`
              : `null`
          } as distance_km,
          ${resultColumns.resultTimeCol ? `r.${ident(resultColumns.resultTimeCol)}` : `null`} as moving_time_seconds,
          ${
            resultColumns.resultAvgSpeedCol
              ? `r.${ident(resultColumns.resultAvgSpeedCol)}`
              : `null`
          } as avg_speed_kmh,
          ${
            resultColumns.resultStatusCol
              ? `r.${ident(resultColumns.resultStatusCol)}::text`
              : `null::text`
          } as result_status,
          ${
            resultColumns.resultCreatedCol
              ? `r.${ident(resultColumns.resultCreatedCol)}`
              : `null`
          } as result_at
        from training_results r
        where r.${ident(resultColumns.resultEventCol!)}::text = e.${ident(eventIdCol)}::text
          and r.${ident(resultColumns.resultUserCol!)}::text = j.${ident(sourceUserCol)}::text
        order by r.${ident(resultOrderCol!)} desc nulls last
        limit 1
      ) r on true
    `
    : "";

  const canDownloadGpxExpr = gpxColumns.length
    ? `case when concat_ws('', ${gpxColumns
        .map((column) => `e.${ident(column)}::text`)
        .join(", ")}) <> '' then true else false end`
    : `false`;

  const orderParts = [
    canJoinResult && resultColumns.resultCreatedCol ? `r.result_at` : "",
    eventDateCol ? `e.${ident(eventDateCol)}` : "",
    sourceCreatedCol ? `j.${ident(sourceCreatedCol)}` : "",
  ].filter(Boolean);

  const orderClause = orderParts.length
    ? orderParts.map((part) => `${part} desc nulls last`).join(", ")
    : `e.${ident(eventIdCol)} desc`;

  const result = await client.query(
    `
      select
        e.${ident(eventIdCol)}::text as event_id,
        ${eventTextExpression("e", eventNameCol, `('Event #' || e.${ident(eventIdCol)}::text)`)} as event_name,
        ${eventTextExpression("e", eventStatusCol, `'UNKNOWN'::text`)} as event_status,
        ${eventDateExpression("e", eventDateCol)} as event_date,
        ${sourceBibCol ? `j.${ident(sourceBibCol)}::text` : `null::text`} as bib_number,
        ${sourceStatusCol ? `j.${ident(sourceStatusCol)}::text` : `'registered'::text`} as join_status,
        ${sourceCreatedCol ? `j.${ident(sourceCreatedCol)}` : `null::timestamp`} as joined_at,
        ${canDownloadGpxExpr} as can_download_gpx,
        ${canJoinResult ? `r.distance_km` : `null`} as distance_km,
        ${canJoinResult ? `r.moving_time_seconds` : `null`} as moving_time_seconds,
        ${canJoinResult ? `r.avg_speed_kmh` : `null`} as avg_speed_kmh,
        ${canJoinResult ? `r.result_status` : `null::text`} as result_status,
        ${canJoinResult ? `r.result_at` : `null::timestamp`} as result_at,
        $2::text as source
      from ${ident(sourceTable)} j
      join events e on e.${ident(eventIdCol)}::text = j.${ident(sourceEventCol)}::text
      ${resultLateral}
      where j.${ident(sourceUserCol)}::text = $1
      order by ${orderClause}
      limit 100
    `,
    [user.id, sourceLabel],
  );

  return result.rows.map((row: any) => ({
    event_id: safeString(row.event_id),
    event_name: safeString(row.event_name, "Event AMOST"),
    event_status: safeString(row.event_status, "UNKNOWN"),
    event_date: row.event_date,
    bib_number: row.bib_number,
    join_status: safeString(row.join_status, "registered"),
    joined_at: row.joined_at,
    distance_km: row.distance_km === null ? null : safeNumber(row.distance_km),
    moving_time_seconds:
      row.moving_time_seconds === null ? null : safeNumber(row.moving_time_seconds),
    avg_speed_kmh: row.avg_speed_kmh === null ? null : safeNumber(row.avg_speed_kmh),
    result_status: row.result_status,
    result_at: row.result_at,
    can_download_gpx: Boolean(row.can_download_gpx),
    detail_url: `/events/${safeString(row.event_id)}`,
    live_url: `/event/${safeString(row.event_id)}/view`,
    result_url: `/event/${safeString(row.event_id)}/view?panel=result`,
    gpx_url: `/api/gpx-download?id=${encodeURIComponent(safeString(row.event_id))}`,
    source: safeString(row.source, sourceLabel),
  }));
}

async function getEventTracking(client: any, tableCache: TableCache, columnCache: ColumnCache, user: DbUser) {
  const rows = [
    ...(await getEventRowsFromSource({
      client,
      tableCache,
      columnCache,
      user,
      sourceTable: "event_registrations",
      sourceLabel: "registration",
    })),
    ...(await getEventRowsFromSource({
      client,
      tableCache,
      columnCache,
      user,
      sourceTable: "event_joins",
      sourceLabel: "join",
    })),
  ];

  const map = new Map<string, any>();

  for (const row of rows) {
    const key = `${row.event_id}|${row.bib_number || ""}`;

    if (!map.has(key)) {
      map.set(key, row);
      continue;
    }

    const existing = map.get(key);
    const existingHasResult = Boolean(existing.result_at || existing.result_status || existing.distance_km);
    const rowHasResult = Boolean(row.result_at || row.result_status || row.distance_km);

    if (rowHasResult && !existingHasResult) {
      map.set(key, row);
    }
  }

  return Array.from(map.values());
}

async function getPersonalTracking(client: any, tableCache: TableCache, columnCache: ColumnCache, user: DbUser) {
  const hasPersonal = await tableExists(client, tableCache, "personal_trainings");
  if (!hasPersonal) return [];

  const idCol = await firstExistingColumn(client, columnCache, "personal_trainings", ["id", "training_id"]);
  const userCol = await firstExistingColumn(client, columnCache, "personal_trainings", [
    "user_id",
    "member_id",
    "athlete_id",
  ]);
  const titleCol = await firstExistingColumn(client, columnCache, "personal_trainings", [
    "title",
    "name",
    "activity_name",
  ]);
  const distanceCol = await firstExistingColumn(client, columnCache, "personal_trainings", [
    "distance_km",
    "distance",
    "total_distance_km",
  ]);
  const timeCol = await firstExistingColumn(client, columnCache, "personal_trainings", [
    "moving_time_seconds",
    "duration_seconds",
    "elapsed_time_seconds",
    "time_seconds",
  ]);
  const avgSpeedCol = await firstExistingColumn(client, columnCache, "personal_trainings", [
    "avg_speed_kmh",
    "average_speed_kmh",
    "avg_speed",
  ]);
  const elevationCol = await firstExistingColumn(client, columnCache, "personal_trainings", [
    "elevation_gain_m",
    "total_elevation_gain",
    "gain_m",
  ]);
  const startedCol = await firstExistingColumn(client, columnCache, "personal_trainings", [
    "started_at",
    "start_time",
    "created_at",
  ]);
  const finishedCol = await firstExistingColumn(client, columnCache, "personal_trainings", [
    "finished_at",
    "end_time",
    "updated_at",
  ]);
  const statusCol = await firstExistingColumn(client, columnCache, "personal_trainings", [
    "status",
    "activity_status",
  ]);

  if (!idCol || !userCol) return [];

  const orderParts = [finishedCol ? ident(finishedCol) : "", startedCol ? ident(startedCol) : ""].filter(Boolean);
  const orderClause = orderParts.length
    ? orderParts.map((part) => `${part} desc nulls last`).join(", ")
    : `${ident(idCol)} desc`;

  const result = await client.query(
    `
      select
        ${ident(idCol)}::text as id,
        ${titleCol ? `${ident(titleCol)}::text` : `'Latihan Mandiri'::text`} as title,
        ${distanceCol ? ident(distanceCol) : `null`} as distance_km,
        ${timeCol ? ident(timeCol) : `null`} as moving_time_seconds,
        ${avgSpeedCol ? ident(avgSpeedCol) : `null`} as avg_speed_kmh,
        ${elevationCol ? ident(elevationCol) : `null`} as elevation_gain_m,
        ${startedCol ? ident(startedCol) : `null::timestamp`} as started_at,
        ${finishedCol ? ident(finishedCol) : `null::timestamp`} as finished_at,
        ${statusCol ? `${ident(statusCol)}::text` : `'saved'::text`} as status
      from personal_trainings
      where ${ident(userCol)}::text = $1
      order by ${orderClause}
      limit 100
    `,
    [user.id],
  );

  return result.rows.map((row: any) => ({
    id: safeString(row.id),
    title: safeString(row.title, "Latihan Mandiri"),
    distance_km: row.distance_km === null ? null : safeNumber(row.distance_km),
    moving_time_seconds: row.moving_time_seconds === null ? null : safeNumber(row.moving_time_seconds),
    avg_speed_kmh: row.avg_speed_kmh === null ? null : safeNumber(row.avg_speed_kmh),
    elevation_gain_m: row.elevation_gain_m === null ? null : safeNumber(row.elevation_gain_m),
    started_at: row.started_at,
    finished_at: row.finished_at,
    status: safeString(row.status, "saved"),
  }));
}

async function getLiveTracking(client: any, tableCache: TableCache, columnCache: ColumnCache, user: DbUser) {
  const hasPositions = await tableExists(client, tableCache, "live_tracking_positions");
  if (!hasPositions) return [];

  const userCol = await firstExistingColumn(client, columnCache, "live_tracking_positions", [
    "user_id",
    "member_id",
    "athlete_id",
  ]);
  const eventCol = await firstExistingColumn(client, columnCache, "live_tracking_positions", [
    "event_id",
    "training_id",
  ]);
  const latCol = await firstExistingColumn(client, columnCache, "live_tracking_positions", ["lat", "latitude"]);
  const lngCol = await firstExistingColumn(client, columnCache, "live_tracking_positions", [
    "lng",
    "lon",
    "longitude",
  ]);
  const speedCol = await firstExistingColumn(client, columnCache, "live_tracking_positions", ["speed_kmh", "speed"]);
  const distanceCol = await firstExistingColumn(client, columnCache, "live_tracking_positions", [
    "distance_km",
    "distance",
  ]);
  const updatedCol = await firstExistingColumn(client, columnCache, "live_tracking_positions", [
    "updated_at",
    "recorded_at",
    "created_at",
    "timestamp",
  ]);
  const statusCol = await firstExistingColumn(client, columnCache, "live_tracking_positions", [
    "status",
    "tracking_status",
  ]);

  if (!userCol || !latCol || !lngCol) return [];

  const result = await client.query(
    `
      select
        ${eventCol ? `${ident(eventCol)}::text` : `null::text`} as event_id,
        ${ident(latCol)} as lat,
        ${ident(lngCol)} as lng,
        ${speedCol ? ident(speedCol) : `null`} as speed_kmh,
        ${distanceCol ? ident(distanceCol) : `null`} as distance_km,
        ${updatedCol ? ident(updatedCol) : `null::timestamp`} as updated_at,
        ${statusCol ? `${ident(statusCol)}::text` : `'live'::text`} as status
      from live_tracking_positions
      where ${ident(userCol)}::text = $1
      order by ${updatedCol ? ident(updatedCol) : ident(latCol)} desc nulls last
      limit 5
    `,
    [user.id],
  );

  return result.rows.map((row: any) => ({
    event_id: row.event_id,
    lat: safeNumber(row.lat),
    lng: safeNumber(row.lng),
    speed_kmh: row.speed_kmh === null ? null : safeNumber(row.speed_kmh),
    distance_km: row.distance_km === null ? null : safeNumber(row.distance_km),
    updated_at: row.updated_at,
    status: safeString(row.status, "live"),
  }));
}

function buildSummary(eventTracking: any[], personalTracking: any[], liveTracking: any[]) {
  const completedEvents = eventTracking.filter((item) =>
    Boolean(item.result_at || item.result_status || safeNumber(item.distance_km) > 0),
  ).length;
  const eventDistance = eventTracking.reduce((sum, item) => sum + safeNumber(item.distance_km), 0);
  const personalDistance = personalTracking.reduce((sum, item) => sum + safeNumber(item.distance_km), 0);
  const eventSeconds = eventTracking.reduce((sum, item) => sum + safeNumber(item.moving_time_seconds), 0);
  const personalSeconds = personalTracking.reduce((sum, item) => sum + safeNumber(item.moving_time_seconds), 0);

  const dates = [
    ...eventTracking.map((item) => item.result_at || item.event_date || item.joined_at),
    ...personalTracking.map((item) => item.finished_at || item.started_at),
    ...liveTracking.map((item) => item.updated_at),
  ].filter(Boolean);

  dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return {
    joined_events: eventTracking.length,
    completed_events: completedEvents,
    personal_trainings: personalTracking.length,
    live_sessions: liveTracking.length,
    total_distance_km: Number((eventDistance + personalDistance).toFixed(2)),
    total_moving_time_seconds: eventSeconds + personalSeconds,
    last_activity_at: dates[0] || null,
  };
}

export async function GET(req: NextRequest) {
  const db = getDb();
  const client = await db.connect();
  const tableCache: TableCache = new Map();
  const columnCache: ColumnCache = new Map();

  try {
    const hasUsers = await tableExists(client, tableCache, "users");
    const hasSessions = await tableExists(client, tableCache, "sessions");

    if (!hasUsers || !hasSessions) {
      return jsonError("Tabel users/sessions belum ditemukan di database.", 500);
    }

    const user = await getCurrentUser(client, req);

    if (!user) {
      return jsonError("Sesi login tidak ditemukan. Silakan login ulang.", 401);
    }

    const [eventTracking, personalTracking, liveTracking] = await Promise.all([
      getEventTracking(client, tableCache, columnCache, user),
      getPersonalTracking(client, tableCache, columnCache, user),
      getLiveTracking(client, tableCache, columnCache, user),
    ]);

    return NextResponse.json(
      {
        ok: true,
        user,
        summary: buildSummary(eventTracking, personalTracking, liveTracking),
        live_tracking: liveTracking,
        event_tracking: eventTracking,
        personal_tracking: personalTracking,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error: any) {
    console.error("/api/account/tracking error", error);
    return jsonError(error?.message || "Gagal mengambil data tracking account.", 500);
  } finally {
    client.release();
  }
}
