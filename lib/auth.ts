import crypto from "crypto";

export type UserRole = "super_admin" | "staff_amost" | "umum";

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  STAFF_AMOST: "staff_amost",
  UMUM: "umum",
} as const;

const PASSWORD_ALGORITHM = "scrypt";
const PASSWORD_KEY_LENGTH = 64;

function scryptPassword(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, PASSWORD_KEY_LENGTH, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scryptPassword(password, salt);

  return `${PASSWORD_ALGORITHM}:${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, storedPassword: string) {
  const parts = storedPassword.split(":");

  if (parts.length !== 3) return false;

  const [algorithm, salt, storedHash] = parts;

  if (algorithm !== PASSWORD_ALGORITHM || !salt || !storedHash) return false;

  const derivedKey = await scryptPassword(password, salt);
  const storedBuffer = Buffer.from(storedHash, "hex");

  if (storedBuffer.length !== derivedKey.length) return false;

  return crypto.timingSafeEqual(storedBuffer, derivedKey);
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
