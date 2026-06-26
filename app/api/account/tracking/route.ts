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
  full_name: string;
  phone: string | null;
  status: string;
  role: string;
  athlete_type?: string | null;
  photo_url?: string | null;
};

type TableCache = Map<string, boolean>;
type ColumnCache = Map<string, boolean>;

function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json(
    { ok: false, message, ...(extra || {}) },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

function safeString(value: unknown, fallback = "") {
  if (value === null || value === undefined) return fallback;
  const text = String(value);
  return text || fallback;
}

function safeNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function ident(name: string) {
  return `"${name.replace(/"/g, '""')}"`;
}

async function tableExists(client: any, cache: TableCache, tableName: string) {
  if (cache.has(tableName)) return cache.get(tableName)!;

  const result = await client.query(
    `select to_regclass($1) is not null as exists`,
    [`public.${tableName}`]
  );

  const exists = Boolean(result.rows?.[0]?.exists);
  cache.set(tableName, exists);
  return exists;
}

async function columnExists(client: any, cache: ColumnCache, tableName: string, columnName: string) {
  const key = `${tableName}.${columnName}`;
  if (cache.has(key)) return cache.get(key)!;

  const result = await client.query(
    `select exists (
       select 1
       from information_schema.columns
       where table_schema = 'public'
         and table_name = $1
         and column_name = $2
     ) as exists`,
    [tableName, columnName]
  );

  const exists = Boolean(result.rows?.[0]?.exists);
  cache.set(key, exists);
  return exists;
}

async function firstExistingColumn(client: any, cache: ColumnCache, tableName: string, candidates: string[]) {
  for (const column of candidates) {
    if (await columnExists(client, cache, tableName, column)) return column;
  }

  return null;
}

async function getCurrentUser(client: any, req: NextRequest): Promise<{ user: DbUser | null; debug: Record<string, unknown> }> {
  const cookieNames = req.cookies.getAll().map((item) => item.name);
  const token = req.cookies.get("amost_session")?.value || "";

  if (!token) {
    return {
      user: null,
      debug: {
        reason: "amost_session_cookie_not_found",
        cookie_names: cookieNames,
      },
    };
  }

  const tokenHash = hashSessionToken(token);

  const result = await client.query(
    `select
       users.id::text as id,
       users.full_name::text as full_name,
       users.email::text as email,
       users.phone::text as phone,
       users.status::text as status,
       roles.name::text as role,
       sessions.expires_at
     from sessions
     join users on users.id = sessions.user_id
     join roles on roles.id = users.role_id
     where sessions.token_hash = $1
       and sessions.expires_at > now()
     limit 1`,
    [tokenHash]
  );

  if (!result.rowCount) {
    return {
      user: null,
      debug: {
        reason: "amost_session_not_matched_or_expired",
        cookie_names: cookieNames,
      },
    };
  }

  const row = result.rows[0];
  const fullName = safeString(row.full_name, "Member AMOST");

  return {
    user: {
      id: safeString(row.id),
      email: safeString(row.email),
      username: safeString(row.email).split("@")[0] || safeString(row.id),
      name: fullName || safeString(row.email) || "Member AMOST",
      full_name: fullName,
      phone: row.phone ?? null,
      status: safeString(row.status, "active"),
      role: safeString(row.role, "umum"),
      athlete_type: null,
      photo_url: null,
    },
    debug: { matched: true, source: "amost_session" },
  };
}

async function getEventTracking(client: any, tableCache: TableCache, columnCache: ColumnCache, user: DbUser) {
  const hasEvents = await tableExists(client, tableCache, "events");
  if (!hasEvents) return [];

  const registrationTable = (await tableExists(client, tableCache, "event_registrations"))
    ? "event_registrations"
    : (await tableExists(client, tableCache, "event_joins"))
      ? "event_joins"
      : null;

  if (!registrationTable) return [];

  const eventIdCol = await firstExistingColumn(client, columnCache, "events", ["id", "event_id"]);
  const eventNameCol = await firstExistingColumn(client, columnCache, "events", ["title", "event_title", "event_name", "name"]);
  const eventStatusCol = await firstExistingColumn(client, columnCache, "events", ["status", "event_status"]);
  const eventDateCol = await firstExistingColumn(client, columnCache, "events", ["event_date", "start_date", "date", "start_time", "created_at"]);

  const regEventCol = await firstExistingColumn(client, columnCache, registrationTable, ["event_id", "training_id"]);
  const regUserCol = await firstExistingColumn(client, columnCache, registrationTable, ["user_id", "member_id", "athlete_id", "account_id"]);
  const regBibCol = await firstExistingColumn(client, columnCache, registrationTable, ["participant_number", "bib_number", "nomor_peserta", "start_number", "registration_number"]);
  const regStatusCol = await firstExistingColumn(client, columnCache, registrationTable, ["registration_status", "status", "join_status"]);
  const regCreatedCol = await firstExistingColumn(client, columnCache, registrationTable, ["created_at", "registered_at", "joined_at"]);

  if (!eventIdCol || !regEventCol || !regUserCol) return [];

  const hasResults = await tableExists(client, tableCache, "training_results");
  const resultEventCol = hasResults ? await firstExistingColumn(client, columnCache, "training_results", ["event_id", "training_id"]) : null;
  const resultUserCol = hasResults ? await firstExistingColumn(client, columnCache, "training_results", ["user_id", "member_id", "athlete_id", "account_id"]) : null;
  const resultDistanceCol = hasResults ? await firstExistingColumn(client, columnCache, "training_results", ["distance_km", "distance", "total_distance_km"]) : null;
  const resultTimeCol = hasResults ? await firstExistingColumn(client, columnCache, "training_results", ["moving_time_seconds", "duration_seconds", "elapsed_time_seconds", "time_seconds"]): null;
  const resultAvgSpeedCol = hasResults ? await firstExistingColumn(client, columnCache, "training_results", ["avg_speed_kmh", "average_speed_kmh", "avg_speed"]): null;
  const resultStatusCol = hasResults ? await firstExistingColumn(client, columnCache, "training_results", ["status", "result_status", "finish_status"]): null;
  const resultCreatedCol = hasResults ? await firstExistingColumn(client, columnCache, "training_results", ["finished_at", "created_at", "updated_at"]): null;

  const canJoinResult = Boolean(hasResults && resultEventCol && resultUserCol);
  const orderParts = [
    canJoinResult && resultCreatedCol ? `r.${ident(resultCreatedCol)}` : "",
    eventDateCol ? `e.${ident(eventDateCol)}` : "",
    regCreatedCol ? `j.${ident(regCreatedCol)}` : "",
  ].filter(Boolean);
  const orderClause = orderParts.length
    ? orderParts.map((part) => `${part} desc nulls last`).join(", ")
    : `e.${ident(eventIdCol)} desc`;

  const result = await client.query(
    `select
       e.${ident(eventIdCol)}::text as event_id,
       ${eventNameCol ? `e.${ident(eventNameCol)}::text` : `('Event #' || e.${ident(eventIdCol)}::text)`} as event_name,
       ${eventStatusCol ? `e.${ident(eventStatusCol)}::text` : `'UNKNOWN'::text`} as event_status,
       ${eventDateCol ? `e.${ident(eventDateCol)}` : `null`} as event_date,
       ${regBibCol ? `j.${ident(regBibCol)}::text` : `null::text`} as bib_number,
       ${regStatusCol ? `j.${ident(regStatusCol)}::text` : `'JOINED'::text`} as join_status,
       ${regCreatedCol ? `j.${ident(regCreatedCol)}` : `null`} as joined_at,
       ${canJoinResult && resultDistanceCol ? `r.${ident(resultDistanceCol)}` : `null`} as distance_km,
       ${canJoinResult && resultTimeCol ? `r.${ident(resultTimeCol)}` : `null`} as moving_time_seconds,
       ${canJoinResult && resultAvgSpeedCol ? `r.${ident(resultAvgSpeedCol)}` : `null`} as avg_speed_kmh,
       ${canJoinResult && resultStatusCol ? `r.${ident(resultStatusCol)}::text` : `null::text`} as result_status,
       ${canJoinResult && resultCreatedCol ? `r.${ident(resultCreatedCol)}` : `null`} as result_at
     from ${ident(registrationTable)} j
     join events e on e.${ident(eventIdCol)}::text = j.${ident(regEventCol)}::text
     ${canJoinResult ? `
       left join training_results r
         on r.${ident(resultEventCol!)}::text = e.${ident(eventIdCol)}::text
        and r.${ident(resultUserCol!)}::text = j.${ident(regUserCol)}::text
     ` : ""}
     where j.${ident(regUserCol)}::text = $1
     order by ${orderClause}
     limit 100`,
    [user.id]
  );

  return result.rows.map((row: any) => ({
    event_id: safeString(row.event_id),
    event_name: safeString(row.event_name, "Event AMOST"),
    event_status: safeString(row.event_status, "UNKNOWN"),
    event_date: row.event_date,
    bib_number: row.bib_number,
    join_status: safeString(row.join_status, "JOINED"),
    joined_at: row.joined_at,
    distance_km: row.distance_km === null ? null : safeNumber(row.distance_km),
    moving_time_seconds: row.moving_time_seconds === null ? null : safeNumber(row.moving_time_seconds),
    avg_speed_kmh: row.avg_speed_kmh === null ? null : safeNumber(row.avg_speed_kmh),
    result_status: row.result_status,
    result_at: row.result_at,
  }));
}

async function getPersonalTracking(client: any, tableCache: TableCache, columnCache: ColumnCache, user: DbUser) {
  const hasPersonal = await tableExists(client, tableCache, "personal_trainings");
  if (!hasPersonal) return [];

  const idCol = await firstExistingColumn(client, columnCache, "personal_trainings", ["id", "training_id"]);
  const userCol = await firstExistingColumn(client, columnCache, "personal_trainings", ["user_id", "member_id", "athlete_id", "account_id"]);
  const titleCol = await firstExistingColumn(client, columnCache, "personal_trainings", ["title", "name", "activity_name"]);
  const distanceCol = await firstExistingColumn(client, columnCache, "personal_trainings", ["distance_km", "distance", "total_distance_km"]);
  const timeCol = await firstExistingColumn(client, columnCache, "personal_trainings", ["moving_time_seconds", "duration_seconds", "elapsed_time_seconds", "time_seconds"]);
  const avgSpeedCol = await firstExistingColumn(client, columnCache, "personal_trainings", ["avg_speed_kmh", "average_speed_kmh", "avg_speed"]);
  const elevationCol = await firstExistingColumn(client, columnCache, "personal_trainings", ["elevation_gain_m", "total_elevation_gain", "gain_m"]);
  const startedCol = await firstExistingColumn(client, columnCache, "personal_trainings", ["started_at", "start_time", "created_at"]);
  const finishedCol = await firstExistingColumn(client, columnCache, "personal_trainings", ["finished_at", "end_time", "updated_at"]);
  const statusCol = await firstExistingColumn(client, columnCache, "personal_trainings", ["status", "activity_status"]);

  if (!idCol || !userCol) return [];

  const orderParts = [finishedCol ? ident(finishedCol) : "", startedCol ? ident(startedCol) : ""].filter(Boolean);
  const orderClause = orderParts.length ? orderParts.map((part) => `${part} desc nulls last`).join(", ") : `${ident(idCol)} desc`;

  const result = await client.query(
    `select
       ${ident(idCol)}::text as id,
       ${titleCol ? `${ident(titleCol)}::text` : `'Latihan Mandiri'::text`} as title,
       ${distanceCol ? ident(distanceCol) : `null`} as distance_km,
       ${timeCol ? ident(timeCol) : `null`} as moving_time_seconds,
       ${avgSpeedCol ? ident(avgSpeedCol) : `null`} as avg_speed_kmh,
       ${elevationCol ? ident(elevationCol) : `null`} as elevation_gain_m,
       ${startedCol ? ident(startedCol) : `null`} as started_at,
       ${finishedCol ? ident(finishedCol) : `null`} as finished_at,
       ${statusCol ? `${ident(statusCol)}::text` : `'SAVED'::text`} as status
     from personal_trainings
     where ${ident(userCol)}::text = $1
     order by ${orderClause}
     limit 100`,
    [user.id]
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
    status: safeString(row.status, "SAVED"),
  }));
}

