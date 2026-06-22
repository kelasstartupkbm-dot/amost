import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { hashSessionToken } from "@/lib/auth";

export type CurrentUser = {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  status: string;
  role: string;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = cookies().get("amost_session")?.value;

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
      roles.name AS role
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    JOIN roles ON roles.id = users.role_id
    WHERE sessions.token_hash = $1
      AND sessions.expires_at > NOW()
      AND users.status = 'active'
    LIMIT 1
    `,
    [tokenHash]
  );

  if (!result.rowCount) {
    return null;
  }

  const user = result.rows[0];

  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    phone: user.phone,
    status: user.status,
    role: user.role,
  };
}

export function isSuperAdmin(user: CurrentUser | null) {
  return user?.role === "super_admin";
}

export function isAdmin(user: CurrentUser | null) {
  return user?.role === "super_admin" || user?.role === "staff_amost";
}
