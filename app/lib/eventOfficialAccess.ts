import { dbQuery } from "./amostDb";
import {
  isGlobalAdminUser,
  type AuthUser,
} from "./amostServerAuth";

export const EVENT_OFFICIAL_PERMISSION_LEVELS = [
  "viewer",
  "operator",
  "manager",
] as const;

export type EventOfficialPermissionLevel =
  (typeof EVENT_OFFICIAL_PERMISSION_LEVELS)[number];

export type EventOfficialStatus = "active" | "inactive";

export type EventOfficialRow = {
  id: number;
  event_id: number;
  user_id: number;
  permission_level: EventOfficialPermissionLevel;
  status: EventOfficialStatus;
  notes: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  user_full_name?: string | null;
  user_email?: string | null;
  created_by_full_name?: string | null;
};

export function normalizePermissionLevel(
  value: unknown,
): EventOfficialPermissionLevel {
  const normalized = String(value || "operator").trim().toLowerCase();

  if (normalized === "viewer") return "viewer";
  if (normalized === "manager") return "manager";
  return "operator";
}

export function normalizeOfficialStatus(value: unknown): EventOfficialStatus {
  const normalized = String(value || "active").trim().toLowerCase();
  return normalized === "inactive" ? "inactive" : "active";
}

export function toPositiveBigInt(value: unknown) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

export async function ensureUserExists(userId: number) {
  const result = await dbQuery<{ id: number }>(
    `SELECT id FROM users WHERE id = $1 LIMIT 1`,
    [userId],
  );

  return Boolean(result.rows[0]);
}

export async function listEventOfficials({
  eventId,
  userId,
  status,
}: {
  eventId?: number | null;
  userId?: number | null;
  status?: EventOfficialStatus | "all" | null;
}) {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (eventId) {
    params.push(eventId);
    conditions.push(`eo.event_id = $${params.length}`);
  }

  if (userId) {
    params.push(userId);
    conditions.push(`eo.user_id = $${params.length}`);
  }

  if (status && status !== "all") {
    params.push(status);
    conditions.push(`eo.status = $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await dbQuery<EventOfficialRow>(
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
        u.full_name AS user_full_name,
        u.email AS user_email,
        creator.full_name AS created_by_full_name
      FROM event_officials eo
      LEFT JOIN users u ON u.id = eo.user_id
      LEFT JOIN users creator ON creator.id = eo.created_by
      ${whereClause}
      ORDER BY eo.created_at DESC, eo.id DESC
    `,
    params,
  );

  return result.rows;
}

export async function getEventOfficialById(id: number) {
  const result = await dbQuery<EventOfficialRow>(
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
        u.full_name AS user_full_name,
        u.email AS user_email,
        creator.full_name AS created_by_full_name
      FROM event_officials eo
      LEFT JOIN users u ON u.id = eo.user_id
      LEFT JOIN users creator ON creator.id = eo.created_by
      WHERE eo.id = $1
      LIMIT 1
    `,
    [id],
  );

  return result.rows[0] || null;
}

export async function assignEventOfficial({
  eventId,
  userId,
  permissionLevel,
  status,
  notes,
  createdBy,
}: {
  eventId: number;
  userId: number;
  permissionLevel: EventOfficialPermissionLevel;
  status: EventOfficialStatus;
  notes?: string | null;
  createdBy?: number | null;
}) {
  const result = await dbQuery<EventOfficialRow>(
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
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (event_id, user_id)
      DO UPDATE SET
        permission_level = EXCLUDED.permission_level,
        status = EXCLUDED.status,
        notes = EXCLUDED.notes,
        updated_at = NOW()
      RETURNING *
    `,
    [eventId, userId, permissionLevel, status, notes || null, createdBy || null],
  );

  return result.rows[0];
}

export async function updateEventOfficial({
  id,
  permissionLevel,
  status,
  notes,
}: {
  id: number;
  permissionLevel?: EventOfficialPermissionLevel;
  status?: EventOfficialStatus;
  notes?: string | null;
}) {
  const current = await getEventOfficialById(id);
  if (!current) return null;

  const nextPermissionLevel = permissionLevel || current.permission_level;
  const nextStatus = status || current.status;
  const nextNotes = notes === undefined ? current.notes : notes;

  const result = await dbQuery<EventOfficialRow>(
    `
      UPDATE event_officials
      SET
        permission_level = $2,
        status = $3,
        notes = $4,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [id, nextPermissionLevel, nextStatus, nextNotes || null],
  );

  return result.rows[0] || null;
}

export async function deleteEventOfficial(id: number) {
  const result = await dbQuery<{ id: number }>(
    `DELETE FROM event_officials WHERE id = $1 RETURNING id`,
    [id],
  );

  return Boolean(result.rows[0]);
}

export async function isActiveEventOfficial(userId: number, eventId: number) {
  const result = await dbQuery<{ id: number }>(
    `
      SELECT id
      FROM event_officials
      WHERE user_id = $1
        AND event_id = $2
        AND status = 'active'
      LIMIT 1
    `,
    [userId, eventId],
  );

  return Boolean(result.rows[0]);
}

export async function canManageEvent(
  user: AuthUser | null,
  eventId: number,
) {
  if (!user) return false;
  if (isGlobalAdminUser(user)) return true;

  return isActiveEventOfficial(user.id, eventId);
}
