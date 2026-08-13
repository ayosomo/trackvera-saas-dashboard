export const permissionNames = [
  "project:create",
  "project:edit",
  "delivery:update",
] as const;

export type Permission = (typeof permissionNames)[number];

export const roleNames = [
  "admin",
  "operations-manager",
  "engineer",
  "viewer",
] as const;

export type UserRole = (typeof roleNames)[number];

export interface MockIdentity {
  id: string;
  name: string;
  title: string;
  role: UserRole;
}

export const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  "operations-manager": "Operations Manager",
  engineer: "Engineer",
  viewer: "Read-only User",
};

export const mockIdentities: MockIdentity[] = [
  {
    id: "demo-admin",
    name: "Avery Morgan",
    title: "Platform administrator",
    role: "admin",
  },
  {
    id: "demo-operations",
    name: "Jordan Lee",
    title: "Operations manager",
    role: "operations-manager",
  },
  {
    id: "demo-engineer",
    name: "Sam Rivera",
    title: "Delivery engineer",
    role: "engineer",
  },
  {
    id: "demo-viewer",
    name: "Taylor Brooks",
    title: "Portfolio viewer",
    role: "viewer",
  },
];

const rolePermissions: Record<UserRole, ReadonlySet<Permission>> = {
  admin: new Set(permissionNames),
  "operations-manager": new Set(permissionNames),
  engineer: new Set(["delivery:update"]),
  viewer: new Set(),
};

export function hasPermission(
  identity: MockIdentity | null,
  permission: Permission,
): boolean {
  return identity ? rolePermissions[identity.role].has(permission) : false;
}

export function getIdentity(identityId: string): MockIdentity | null {
  return mockIdentities.find((identity) => identity.id === identityId) ?? null;
}
