import { dbQuery } from "./amostDb";

export type EventOfficialAccessRecord = {
  id: number;
  event_id: number | string;
  user_id: number | string;
  permission_level: string;
  status: string;
  notes: string | null;
  created_by: number | string | null;
  created_at: string | Date | null;
  updated_at: string | Date | null;
  user_name?: string | null;
  full_name?: string | null;
  email?: string | null;
  event_title?: string | null;
  event_name?: string | null;
};

export type CreateEventOfficialInput = {
  eventId: number | string;
  userId: number | string;
  permissionLevel?: string | null;
  notes?: string | null;
  createdBy?: number | string | null;
};

export type UpdateEventOfficialInput = {
  permissionLevel?: string | null;
  status?: string | null;
  notes?: string | null;
};

export function toPositiveBigInt(value: unknown) {
  const clean = String(value || "").trim();

  if (!/^\d+$/.test(clean)) {
    return null;
  }

  return clean;
}

export function toPositiveInt(value: unknown) {
  const clean = toPositiveBigInt(value);

  if (!clean) {
    return null;
  }

  const parsed = Number(clean);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function normalizePermissionLevel(value: unknown) {
  const level = String(value || "operator")
    .trim()
    .toLowerCase();

  if (!level) return "operator";

  const allowed = new Set(["operator", "result", "doorprize", "viewer"]);

  return allowed.has(level) ? level : "operator";
}

export function normalizeOfficialStatus(value: unknown) {
  const status = String(value || "active")
    .trim()
    .toLowerCase();

  if (status === "inactive") return "inactive";
  if (status === "disabled") return "inactive";
  if (status === "active") return "active";

  return "active";
}

export async function ensureUserExists(userId: number | string) {
  const id = toPositiveBigInt(userId);

  if (!id) {
    return false;
  }

  const result = await dbQuery(
    `
      SELECT id
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );

  return result.rows.length > 0;
}

export async function ensureEventExists(eventId: number | string) {
  const id = toPositiveBigInt(eventId);

  if (!id) {
    return false;
  }

  const result = await dbQuery(
    `
      SELECT id
      FROM events
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );

  return result.rows.length > 0;
}

export async function ensureEventOfficialExists(id: number | string) {
  const officialId = toPositiveBigInt(id);

  if (!officialId) {
    return false;
  }

  const result = await dbQuery(
    `
      SELECT id
      FROM event_officials
      WHERE id = $1
      LIMIT 1
    `,
    [officialId]
  );

  return result.rows.length > 0;
}

export async function getEventOfficialById(id: number | string) {
  const officialId = toPositiveBigInt(id);

  if (!officialId) {
    return null;
  }

  const result = await dbQuery(
    `
      SELECT
        eo.id,
        eo.event_id,
        eo.user_id,
        eo.permission_level,
        eo.status,
        eo.notes,
        eo.created_by,
        eo.created_at,
        eo.updated_at,
        u.full_name AS user_name,
        u.full_name AS full_name,
        u.email AS email,
        e.title AS event_title,
        e.title AS event_name
      FROM event_officials eo
      LEFT JOIN users u ON u.id = eo.user_id
      LEFT JOIN events e ON e.id = eo.event_id
      WHERE eo.id = $1
      LIMIT 1
    `,
    [officialId]
  );

  return (result.rows[0] || null) as EventOfficialAccessRecord | null;
}

export async function getEventOfficialByEventAndUser(
  eventId: number | string,
  userId: number | string
) {
  const cleanEventId = toPositiveBigInt(eventId);
  const cleanUserId = toPositiveBigInt(userId);

  if (!cleanEventId || !cleanUserId) {
    return null;
  }

  const result = await dbQuery(
    `
      SELECT
        eo.id,
        eo.event_id,
        eo.user_id,
        eo.permission_level,
        eo.status,
        eo.notes,
        eo.created_by,
        eo.created_at,
        eo.updated_at,
        u.full_name AS user_name,
        u.full_name AS full_name,
        u.email AS email,
        e.title AS event_title,
        e.title AS event_name
      FROM event_officials eo
      LEFT JOIN users u ON u.id = eo.user_id
      LEFT JOIN events e ON e.id = eo.event_id
      WHERE eo.event_id = $1
        AND eo.user_id = $2
      LIMIT 1
    `,
    [cleanEventId, cleanUserId]
  );

  return (result.rows[0] || null) as EventOfficialAccessRecord | null;
}

export async function listEventOfficials(eventId?: number | string | null) {
  const cleanEventId = eventId ? toPositiveBigInt(eventId) : null;

  const params: unknown[] = [];
  let whereSql = "";

  if (cleanEventId) {
    params.push(cleanEventId);
    whereSql = `WHERE eo.event_id = $${params.length}`;
  }

  const result = await dbQuery(
    `
      SELECT
        eo.id,
        eo.event_id,
        eo.user_id,
        eo.permission_level,
        eo.status,
        eo.notes,
        eo.created_by,
        eo.created_at,
        eo.updated_at,
        u.full_name AS user_name,
        u.full_name AS full_name,
        u.email AS email,
        e.title AS event_title,
        e.title AS event_name
      FROM event_officials eo
      LEFT JOIN users u ON u.id = eo.user_id
      LEFT JOIN events e ON e.id = eo.event_id
      ${whereSql}
      ORDER BY eo.created_at DESC, eo.id DESC
      LIMIT 300
    `,
    params
  );

  return result.rows as EventOfficialAccessRecord[];
}

export async function createEventOfficial(input: CreateEventOfficialInput) {
  const eventId = toPositiveBigInt(input.eventId);
  const userId = toPositiveBigInt(input.userId);
  const createdBy = input.createdBy ? toPositiveBigInt(input.createdBy) : null;

  if (!eventId || !userId) {
    throw new Error("Event ID dan User ID wajib diisi.");
  }

  const permissionLevel = normalizePermissionLevel(input.permissionLevel);
  const notes =
    input.notes === undefined || input.notes === null
      ? null
      : String(input.notes).trim() || null;

  const result = await dbQuery(
    `
      INSERT INTO event_officials (
        event_id,
        user_id,
        permission_level,
        status,
        notes,
        created_by,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, 'active', $4, $5, NOW(), NOW())
      RETURNING
        id,
        event_id,
        user_id,
        permission_level,
        status,
        notes,
        created_by,
        created_at,
        updated_at
    `,
    [eventId, userId, permissionLevel, notes, createdBy]
  );

  return result.rows[0] as EventOfficialAccessRecord;
}

export async function updateEventOfficial(
  id: number | string,
  input: UpdateEventOfficialInput
) {
  const officialId = toPositiveBigInt(id);

  if (!officialId) {
    throw new Error("ID Official Event tidak valid.");
  }

  const updates: string[] = [];
  const params: unknown[] = [];

  if (input.permissionLevel !== undefined && input.permissionLevel !== null) {
    params.push(normalizePermissionLevel(input.permissionLevel));
    updates.push(`permission_level = $${params.length}`);
  }

  if (input.status !== undefined && input.status !== null) {
    params.push(normalizeOfficialStatus(input.status));
    updates.push(`status = $${params.length}`);
  }

  if (input.notes !== undefined) {
    const notes =
      input.notes === null ? null : String(input.notes).trim() || null;

    params.push(notes);
    updates.push(`notes = $${params.length}`);
  }

  if (updates.length === 0) {
    throw new Error("Tidak ada data yang diubah.");
  }

  updates.push(`updated_at = NOW()`);

  params.push(officialId);

  const result = await dbQuery(
    `
      UPDATE event_officials
      SET ${updates.join(", ")}
      WHERE id = $${params.length}
      RETURNING
        id,
        event_id,
        user_id,
        permission_level,
        status,
        notes,
        created_by,
        created_at,
        updated_at
    `,
    params
  );

  return (result.rows[0] || null) as EventOfficialAccessRecord | null;
}

export async function deleteEventOfficial(id: number | string) {
  const officialId = toPositiveBigInt(id);

  if (!officialId) {
    throw new Error("ID Official Event tidak valid.");
  }

  const result = await dbQuery(
    `
      DELETE FROM event_officials
      WHERE id = $1
      RETURNING
        id,
        event_id,
        user_id,
        permission_level,
        status,
        notes,
        created_by,
        created_at,
        updated_at
    `,
    [officialId]
  );

  return (result.rows[0] || null) as EventOfficialAccessRecord | null;
}

export async function userHasEventOfficialAccess(
  userId: number | string,
  eventId: number | string
) {
  const cleanUserId = toPositiveBigInt(userId);
  const cleanEventId = toPositiveBigInt(eventId);

  if (!cleanUserId || !cleanEventId) {
    return false;
  }

  const result = await dbQuery(
    `
      SELECT id
      FROM event_officials
      WHERE user_id = $1
        AND event_id = $2
        AND status = 'active'
      LIMIT 1
    `,
    [cleanUserId, cleanEventId]
  );

  return result.rows.length > 0;
}

export async function getUserEventOfficialAccess(
  userId: number | string,
  eventId: number | string
) {
  const cleanUserId = toPositiveBigInt(userId);
  const cleanEventId = toPositiveBigInt(eventId);

  if (!cleanUserId || !cleanEventId) {
    return null;
  }

  const result = await dbQuery(
    `
      SELECT
        id,
        event_id,
        user_id,
        permission_level,
        status,
        notes,
        created_by,
        created_at,
        updated_at
      FROM event_officials
      WHERE user_id = $1
        AND event_id = $2
        AND status = 'active'
      LIMIT 1
    `,
    [cleanUserId, cleanEventId]
  );

  return (result.rows[0] || null) as EventOfficialAccessRecord | null;
}
