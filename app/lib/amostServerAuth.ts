import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { dbQuery } from "./amostDb";

export type AuthUser = {
  id: number;
  fullName: string;
  email: string;
  roleId: number | null;
  roleName: string;
  roleLabel: string;
};

type UserRow = {
  id: number | string;
  full_name: string | null;
  email: string | null;
  role_id: number | string | null;
  role_name: string | null;
  role_label: string | null;
};

const ADMIN_ROLES = new Set(["super_admin", "staff_amost"]);

function normalizeRole(role: string | null | undefined) {
  return String(role || "")
    .trim()
    .toLowerCase();
}

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapUserRow(row: UserRow): AuthUser {
  return {
    id: Number(row.id),
    fullName: row.full_name || "AMOST User",
    email: row.email || "",
    roleId:
      row.role_id === null || row.role_id === undefined
        ? null
        : Number(row.role_id),
    roleName: normalizeRole(row.role_name || "umum"),
    roleLabel: row.role_label || "Umum",
  };
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseJsonCookie(value: string) {
  try {
    return JSON.parse(safeDecode(value));
  } catch {
    return null;
  }
}

function extractEmail(value: string) {
  const decoded = safeDecode(value);
  const match = decoded.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0].toLowerCase() : null;
}

function extractNumericId(value: string) {
  const decoded = safeDecode(value).trim();

  if (/^\d+$/.test(decoded)) {
    return Number(decoded);
  }

  const json = parseJsonCookie(decoded);

  if (json) {
    const possibleId =
      json.id ||
      json.userId ||
      json.user_id ||
      json.uid ||
      json.sub ||
      json.user?.id ||
      json.user?.userId ||
      json.user?.user_id;

    const parsedId = toNumber(possibleId);
    if (parsedId) return parsedId;
  }

  return null;
}

function getCookieValue(names: string[]) {
  const cookieStore = cookies();

  for (const name of names) {
    const value = cookieStore.get(name)?.value;
    if (value) return value;
  }

  return "";
}

export function jsonError(
  message: unknown = "Terjadi kesalahan.",
  status = 400,
  extra: Record<string, unknown> = {}
) {
  const errorMessage =
    message instanceof Error
      ? message.message
      : typeof message === "string"
      ? message
      : "Terjadi kesalahan.";

  return NextResponse.json(
    {
      ok: false,
      message: errorMessage,
      error: errorMessage,
      ...extra,
    },
    { status }
  );
}

export function jsonOk(data: Record<string, unknown> = {}, status = 200) {
  return NextResponse.json(
    {
      ok: true,
      ...data,
    },
    { status }
  );
}

export async function getUserById(userId: number): Promise<AuthUser | null> {
  const result = await dbQuery(
    `
      SELECT
        u.id,
        u.full_name,
        u.email,
        u.role_id,
        r.name AS role_name,
        r.label AS role_label
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1
      LIMIT 1
    `,
    [userId]
  );

  const row = result.rows[0] as UserRow | undefined;

  if (!row) {
    return null;
  }

  return mapUserRow(row);
}

export async function getUserByEmail(email: string): Promise<AuthUser | null> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return null;
  }

  const result = await dbQuery(
    `
      SELECT
        u.id,
        u.full_name,
        u.email,
        u.role_id,
        r.name AS role_name,
        r.label AS role_label
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE LOWER(u.email) = LOWER($1)
      LIMIT 1
    `,
    [normalizedEmail]
  );

  const row = result.rows[0] as UserRow | undefined;

  if (!row) {
    return null;
  }

  return mapUserRow(row);
}