async function getLiveTracking(client: any, tableCache: TableCache, columnCache: ColumnCache, user: DbUser) {
  const hasPositions = await tableExists(client, tableCache, "live_tracking_positions");
  if (!hasPositions) return [];

  const userCol = await firstExistingColumn(client, columnCache, "live_tracking_positions", ["user_id", "member_id", "athlete_id", "account_id"]);
  const eventCol = await firstExistingColumn(client, columnCache, "live_tracking_positions", ["event_id", "training_id"]);
  const latCol = await firstExistingColumn(client, columnCache, "live_tracking_positions", ["lat", "latitude"]);
  const lngCol = await firstExistingColumn(client, columnCache, "live_tracking_positions", ["lng", "lon", "longitude"]);
  const speedCol = await firstExistingColumn(client, columnCache, "live_tracking_positions", ["speed_kmh", "speed"]);
  const distanceCol = await firstExistingColumn(client, columnCache, "live_tracking_positions", ["distance_km", "distance"]);
  const updatedCol = await firstExistingColumn(client, columnCache, "live_tracking_positions", ["updated_at", "recorded_at", "created_at", "timestamp"]);
  const statusCol = await firstExistingColumn(client, columnCache, "live_tracking_positions", ["status", "tracking_status"]);

  if (!userCol || !latCol || !lngCol) return [];

  const result = await client.query(
    `select
       ${eventCol ? `${ident(eventCol)}::text` : `null::text`} as event_id,
       ${ident(latCol)} as lat,
       ${ident(lngCol)} as lng,
       ${speedCol ? ident(speedCol) : `null`} as speed_kmh,
       ${distanceCol ? ident(distanceCol) : `null`} as distance_km,
       ${updatedCol ? ident(updatedCol) : `null`} as updated_at,
       ${statusCol ? `${ident(statusCol)}::text` : `'LIVE'::text`} as status
     from live_tracking_positions
     where ${ident(userCol)}::text = $1
     order by ${updatedCol ? ident(updatedCol) : ident(latCol)} desc nulls last
     limit 5`,
    [user.id]
  );

  return result.rows.map((row: any) => ({
    event_id: row.event_id,
    lat: safeNumber(row.lat),
    lng: safeNumber(row.lng),
    speed_kmh: row.speed_kmh === null ? null : safeNumber(row.speed_kmh),
    distance_km: row.distance_km === null ? null : safeNumber(row.distance_km),
    updated_at: row.updated_at,
    status: safeString(row.status, "LIVE"),
  }));
}

function buildSummary(eventTracking: any[], personalTracking: any[], liveTracking: any[]) {
  const completedEvents = eventTracking.filter((item) => item.result_at || item.result_status).length;
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
    const hasSessions = await tableExists(client, tableCache, "sessions");
    const hasUsers = await tableExists(client, tableCache, "users");
    const hasRoles = await tableExists(client, tableCache, "roles");

    if (!hasSessions || !hasUsers || !hasRoles) {
      return jsonError("Tabel sessions/users/roles belum lengkap di database.", 500, {
        debug: { has_sessions: hasSessions, has_users: hasUsers, has_roles: hasRoles },
      });
    }

    const { user, debug } = await getCurrentUser(client, req);

    if (!user) {
      return jsonError("Sesi login tidak ditemukan. Silakan login ulang.", 401, { debug });
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
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error: any) {
    console.error("/api/account/tracking error", error);
    return jsonError(error?.message || "Gagal mengambil data tracking account.", 500);
  } finally {
    client.release();
  }
}
