import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hashSessionToken } from "@/lib/auth";

export type AuthUser = {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  status?: string | null;
  roleId: number | null;
  roleName: string;
  roleLabel: string;
  role: string;
};

type RequestLike = {
  cookies?: {
    get?: (name: string) => { value?: string } | undefined;
  };
  headers?: {
    get?: (name: string) => string | null;
  };
};

type UserRow = {
  id: number | string;
  full_name: string | null;
  email: string | null;
  phone?: string | null;
  status?: string | null;
  role_id: number | string | null;
  role_name: string | null;
  role_label: string | null;
};

const ADMIN_ROLES = new Set(["super_admin", "staff_amost"]);

function normalizeRole(role: string | null | undefined) {
  return String(role || "").trim().toLowerCase();
}

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapUserRow(row: UserRow): AuthUser {
  const roleName = normalizeRole(row.role_name || "umum");

  return {
    id: Number(row.id),
    fullName: row.full_name || "AMOST User",
    email: row.email || "",
    phone: row.phone || null,
    status: row.status || null,
    roleId:
      row.role_id === null || row.role_id === undefined
        ? null
        : Number(row.role_id),
    roleName,
    roleLabel: row.role_label || row.role_name || "Umum",
    role: roleName,
  };
}

function getCookieFromHeader(cookieHeader: string | null | undefined, name: string) {
  if (!cookieHeader) return "";

  const found = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));

  if (!found) return "";

  return found.split("=").slice(1).join("=");
}

function getSessionToken(request?: unknown) {
  const req = request as RequestLike | undefined;

  const fromNextRequest = req?.cookies?.get?.("amost_session")?.value;
  if (fromNextRequest) return fromNextRequest;

  const fromHeader = getCookieFromHeader(req?.headers?.get?.("cookie"), "amost_session");
  if (fromHeader) return fromHeader;

  const fromCookies = cookies().get("amost_session")?.value;
  if (fromCookies) return fromCookies;

  return "";
}

export function jsonError(
  message: unknown = "Terjadi kesalahan.",
  status = 400,
  extraOrCode: Record<string, unknown> | string = {},
  maybeExtra: Record<string, unknown> = {}
) {
  const errorMessage =
    message instanceof Error
      ? message.message
      : typeof message === "string"
      ? message
      : "Terjadi kesalahan.";

  const extra =
    typeof extraOrCode === "string"
      ? { code: extraOrCode, ...maybeExtra }
      : extraOrCode || {};

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
  const db = getDb();

  const result = await db.query(
    `
      SELECT
        users.id,
        users.full_name,
        users.email,
        users.phone,
        users.status,
        users.role_id,
        roles.name AS role_name,
        roles.label AS role_label
      FROM users
      JOIN roles ON roles.id = users.role_id
      WHERE users.id = $1
      LIMIT 1
    `,
    [userId]
  );

  const row = result.rows[0] as UserRow | undefined;

  if (!row) return null;

  return mapUserRow(row);
}

export async function getUserByEmail(email: string): Promise<AuthUser | null> {
  const db = getDb();
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!normalizedEmail) return null;

  const result = await db.query(
    `
      SELECT
        users.id,
        users.full_name,
        users.email,
        users.phone,
        users.status,
        users.role_id,
        roles.name AS role_name,
        roles.label AS role_label
      FROM users
      JOIN roles ON roles.id = users.role_id
      WHERE LOWER(users.email) = LOWER($1)
      LIMIT 1
    `,
    [normalizedEmail]
  );

  const row = result.rows[0] as UserRow | undefined;

  if (!row) return null;

  return mapUserRow(row);
}

export async function getCurrentUser(request?: unknown): Promise<AuthUser | null> {
  const token = getSessionToken(request);

  if (!token) {
    return null;
  }

  const db = getDb();
  const tokenHash = hashSessionToken(token);

  const result = await db.query(
    `
      SELECT
        users.id,
        users.full_name,
        users.email,
        users.phone,
        users.status,
        users.role_id,
        roles.name AS role_name,
        roles.label AS role_label,
        sessions.expires_at
      FROM sessions
      JOIN users ON users.id = sessions.user_id
      JOIN roles ON roles.id = users.role_id
      WHERE sessions.token_hash = $1
        AND sessions.expires_at > NOW()
      LIMIT 1
    `,
    [tokenHash]
  );

  const row = result.rows[0] as UserRow | undefined;

  if (!row) {
    return null;
  }

  return mapUserRow(row);
}

export async function getCurrentAuthUser(request?: unknown) {
  return getCurrentUser(request);
}

export async function getServerAuthUser(request?: unknown) {
  return getCurrentUser(request);
}

export async function getAuthUser(request?: unknown) {
  return getCurrentUser(request);
}

export async function getCurrentAmostUser(request?: unknown) {
  return getCurrentUser(request);
}

export function isSuperAdmin(user: AuthUser | null | undefined) {
  return normalizeRole(user?.roleName || user?.role) === "super_admin";
}

export function isStaffAmost(user: AuthUser | null | undefined) {
  return normalizeRole(user?.roleName || user?.role) === "staff_amost";
}

export function isAdminUser(user: AuthUser | null | undefined) {
  return ADMIN_ROLES.has(normalizeRole(user?.roleName || user?.role));
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

export async function requireCurrentUser(request?: unknown): Promise<AuthUser> {
  const user = await getCurrentUser(request);

  if (!user) {
    throw new Error("Sesi login tidak valid. Silakan login ulang.");
  }

  return user;
}

export async function requireAuthUser(request?: unknown): Promise<AuthUser> {
  return requireCurrentUser(request);
}

export async function requireAdminUser(request?: unknown): Promise<AuthUser> {
  const user = await requireCurrentUser(request);

  if (!isAdminUser(user)) {
    throw new Error("Akses ditolak. Hanya Super Admin atau Staff AMOST.");
  }

  return user;
}

export async function requireAdmin(request?: unknown): Promise<AuthUser> {
  return requireAdminUser(request);
}

export async function requireAdminAccess(request?: unknown): Promise<AuthUser> {
  return requireAdminUser(request);
}

export async function requireSuperAdminOrStaff(request?: unknown): Promise<AuthUser> {
  return requireAdminUser(request);
}

export async function requireAmostAdmin(request?: unknown): Promise<any> {
  const user = await getCurrentUser(request);

  if (!user) {
    return {
      ok: false,
      user: null,
      response: jsonError("Sesi login tidak valid. Silakan login ulang.", 401, {
        code: "UNAUTHORIZED",
      }),
    };
  }

  if (!isAdminUser(user)) {
    return {
      ok: false,
      user,
      response: jsonError("Akses ditolak. Hanya Super Admin atau Staff AMOST.", 403, {
        code: "FORBIDDEN",
      }),
    };
  }

  return {
    ok: true,
    ...user,
    user,
    response: null,
  };
}
