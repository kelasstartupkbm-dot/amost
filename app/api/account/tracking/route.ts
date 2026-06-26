import { NextRequest, NextResponse } from "next/server";
import { getPgPool, safeNumber, safeString } from "@/lib/amost-db";

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

type IdentityCandidate = {
  id?: string;
  email?: string;
  username?: string;
  token?: string;
  source: string;
};

type TableCache = Map<string, boolean>;
type ColumnCache = Map<string, boolean>;

function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json(
    { ok: false, message, ...(extra || {}) },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

function cleanValue(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function safeDecodeURIComponent(value: string) {
  let output = value;
  for (let i = 0; i < 3; i += 1) {
    try {
      const decoded = decodeURIComponent(output);
      if (decoded === output) break;
      output = decoded;
    } catch {
      break;
    }
  }
  return output;
}

function tryJsonParse(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // ignore
  }
  return null;
}

function tryBase64Text(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  if (!/^[A-Za-z0-9+/=]+$/.test(normalized)) return "";
  try {
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    const text = Buffer.from(padded, "base64").toString("utf8");
    if (!text || /\u0000/.test(text)) return "";
    return text;
  } catch {
    return "";
  }
}

function tryDecodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const payload = tryBase64Text(parts[1]);
  if (!payload) return null;
  return tryJsonParse(payload);
}

function candidateFromObject(obj: Record<string, unknown>, source: string): IdentityCandidate | null {
  const nestedUser =
    obj.user && typeof obj.user === "object" && !Array.isArray(obj.user)
      ? (obj.user as Record<string, unknown>)
      : null;
  const nestedMember =
    obj.member && typeof obj.member === "object" && !Array.isArray(obj.member)
      ? (obj.member as Record<string, unknown>)
      : null;
  const nestedAccount =
    obj.account && typeof obj.account === "object" && !Array.isArray(obj.account)
      ? (obj.account as Record<string, unknown>)
      : null;
  const merged = { ...(nestedUser || {}), ...(nestedMember || {}), ...(nestedAccount || {}), ...obj };

  const id = cleanValue(
    merged.id ||
      merged.user_id ||
      merged.userId ||
      merged.uid ||
      merged.member_id ||
      merged.memberId ||
      merged.athlete_id ||
      merged.athleteId
  );
  const email = cleanValue(merged.email || merged.user_email || merged.userEmail || merged.mail);
  const username = cleanValue(
    merged.username ||
      merged.user_name ||
      merged.userName ||
      merged.name_login ||
      merged.login ||
      merged.phone ||
      merged.no_hp
  );
  const token = cleanValue(
    merged.token ||
      merged.access_token ||
      merged.accessToken ||
      merged.auth_token ||
      merged.authToken ||
      merged.jwt ||
      merged.session_token ||
      merged.sessionToken
  );

  if (!id && !email && !username && !token) return null;
  return { id, email, username, token, source };
}

function candidateFromToken(token: string, source: string): IdentityCandidate | null {
  const cleaned = cleanValue(token);
  if (!cleaned) return null;

  const jwtPayload = tryDecodeJwtPayload(cleaned);
  if (jwtPayload) {
    const jwtCandidate = candidateFromObject(jwtPayload, `${source}:jwt`);
    if (jwtCandidate) return { ...jwtCandidate, token: cleaned };
  }

  // AMOST legacy token pernah memakai format:
  // username.role.issuedAt.expiresAt.signature
  // Karena username/email bisa berisi titik, identitas diambil dari semua bagian sebelum 4 bagian terakhir.
  const parts = cleaned.split(".").filter(Boolean);
  if (parts.length >= 5) {
    const identityPart = parts.slice(0, -4).join(".");
    if (identityPart.includes("@")) return { email: identityPart, token: cleaned, source: `${source}:legacy-email` };
    if (identityPart) return { username: identityPart, token: cleaned, source: `${source}:legacy-username` };
  }

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
    return { email: cleaned, token: cleaned, source: `${source}:plain-email` };
  }

  return { token: cleaned, source };
}