async function getUserFromSessionTable(
  sessionToken: string
): Promise<AuthUser | null> {
  if (!sessionToken) {
    return null;
  }

  const sessionQueries = [
    {
      sql: `
        SELECT user_id
        FROM sessions
        WHERE token = $1
        LIMIT 1
      `,
      params: [sessionToken],
    },
    {
      sql: `
        SELECT user_id
        FROM sessions
        WHERE session_token = $1
        LIMIT 1
      `,
      params: [sessionToken],
    },
    {
      sql: `
        SELECT user_id
        FROM sessions
        WHERE id::text = $1
        LIMIT 1
      `,
      params: [sessionToken],
    },
  ];

  for (const query of sessionQueries) {
    try {
      const result = await dbQuery(query.sql, query.params);
      const row = result.rows[0] as { user_id?: number | string } | undefined;

      const userId = toNumber(row?.user_id);

      if (userId) {
        return await getUserById(userId);
      }
    } catch {
      // Struktur tabel sessions bisa berbeda. Abaikan dan lanjut pola berikutnya.
    }
  }

  return null;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const idCookie = getCookieValue([
    "amost_user_id",
    "user_id",
    "userId",
    "auth_user_id",
    "admin_user_id",
  ]);

  const idFromCookie = idCookie ? extractNumericId(idCookie) : null;

  if (idFromCookie) {
    const user = await getUserById(idFromCookie);
    if (user) return user;
  }

  const sessionCookie = getCookieValue([
    "amost_session",
    "session",
    "session_id",
    "sessionId",
    "auth_session",
    "auth_token",
    "admin_token",
    "amost_auth",
    "token",
  ]);

  if (sessionCookie) {
    const json = parseJsonCookie(sessionCookie);

    if (json) {
      const possibleId =
        json.id ||
        json.userId ||
        json.user_id ||
        json.uid ||
        json.sub ||
        json.user?.id ||
        json.user?.userId ||
        json.user?.user_id;

      const userId = toNumber(possibleId);

      if (userId) {
        const user = await getUserById(userId);
        if (user) return user;
      }

      const possibleEmail =
        json.email ||
        json.userEmail ||
        json.user_email ||
        json.user?.email ||
        "";

      if (possibleEmail) {
        const user = await getUserByEmail(String(possibleEmail));
        if (user) return user;
      }
    }

    const emailFromToken = extractEmail(sessionCookie);

    if (emailFromToken) {
      const user = await getUserByEmail(emailFromToken);
      if (user) return user;
    }

    const userFromSession = await getUserFromSessionTable(sessionCookie);
    if (userFromSession) return userFromSession;
  }

  return null;
}

export async function getCurrentAuthUser() {
  return getCurrentUser();
}

export async function getServerAuthUser() {
  return getCurrentUser();
}

export async function getAuthUser() {
  return getCurrentUser();
}

export async function getCurrentAmostUser() {
  return getCurrentUser();
}

export function isSuperAdmin(user: AuthUser | null | undefined) {
  return normalizeRole(user?.roleName) === "super_admin";
}

export function isStaffAmost(user: AuthUser | null | undefined) {
  return normalizeRole(user?.roleName) === "staff_amost";
}

export function isAdminUser(user: AuthUser | null | undefined) {
  return ADMIN_ROLES.has(normalizeRole(user?.roleName));
}

export function isGlobalAdminUser(user: AuthUser | null | undefined) {
  return isAdminUser(user);
}

export function canAccessAdminPanel(user: AuthUser | null | undefined) {
  return isAdminUser(user);
}

export function canManageOfficialEvent(user: AuthUser | null | undefined) {
  return isAdminUser(user);
}

export async function requireCurrentUser(): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Sesi login tidak valid. Silakan login ulang.");
  }

  return user;
}

export async function requireAuthUser(): Promise<AuthUser> {
  return requireCurrentUser();
}

export async function requireAdminUser(): Promise<AuthUser> {
  const user = await requireCurrentUser();

  if (!isAdminUser(user)) {
    throw new Error("Akses ditolak. Hanya Super Admin atau Staff AMOST.");
  }

  return user;
}

export async function requireAdmin(): Promise<AuthUser> {
  return requireAdminUser();
}

export async function requireAdminAccess(): Promise<AuthUser> {
  return requireAdminUser();
}

export async function requireSuperAdminOrStaff(): Promise<AuthUser> {
  return requireAdminUser();
}

export async function requireAmostAdmin(): Promise<AuthUser> {
  return requireAdminUser();
}
