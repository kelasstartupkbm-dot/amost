import bcrypt from "bcryptjs";
import crypto from "crypto";

export type UserRole = "super_admin" | "staff_amost" | "umum";

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  STAFF_AMOST: "staff_amost",
  UMUM: "umum",
} as const;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string) {
  return bcrypt.compare(password, hashedPassword);
}

export function createSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function isAdminRole(role: string | null | undefined) {
  return role === ROLES.SUPER_ADMIN || role === ROLES.STAFF_AMOST;
}

export function isSuperAdmin(role: string | null | undefined) {
  return role === ROLES.SUPER_ADMIN;
}

export function getLoginRedirectPath(role: string | null | undefined) {
  if (role === ROLES.SUPER_ADMIN || role === ROLES.STAFF_AMOST) {
    return "/admin";
  }

  return "/account";
}

export function normalizeRole(role: string | null | undefined): UserRole {
  if (role === ROLES.SUPER_ADMIN) return ROLES.SUPER_ADMIN;
  if (role === ROLES.STAFF_AMOST) return ROLES.STAFF_AMOST;
  return ROLES.UMUM;
}
