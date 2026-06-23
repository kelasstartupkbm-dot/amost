import { AMOST_ROLES, normalizeRole, type RawUserRole } from "./amostRoles";

export type PermissionUser = {
  id?: number | string | null;
  role?: RawUserRole;
  email?: string | null;
};

export function isSuperAdmin(user?: PermissionUser | null): boolean {
  return normalizeRole(user?.role) === AMOST_ROLES.SUPER_ADMIN;
}

export function isStaffAmost(user?: PermissionUser | null): boolean {
  return normalizeRole(user?.role) === AMOST_ROLES.STAFF_AMOST;
}

export function isUmum(user?: PermissionUser | null): boolean {
  return normalizeRole(user?.role) === AMOST_ROLES.UMUM;
}

export function canAccessAdmin(user?: PermissionUser | null): boolean {
  return isSuperAdmin(user) || isStaffAmost(user);
}

export function canManageAllEvents(user?: PermissionUser | null): boolean {
  return isSuperAdmin(user) || isStaffAmost(user);
}

export function canCreateEvent(user?: PermissionUser | null): boolean {
  return isSuperAdmin(user) || isStaffAmost(user);
}

export function canManageMembers(user?: PermissionUser | null): boolean {
  return isSuperAdmin(user) || isStaffAmost(user);
}

export function canChangeUserRole(
  actor?: PermissionUser | null,
  target?: PermissionUser | null,
  nextRole?: RawUserRole,
): boolean {
  if (!actor) return false;

  const actorRole = normalizeRole(actor.role);
  const targetRole = normalizeRole(target?.role);
  const normalizedNextRole = normalizeRole(nextRole);

  if (actorRole === AMOST_ROLES.SUPER_ADMIN) {
    return true;
  }

  if (actorRole === AMOST_ROLES.STAFF_AMOST) {
    if (targetRole === AMOST_ROLES.SUPER_ADMIN) return false;
    if (normalizedNextRole === AMOST_ROLES.SUPER_ADMIN) return false;
    return true;
  }

  return false;
}

export function canAssignOfficialEvent(user?: PermissionUser | null): boolean {
  return isSuperAdmin(user) || isStaffAmost(user);
}

export function canManageDoorprize(user?: PermissionUser | null): boolean {
  return isSuperAdmin(user) || isStaffAmost(user);
}

export function canManageNews(user?: PermissionUser | null): boolean {
  return isSuperAdmin(user) || isStaffAmost(user);
}

export function canManageDownloadApp(user?: PermissionUser | null): boolean {
  return isSuperAdmin(user) || isStaffAmost(user);
}

export function canViewOwnAccount(
  actor?: PermissionUser | null,
  ownerUserId?: number | string | null,
): boolean {
  if (!actor) return false;
  if (isSuperAdmin(actor) || isStaffAmost(actor)) return true;

  return String(actor.id || "") === String(ownerUserId || "");
}

export function assertAdminAccess(user?: PermissionUser | null) {
  if (!canAccessAdmin(user)) {
    throw new Error("FORBIDDEN_ADMIN_ACCESS");
  }
}

export function assertSuperAdminAccess(user?: PermissionUser | null) {
  if (!isSuperAdmin(user)) {
    throw new Error("FORBIDDEN_SUPER_ADMIN_ONLY");
  }
}

export function assertCanChangeUserRole(
  actor?: PermissionUser | null,
  target?: PermissionUser | null,
  nextRole?: RawUserRole,
) {
  if (!canChangeUserRole(actor, target, nextRole)) {
    throw new Error("FORBIDDEN_CHANGE_USER_ROLE");
  }
}
