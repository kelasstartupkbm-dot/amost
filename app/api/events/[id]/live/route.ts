import { NextRequest, NextResponse } from "next/server";
import { dbQuery } from "../../../../lib/amostDb";
import { getCurrentAmostUser } from "../../../../lib/amostServerAuth";

export const dynamic = "force-dynamic";

type LivePoint = {
  lat: number;
  lng: number;
  ele?: number | null;
  time?: string | null;
};

function ident(name: string) {
  return `"${name.replace(/"/g, '""')}"`;
}

function toPositiveBigInt(value: unknown) {
  const clean = String(value || "").trim();
  return /^\d+$/.test(clean) ? clean : null;
}

function safeNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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

function normalizePoint(item: any): LivePoint | null {
  if (Array.isArray(item)) {
    const lat = safeNumber(item[0]);
    const lng = safeNumber(item[1]);

    if (lat === null || lng === null) return null;

    return {
      lat,
      lng,
      ele: safeNumber(item[2]),
      time: typeof item[3] === "string" ? item[3] : null,
    };
  }

  if (!item || typeof item !== "object") return null;

  const lat = safeNumber(item.lat ?? item.latitude);
  const lng = safeNumber(item.lng ?? item.lon ?? item.longitude);

  if (lat === null || lng === null) return null;

  return {
    lat,
    lng,
    ele: safeNumber(item.ele ?? item.elevation ?? item.altitude),
    time:
      typeof item.time === "string"
        ? item.time
        : typeof item.timestamp === "string"
          ? item.timestamp
          : null,
  };
}

function parseRoutePathJson(value: unknown): LivePoint[] {
  if (!value) return [];

  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    const array = Array.isArray(parsed)
      ? parsed
      : Array.isArray((parsed as any)?.points)
        ? (parsed as any).points
        : Array.isArray((parsed as any)?.route)
          ? (parsed as any).route
          : Array.isArray((parsed as any)?.coordinates)
            ? (parsed as any).coordinates
            : [];

    return array.map(normalizePoint).filter(Boolean) as LivePoint[];
  } catch {
    return [];
  }
}

async function getEventRoutePoints(eventId: string) {
  if (!(await hasTable("events"))) return [];

  const columns = await getColumns("events");
  const idCol = pickColumn(columns, ["id", "event_id"]) || "id";
  const routeJsonCol = pickColumn(columns, [
    "route_path_json",
    "route_points_json",
    "path_json",
    "gpx_points_json",
  ]);

  if (!routeJsonCol) return [];

  const result = await dbQuery(
    `
      SELECT ${ident(routeJsonCol)} AS route_path_json
      FROM events
      WHERE ${ident(idCol)}::text = $1
      LIMIT 1
    `,
    [eventId],
  );

  return parseRoutePathJson(result.rows[0]?.route_path_json).slice(0, 2000);
}

async function getRegisteredParticipants(eventId: string) {
  const hasRegistrations = await hasTable("event_registrations");
  const hasUsers = await hasTable("users");

  if (!hasRegistrations) return [];

  const registrationColumns = await getColumns("event_registrations");
  const userColumns = hasUsers ? await getColumns("users") : [];

  const eventCol = pickColumn(registrationColumns, ["event_id", "training_id"]);
  const userCol = pickColumn(registrationColumns, ["user_id", "member_id", "athlete_id"]);
  const numberCol = pickColumn(registrationColumns, [
    "participant_number",
    "registration_number",
    "bib_number",
    "bib",
    "number",
    "nomor_peserta",
  ]);
  const statusCol = pickColumn(registrationColumns, ["status", "registration_status", "join_status"]);
  const createdCol = pickColumn(registrationColumns, ["created_at", "registered_at", "joined_at", "updated_at"]);
  const userNameCol = pickColumn(userColumns, ["full_name", "name", "nama", "username", "email"]);
  const userEmailCol = pickColumn(userColumns, ["email", "user_email"]);

  if (!eventCol || !userCol) return [];

  const result = await dbQuery(
    `
      SELECT
        er.${ident(userCol)}::text AS user_id,
        ${numberCol ? `er.${ident(numberCol)}::text` : `null::text`} AS participant_number,
        ${statusCol ? `er.${ident(statusCol)}::text` : `'registered'::text`} AS registration_status,
        ${createdCol ? `er.${ident(createdCol)}` : `null::timestamp`} AS registered_at,
        ${userNameCol ? `u.${ident(userNameCol)}::text` : `'Peserta AMOST'::text`} AS full_name,
        ${userEmailCol ? `u.${ident(userEmailCol)}::text` : `''::text`} AS email
      FROM event_registrations er
      ${hasUsers ? `LEFT JOIN users u ON u.id::text = er.${ident(userCol)}::text` : ""}
      WHERE er.${ident(eventCol)}::text = $1
      ORDER BY ${numberCol ? `er.${ident(numberCol)}` : `er.${ident(userCol)}`} ASC NULLS LAST
      LIMIT 500
    `,
    [eventId],
  );

  return result.rows.map((row: any) => ({
    user_id: row.user_id,
    full_name: row.full_name || "Peserta AMOST",
    email: row.email || "",
    participant_number: row.participant_number || "-",
    registration_status: row.registration_status || "registered",
    registered_at: row.registered_at,
    live_status: "STANDBY",
  }));
}

