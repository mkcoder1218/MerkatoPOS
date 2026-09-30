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
  CATEGORIES_VIEW: 'categories.view',
  CATEGORIES_MANAGE: 'categories.manage',
  UNITS_VIEW: 'units.view',
  UNITS_MANAGE: 'units.manage',
  TAXES_VIEW: 'taxes.view',
  TAXES_MANAGE: 'taxes.manage',
  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_MANAGE: 'products.manage',
  MODIFIERS_VIEW: 'modifiers.view',
  MODIFIERS_MANAGE: 'modifiers.manage',
  DISCOUNTS_VIEW: 'discounts.view',
  DISCOUNTS_MANAGE: 'discounts.manage',
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_ADJUST: 'inventory.adjust',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const CORE_PERMISSION_CODES: readonly PermissionCode[] = Object.values(PERMISSIONS);