function pushCandidate(list: IdentityCandidate[], candidate: IdentityCandidate | null) {
  if (!candidate) return;

  const normalized: IdentityCandidate = {
    id: cleanValue(candidate.id),
    email: cleanValue(candidate.email).toLowerCase(),
    username: cleanValue(candidate.username).toLowerCase(),
    token: cleanValue(candidate.token),
    source: candidate.source || "unknown",
  };

  if (!normalized.id && !normalized.email && !normalized.username && !normalized.token) return;

  // Hindari duplikasi dan recursive loop.
  // Bug sebelumnya: token yang tidak bisa didecode dipush lagi sebagai token,
  // lalu memanggil pushCandidate() terus sampai browser menampilkan
  // "Maximum call stack size exceeded".
  const key = [normalized.id, normalized.email, normalized.username, normalized.token, normalized.source].join("|");
  const exists = list.some((item) =>
    [item.id, item.email, item.username, item.token, item.source].join("|") === key
  );
  if (exists) return;

  list.push(normalized);

  // Decode token hanya sekali per kandidat, dan hanya lanjut jika hasil decode
  // benar-benar menambahkan identitas user, bukan sekadar token yang sama.
  if (normalized.token && !normalized.source.includes(":token")) {
    const tokenCandidate = candidateFromToken(normalized.token, `${normalized.source}:token`);
    if (!tokenCandidate) return;

    const decodedId = cleanValue(tokenCandidate.id);
    const decodedEmail = cleanValue(tokenCandidate.email).toLowerCase();
    const decodedUsername = cleanValue(tokenCandidate.username).toLowerCase();

    const decodedHasIdentity = Boolean(decodedId || decodedEmail || decodedUsername);
    const decodedAddsIdentity =
      (decodedId && decodedId !== normalized.id) ||
      (decodedEmail && decodedEmail !== normalized.email) ||
      (decodedUsername && decodedUsername !== normalized.username) ||
      (!normalized.id && !normalized.email && !normalized.username && decodedHasIdentity);

    if (decodedHasIdentity && decodedAddsIdentity) {
      pushCandidate(list, tokenCandidate);
    }
  }
}

function extractIdentityCandidates(req: NextRequest) {
  const candidates: IdentityCandidate[] = [];

  const authorization = req.headers.get("authorization") || "";
  const bearer = authorization.match(/^Bearer\s+(.+)$/i)?.[1] || "";
  pushCandidate(candidates, candidateFromToken(bearer, "authorization"));

  pushCandidate(candidates, {
    id: req.headers.get("x-amost-user-id") || req.headers.get("x-user-id") || "",
    email: req.headers.get("x-amost-email") || req.headers.get("x-user-email") || "",
    username: req.headers.get("x-amost-username") || req.headers.get("x-username") || "",
    source: "client-auth-headers",
  });

  const clientUserHeader = req.headers.get("x-amost-client-user") || "";
  if (clientUserHeader) {
    const clientUserText = tryBase64Text(clientUserHeader) || safeDecodeURIComponent(clientUserHeader);
    const clientUserJson = tryJsonParse(clientUserText);
    pushCandidate(candidates, clientUserJson ? candidateFromObject(clientUserJson, "x-amost-client-user") : null);
  }

  const cookieNames = req.cookies.getAll().map((item) => item.name);
  for (const cookie of req.cookies.getAll()) {
    const name = cookie.name;
    const rawValue = safeDecodeURIComponent(cookie.value || "");
    if (!rawValue) continue;

    const lowerName = name.toLowerCase();
    const source = `cookie:${name}`;

    if (lowerName.includes("id")) {
      pushCandidate(candidates, { id: rawValue, source });
    }
    if (lowerName.includes("email")) {
      pushCandidate(candidates, { email: rawValue, source });
    }
    if (lowerName.includes("username") || lowerName.includes("user_name")) {
      pushCandidate(candidates, { username: rawValue, source });
    }
    if (
      lowerName.includes("token") ||
      lowerName.includes("session") ||
      lowerName.includes("auth") ||
      lowerName.includes("user") ||
      lowerName.includes("account") ||
      lowerName.includes("member")
    ) {
      pushCandidate(candidates, candidateFromToken(rawValue, source));
      const json = tryJsonParse(rawValue) || tryJsonParse(tryBase64Text(rawValue));
      pushCandidate(candidates, json ? candidateFromObject(json, source) : null);
    }
  }

  const sources = Array.from(new Set(candidates.map((item) => item.source))).slice(0, 40);
  const ids = Array.from(new Set(candidates.map((item) => item.id).filter(Boolean))) as string[];
  const emails = Array.from(new Set(candidates.map((item) => item.email).filter(Boolean))) as string[];
  const usernames = Array.from(new Set(candidates.map((item) => item.username).filter(Boolean))) as string[];

  return { candidates, ids, emails, usernames, cookieNames, sources };
}

