export const AMOST_ROLES = {
  SUPER_ADMIN: "super_admin",
  STAFF_AMOST: "staff_amost",
  UMUM: "umum",
} as const;

export type AmostRole = (typeof AMOST_ROLES)[keyof typeof AMOST_ROLES];

export type RawUserRole = string | null | undefined;

export type RoleOption = {
  value: AmostRole;
  label: string;
  description: string;
  level: number;
};

export const AMOST_ROLE_OPTIONS: RoleOption[] = [
  {
    value: AMOST_ROLES.SUPER_ADMIN,
    label: "Super Admin",
    description: "Akses penuh seluruh sistem AMOST.",
    level: 1,
  },
  {
    value: AMOST_ROLES.STAFF_AMOST,
    label: "Staff AMOST",
    description: "Tim AMOST yang dapat mengelola operasional website dan event.",
    level: 2,
  },
  {
    value: AMOST_ROLES.UMUM,
    label: "Umum",
    description: "User umum/peserta biasa.",
    level: 4,
  },
];

const SUPER_ADMIN_ALIASES = new Set([
  "super_admin",
  "superadmin",
  "super admin",
  "admin_super",
  "admin",
]);

const STAFF_AMOST_ALIASES = new Set([
  "staff_amost",
  "staff amost",
  "staff",
  "official_amost",
  "official amost",
  "amost_staff",
]);

const UMUM_ALIASES = new Set([
  "umum",
  "public",
  "member",
  "user",
  "peserta",
]);

export function normalizeRole(role: RawUserRole): AmostRole {
  const normalized = String(role || "")
    .trim()
    .toLowerCase();

  if (SUPER_ADMIN_ALIASES.has(normalized)) return AMOST_ROLES.SUPER_ADMIN;
  if (STAFF_AMOST_ALIASES.has(normalized)) return AMOST_ROLES.STAFF_AMOST;
  if (UMUM_ALIASES.has(normalized)) return AMOST_ROLES.UMUM;

  return AMOST_ROLES.UMUM;
}

export function formatRoleLabel(role: RawUserRole): string {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === AMOST_ROLES.SUPER_ADMIN) return "Super Admin";
  if (normalizedRole === AMOST_ROLES.STAFF_AMOST) return "Staff AMOST";
  return "Umum";
}

export function getRoleLevel(role: RawUserRole): number {
  const normalizedRole = normalizeRole(role);

  const option = AMOST_ROLE_OPTIONS.find((item) => item.value === normalizedRole);
  return option?.level ?? 4;
}

export function isValidGlobalRole(role: RawUserRole): role is AmostRole {
  const normalized = String(role || "")
    .trim()
    .toLowerCase();

  return (
    normalized === AMOST_ROLES.SUPER_ADMIN ||
    normalized === AMOST_ROLES.STAFF_AMOST ||
    normalized === AMOST_ROLES.UMUM
  );
}

export function safeRoleForDatabase(role: RawUserRole): AmostRole {
  const normalized = normalizeRole(role);

  if (normalized === AMOST_ROLES.SUPER_ADMIN) return AMOST_ROLES.SUPER_ADMIN;
  if (normalized === AMOST_ROLES.STAFF_AMOST) return AMOST_ROLES.STAFF_AMOST;
  return AMOST_ROLES.UMUM;
}
