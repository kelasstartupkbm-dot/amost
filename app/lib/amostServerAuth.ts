import { NextRequest, NextResponse } from "next/server";
import { AMOST_ROLES, normalizeRole, type AmostRole } from "./amostRoles";
import { dbQuery } from "./amostDb";

export type AuthUser = {
  id: number;
  fullName: string;
  email: string;
  roleId: number | null;
  role: AmostRole;
  roleLabel: string;
};

type UserRow = {
  id: number;
  full_name: string | null;
  email: string | null;
  role_id: number | null;
  role_name: string | null;
  role_label: string | null;
};

const SESSION_COOKIE_NAMES = [
  "amost_session",
  "session_token",
  "auth_token",
  "amost_token",
  "token",
  "admin_token",
];

export function jsonError(
  message: string,
  status = 400,
  code = "ERROR",
) {
  return NextResponse.json(
    {
      ok: false,
      code,
      message,
    },
    { status },
  );
}

export function getFirstCookieValue(request: NextRequest) {
  for (const cookieName of SESSION_COOKIE_NAMES) {
    const value = request.cookies.get(cookieName)?.value;
    if (value) return value;
  }

  return "";
}

export async function getUserById(userId: number): Promise<AuthUser | null> {
  const result = await dbQuery<UserRow>(
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
    [userId],
  );

  const row = result.rows[0];
  if (!row) return null;

  const role = normalizeRole(row.role_name);

  return {
    id: Number(row.id),
    fullName: row.full_name || "Pengguna AMOST",
    email: row.email || "",
    roleId: row.role_id === null ? null : Number(row.role_id),
    role,
    roleLabel: row.role_label || role,
  };
}

async function getCurrentUserFromSessionsTable(
  token: string,
): Promise<AuthUser | null> {
  const sessionQueries = [
    {
      tokenColumn: "token",
      expiryColumn: "expires_at",
    },
    {
      tokenColumn: "session_token",
      expiryColumn: "expires_at",
    },
    {
      tokenColumn: "token",
      expiryColumn: "expired_at",
    },
    {
      tokenColumn: "session_token",
      expiryColumn: "expired_at",
    },
    {
      tokenColumn: "token",
      expiryColumn: null,
    },
    {
      tokenColumn: "session_token",
      expiryColumn: null,
    },
  ];

  for (const query of sessionQueries) {
    try {
      const expiryCheck = query.expiryColumn
        ? `AND (s.${query.expiryColumn} IS NULL OR s.${query.expiryColumn} > NOW())`
        : "";

      const result = await dbQuery<UserRow>(
        `
          SELECT
            u.id,
            u.full_name,
            u.email,
            u.role_id,
            r.name AS role_name,
            r.label AS role_label
          FROM sessions s
          INNER JOIN users u ON u.id = s.user_id
          LEFT JOIN roles r ON u.role_id = r.id
          WHERE s.${query.tokenColumn} = $1
          ${expiryCheck}
          LIMIT 1
        `,
        [token],
      );

      const row = result.rows[0];
      if (!row) continue;

      const role = normalizeRole(row.role_name);

      return {
        id: Number(row.id),
        fullName: row.full_name || "Pengguna AMOST",
        email: row.email || "",
        roleId: row.role_id === null ? null : Number(row.role_id),
        role,
        roleLabel: row.role_label || role,
      };
    } catch {
      // Try the next possible session schema.
    }
  }

  return null;
}

function parseLegacyAdminToken(token: string) {
  // Optional compatibility with old token shape:
  // username.role.issuedAt.expiresAt.signature
  const parts = token.split(".");
  if (parts.length < 5) return null;

  const possibleRole = normalizeRole(parts[1]);
  if (
    possibleRole !== AMOST_ROLES.SUPER_ADMIN &&
    possibleRole !== AMOST_ROLES.STAFF_AMOST
  ) {
    return null;
  }

  const expiresAt = Number(parts[3]);
  if (Number.isFinite(expiresAt) && expiresAt < Date.now()) return null;

  return {
    username: parts[0],
    role: possibleRole,
  };
}

export async function getCurrentAmostUser(
  request: NextRequest,
): Promise<AuthUser | null> {
  const token = getFirstCookieValue(request);
  if (!token) return null;

  const sessionUser = await getCurrentUserFromSessionsTable(token);
  if (sessionUser) return sessionUser;

  const legacyToken = parseLegacyAdminToken(token);
  if (!legacyToken) return null;

  // Best-effort lookup by email/username from legacy token.
  try {
    const result = await dbQuery<UserRow>(
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
        WHERE u.email = $1 OR u.full_name = $1
        LIMIT 1
      `,
      [legacyToken.username],
    );

    const row = result.rows[0];
    if (row) {
      const role = normalizeRole(row.role_name || legacyToken.role);

      return {
        id: Number(row.id),
        fullName: row.full_name || legacyToken.username,
        email: row.email || legacyToken.username,
        roleId: row.role_id === null ? null : Number(row.role_id),
        role,
        roleLabel: row.role_label || role,
      };
    }
  } catch {
    // Ignore fallback lookup errors.
  }

  return null;
}

export function isSuperAdminUser(user?: AuthUser | null) {
  return user?.role === AMOST_ROLES.SUPER_ADMIN;
}

export function isStaffAmostUser(user?: AuthUser | null) {
  return user?.role === AMOST_ROLES.STAFF_AMOST;
}

export function isGlobalAdminUser(user?: AuthUser | null) {
  return isSuperAdminUser(user) || isStaffAmostUser(user);
}

export async function requireAmostLogin(request: NextRequest) {
  const user = await getCurrentAmostUser(request);

  if (!user) {
    return {
      user: null,
      response: jsonError("Sesi login tidak valid. Silakan login ulang.", 401, "UNAUTHORIZED"),
    };
  }

  return { user, response: null };
}

export async function requireAmostAdmin(request: NextRequest) {
  const auth = await requireAmostLogin(request);
  if (auth.response) return auth;

  if (!isGlobalAdminUser(auth.user)) {
    return {
      user: auth.user,
      response: jsonError(
        "Akses ditolak. Hanya Super Admin atau Staff AMOST yang diizinkan.",
        403,
        "FORBIDDEN_ADMIN_ONLY",
      ),
    };
  }

  return auth;
}