async function tableExists(client: any, cache: TableCache, tableName: string) {
  if (cache.has(tableName)) return cache.get(tableName)!;
  const result = await client.query(`select to_regclass($1) is not null as exists`, [`public.${tableName}`]);
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

function ident(name: string) {
  return `"${name.replace(/"/g, '""')}"`;
}

function addWhereClause(where: string[], values: string[], clause: string, value: string) {
  const cleaned = cleanValue(value);
  if (!cleaned) return;
  values.push(cleaned);
  where.push(clause.replace("?", `$${values.length}`));
}

async function findCurrentUser(client: any, columnCache: ColumnCache, req: NextRequest): Promise<{ user: DbUser | null; debug: Record<string, unknown> }> {
  const identity = extractIdentityCandidates(req);

  const idCol = await firstExistingColumn(client, columnCache, "users", ["id", "user_id", "member_id"]);
  const emailCol = await firstExistingColumn(client, columnCache, "users", ["email", "user_email"]);
  const usernameCol = await firstExistingColumn(client, columnCache, "users", ["username", "user_name", "login", "phone", "no_hp"]);
  const nameCol = await firstExistingColumn(client, columnCache, "users", ["name", "full_name", "nama", "display_name", "username", "email"]);
  const roleCol = await firstExistingColumn(client, columnCache, "users", ["role", "level", "user_role"]);
  const athleteTypeCol = await firstExistingColumn(client, columnCache, "users", ["athlete_type", "athlete_level", "category"]);
  const photoCol = await firstExistingColumn(client, columnCache, "users", ["photo_url", "avatar_url", "profile_photo", "image"]);

  if (!idCol) throw new Error("Kolom id/user_id pada tabel users tidak ditemukan.");

  const selects = [
    `${ident(idCol)}::text as id`,
    emailCol ? `${ident(emailCol)}::text as email` : `''::text as email`,
    usernameCol ? `${ident(usernameCol)}::text as username` : `''::text as username`,
    nameCol ? `${ident(nameCol)}::text as name` : `''::text as name`,
    roleCol ? `${ident(roleCol)}::text as role` : `''::text as role`,
    athleteTypeCol ? `${ident(athleteTypeCol)}::text as athlete_type` : `null::text as athlete_type`,
    photoCol ? `${ident(photoCol)}::text as photo_url` : `null::text as photo_url`,
  ];

  const where: string[] = [];
  const values: string[] = [];

  for (const id of identity.ids) {
    addWhereClause(where, values, `${ident(idCol)}::text = ?`, id);
  }
  for (const email of identity.emails) {
    if (emailCol) addWhereClause(where, values, `lower(${ident(emailCol)}::text) = lower(?)`, email);
    if (usernameCol) addWhereClause(where, values, `lower(${ident(usernameCol)}::text) = lower(?)`, email);
  }
  for (const username of identity.usernames) {
    if (usernameCol) addWhereClause(where, values, `lower(${ident(usernameCol)}::text) = lower(?)`, username);
    if (emailCol) addWhereClause(where, values, `lower(${ident(emailCol)}::text) = lower(?)`, username);
  }

  if (!where.length) {
    return {
      user: null,
      debug: {
        reason: "no_identity_found",
        cookie_names: identity.cookieNames,
        sources_tried: identity.sources,
      },
    };
  }

  const result = await client.query(
    `select ${selects.join(", ")}
     from users
     where ${where.join(" or ")}
     limit 1`,
    values
  );

  const row = result.rows?.[0];
  if (!row) {
    return {
      user: null,
      debug: {
        reason: "identity_not_matched_to_users",
        ids_found: identity.ids.length,
        emails_found: identity.emails.length,
        usernames_found: identity.usernames.length,
        cookie_names: identity.cookieNames,
        sources_tried: identity.sources,
      },
    };
  }

  return {
    user: {
      id: safeString(row.id),
      email: safeString(row.email),
      username: safeString(row.username),
      name: safeString(row.name || row.email || row.username || "Member AMOST"),
      role: safeString(row.role || "UMUM"),
      athlete_type: row.athlete_type ?? null,
      photo_url: row.photo_url ?? null,
    },
    debug: { matched: true, sources_tried: identity.sources },
  };
}

async function getEventTracking(client: any, tableCache: TableCache, columnCache: ColumnCache, user: DbUser) {
  const hasEvents = await tableExists(client, tableCache, "events");
  const hasJoins = await tableExists(client, tableCache, "event_joins");
  if (!hasEvents || !hasJoins) return [];

  const eventIdCol = await firstExistingColumn(client, columnCache, "events", ["id", "event_id"]);
  const eventNameCol = await firstExistingColumn(client, columnCache, "events", ["title", "name", "event_name"]);
  const eventStatusCol = await firstExistingColumn(client, columnCache, "events", ["status", "event_status"]);
  const eventDateCol = await firstExistingColumn(client, columnCache, "events", ["start_date", "event_date", "date", "start_time", "created_at"]);

  const joinEventCol = await firstExistingColumn(client, columnCache, "event_joins", ["event_id", "training_id"]);
  const joinUserCol = await firstExistingColumn(client, columnCache, "event_joins", ["user_id", "member_id", "athlete_id"]);
  const joinBibCol = await firstExistingColumn(client, columnCache, "event_joins", ["bib_number", "participant_number", "nomor_peserta", "start_number"]);
  const joinStatusCol = await firstExistingColumn(client, columnCache, "event_joins", ["status", "join_status"]);
  const joinCreatedCol = await firstExistingColumn(client, columnCache, "event_joins", ["created_at", "joined_at"]);

  if (!eventIdCol || !joinEventCol || !joinUserCol) return [];

  const hasResults = await tableExists(client, tableCache, "training_results");
  const resultEventCol = hasResults ? await firstExistingColumn(client, columnCache, "training_results", ["event_id", "training_id"]) : null;
  const resultUserCol = hasResults ? await firstExistingColumn(client, columnCache, "training_results", ["user_id", "member_id", "athlete_id"]) : null;
  const resultDistanceCol = hasResults ? await firstExistingColumn(client, columnCache, "training_results", ["distance_km", "distance", "total_distance_km"]) : null;
  const resultTimeCol = hasResults ? await firstExistingColumn(client, columnCache, "training_results", ["moving_time_seconds", "duration_seconds", "elapsed_time_seconds", "time_seconds"]): null;
  const resultAvgSpeedCol = hasResults ? await firstExistingColumn(client, columnCache, "training_results", ["avg_speed_kmh", "average_speed_kmh", "avg_speed"]): null;
  const resultStatusCol = hasResults ? await firstExistingColumn(client, columnCache, "training_results", ["status", "result_status", "finish_status"]): null;
  const resultCreatedCol = hasResults ? await firstExistingColumn(client, columnCache, "training_results", ["finished_at", "created_at", "updated_at"]): null;

  const canJoinResult = Boolean(hasResults && resultEventCol && resultUserCol);

  const orderParts = [
    canJoinResult && resultCreatedCol ? `r.${ident(resultCreatedCol)}` : "",
    eventDateCol ? `e.${ident(eventDateCol)}` : "",
    joinCreatedCol ? `j.${ident(joinCreatedCol)}` : "",
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
      ${joinBibCol ? `j.${ident(joinBibCol)}::text` : `null::text`} as bib_number,
      ${joinStatusCol ? `j.${ident(joinStatusCol)}::text` : `'JOINED'::text`} as join_status,
      ${joinCreatedCol ? `j.${ident(joinCreatedCol)}` : `null`} as joined_at,
      ${canJoinResult && resultDistanceCol ? `r.${ident(resultDistanceCol)}` : `null`} as distance_km,
      ${canJoinResult && resultTimeCol ? `r.${ident(resultTimeCol)}` : `null`} as moving_time_seconds,
      ${canJoinResult && resultAvgSpeedCol ? `r.${ident(resultAvgSpeedCol)}` : `null`} as avg_speed_kmh,
      ${canJoinResult && resultStatusCol ? `r.${ident(resultStatusCol)}::text` : `null::text`} as result_status,
      ${canJoinResult && resultCreatedCol ? `r.${ident(resultCreatedCol)}` : `null`} as result_at
    from event_joins j
    join events e on e.${ident(eventIdCol)}::text = j.${ident(joinEventCol)}::text
    ${canJoinResult ? `
      left join training_results r
        on r.${ident(resultEventCol!)}::text = e.${ident(eventIdCol)}::text
       and r.${ident(resultUserCol!)}::text = j.${ident(joinUserCol)}::text
    ` : ""}
    where j.${ident(joinUserCol)}::text = $1
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
  const userCol = await firstExistingColumn(client, columnCache, "personal_trainings", ["user_id", "member_id", "athlete_id"]);
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

  const userCol = await firstExistingColumn(client, columnCache, "live_tracking_positions", ["user_id", "member_id", "athlete_id"]);
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
  const pool = getPgPool();
  const client = await pool.connect();
  const tableCache: TableCache = new Map();
  const columnCache: ColumnCache = new Map();

  try {
    const hasUsers = await tableExists(client, tableCache, "users");
    if (!hasUsers) return jsonError("Tabel users tidak ditemukan di database.", 500);

    const { user, debug } = await findCurrentUser(client, columnCache, req);
    if (!user) {
      return jsonError("Sesi login tidak ditemukan. Silakan login ulang.", 401, {
        debug,
      });
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