async function getLiveMarkers(eventId: string) {
  const hasPositions = await hasTable("live_tracking_positions");

  if (!hasPositions) {
    return {
      rows: [],
      debug: {
        live_tracking_positions: false,
        reason: "Tabel live_tracking_positions belum tersedia.",
      },
    };
  }

  const positionColumns = await getColumns("live_tracking_positions");
  const userColumns = (await hasTable("users")) ? await getColumns("users") : [];
  const registrationColumns = (await hasTable("event_registrations"))
    ? await getColumns("event_registrations")
    : [];

  const idCol = pickColumn(positionColumns, ["id", "position_id"]);
  const eventCol = pickColumn(positionColumns, ["event_id", "training_id"]);
  const userCol = pickColumn(positionColumns, ["user_id", "member_id", "athlete_id"]);
  const latCol = pickColumn(positionColumns, ["lat", "latitude"]);
  const lngCol = pickColumn(positionColumns, ["lng", "lon", "longitude"]);
  const speedCol = pickColumn(positionColumns, ["speed_kmh", "speed"]);
  const distanceCol = pickColumn(positionColumns, ["distance_km", "distance"]);
  const updatedCol = pickColumn(positionColumns, ["updated_at", "recorded_at", "created_at", "timestamp"]);
  const statusCol = pickColumn(positionColumns, ["status", "tracking_status"]);
  const accuracyCol = pickColumn(positionColumns, ["accuracy", "accuracy_m"]);
  const headingCol = pickColumn(positionColumns, ["heading", "bearing", "course"]);

  const debug = {
    live_tracking_positions: true,
    columns: {
      eventCol,
      userCol,
      latCol,
      lngCol,
      updatedCol,
    },
  };

  if (!eventCol || !userCol || !latCol || !lngCol) {
    return {
      rows: [],
      debug: {
        ...debug,
        reason: "Kolom wajib live_tracking_positions belum lengkap.",
      },
    };
  }

  const userNameCol = pickColumn(userColumns, ["full_name", "name", "nama", "username", "email"]);
  const userEmailCol = pickColumn(userColumns, ["email", "user_email"]);
  const registrationEventCol = pickColumn(registrationColumns, ["event_id", "training_id"]);
  const registrationUserCol = pickColumn(registrationColumns, ["user_id", "member_id", "athlete_id"]);
  const registrationNumberCol = pickColumn(registrationColumns, [
    "participant_number",
    "registration_number",
    "bib_number",
    "bib",
    "number",
    "nomor_peserta",
  ]);

  const canJoinRegistration = Boolean(registrationEventCol && registrationUserCol && registrationNumberCol);
  const latestOrderCol = updatedCol || idCol || latCol;

  const result = await dbQuery(
    `
      SELECT *
      FROM (
        SELECT DISTINCT ON (p.${ident(userCol)}::text)
          ${idCol ? `p.${ident(idCol)}::text` : `concat(p.${ident(eventCol)}::text, '-', p.${ident(userCol)}::text)`} AS position_id,
          p.${ident(eventCol)}::text AS event_id,
          p.${ident(userCol)}::text AS user_id,
          ${userNameCol ? `u.${ident(userNameCol)}::text` : `'Peserta AMOST'::text`} AS full_name,
          ${userEmailCol ? `u.${ident(userEmailCol)}::text` : `''::text`} AS email,
          ${canJoinRegistration ? `er.${ident(registrationNumberCol!)}::text` : `null::text`} AS participant_number,
          p.${ident(latCol)} AS lat,
          p.${ident(lngCol)} AS lng,
          ${speedCol ? `p.${ident(speedCol)}` : `null`} AS speed_kmh,
          ${distanceCol ? `p.${ident(distanceCol)}` : `null`} AS distance_km,
          ${updatedCol ? `p.${ident(updatedCol)}` : `null::timestamp`} AS updated_at,
          ${statusCol ? `p.${ident(statusCol)}::text` : `'LIVE'::text`} AS status,
          ${accuracyCol ? `p.${ident(accuracyCol)}` : `null`} AS accuracy_m,
          ${headingCol ? `p.${ident(headingCol)}` : `null`} AS heading
        FROM live_tracking_positions p
        LEFT JOIN users u ON u.id::text = p.${ident(userCol)}::text
        ${
          canJoinRegistration
            ? `
              LEFT JOIN event_registrations er
                ON er.${ident(registrationEventCol!)}::text = p.${ident(eventCol)}::text
               AND er.${ident(registrationUserCol!)}::text = p.${ident(userCol)}::text
            `
            : ""
        }
        WHERE p.${ident(eventCol)}::text = $1
          AND p.${ident(latCol)} IS NOT NULL
          AND p.${ident(lngCol)} IS NOT NULL
        ORDER BY p.${ident(userCol)}::text, p.${ident(latestOrderCol)} DESC NULLS LAST
      ) latest
      ORDER BY ${updatedCol ? "updated_at" : "position_id"} DESC NULLS LAST
      LIMIT 300
    `,
    [eventId],
  );

  const now = Date.now();

  const rows = result.rows.map((row: any) => {
    const updatedTime = row.updated_at ? new Date(row.updated_at).getTime() : 0;
    const secondsAgo = updatedTime ? Math.max(0, Math.floor((now - updatedTime) / 1000)) : null;
    const explicitStatus = String(row.status || "").trim().toLowerCase();
    const isOnline =
      explicitStatus === "online" ||
      explicitStatus === "live" ||
      (secondsAgo !== null && secondsAgo <= 90 && explicitStatus !== "offline");

    return {
      position_id: row.position_id,
      event_id: row.event_id,
      user_id: row.user_id,
      full_name: row.full_name || "Peserta AMOST",
      email: row.email || "",
      participant_number: row.participant_number || "-",
      lat: Number(row.lat),
      lng: Number(row.lng),
      speed_kmh: row.speed_kmh === null ? null : Number(row.speed_kmh),
      distance_km: row.distance_km === null ? null : Number(row.distance_km),
      updated_at: row.updated_at,
      status: row.status || (isOnline ? "LIVE" : "OFFLINE"),
      accuracy_m: row.accuracy_m === null ? null : Number(row.accuracy_m),
      heading: row.heading === null ? null : Number(row.heading),
      seconds_ago: secondsAgo,
      is_online: isOnline,
    };
  });

  return { rows, debug };
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
        { ok: false, message: "Silakan login untuk melihat live tracking." },
        { status: 401 },
      );
    }

    const [routePoints, participants, live] = await Promise.all([
      getEventRoutePoints(eventId),
      getRegisteredParticipants(eventId),
      getLiveMarkers(eventId),
    ]);

    const liveUserIds = new Set(live.rows.map((row: any) => String(row.user_id)));
    const standbyParticipants = participants.filter(
      (participant: any) => !liveUserIds.has(String(participant.user_id)),
    );

    return NextResponse.json({
      ok: true,
      data: live.rows,
      items: live.rows,
      route_points: routePoints,
      registered_participants: participants,
      standby_participants: standbyParticipants,
      total: live.rows.length,
      participant_total: participants.length,
      standby_total: standbyParticipants.length,
      online_count: live.rows.filter((item: any) => item.is_online).length,
      debug: live.debug,
    });
  } catch (error: any) {
    console.error("GET /api/events/[id]/live failed:", error);

    return NextResponse.json(
      {
        ok: false,
        message: error?.message || "Live tracking event belum bisa dimuat.",
        error: error?.message || "Live tracking event belum bisa dimuat.",
      },
      { status: 500 },
    );
  }
}
