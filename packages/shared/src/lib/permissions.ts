export const PERMISSIONS = {
  TENANTS_VIEW: 'tenants.view',
  TENANTS_MANAGE: 'tenants.manage',
  BRANCHES_VIEW: 'branches.view',
  BRANCHES_MANAGE: 'branches.manage',
  USERS_VIEW: 'users.view',
  USERS_MANAGE: 'users.manage',
  ROLES_VIEW: 'roles.view',
  ROLES_MANAGE: 'roles.manage',
  PERMISSIONS_VIEW: 'permissions.view',
  DEVICES_VIEW: 'devices.view',
  DEVICES_REGISTER: 'devices.register',
  DEVICES_MANAGE: 'devices.manage',
  REGISTERS_VIEW: 'registers.view',
  REGISTERS_MANAGE: 'registers.manage',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const CORE_PERMISSION_CODES: readonly PermissionCode[] = Object.values(PERMISSIONS);
