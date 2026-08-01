import { PrismaClient } from '@prisma/client';

type PermissionDefinition = {
  group: string;
  name: string;
  displayName: string;
  resource: string;
  action: string;
};

const PERMISSION_GROUPS = [
  { name: 'User', description: 'User management' },
  { name: 'Role', description: 'Role and permission management' },
  { name: 'Post', description: 'Post management and moderation' },
  { name: 'Report', description: 'Report review and resolution' },
  { name: 'Rule', description: 'Moderation rule management' },
  { name: 'Keyword', description: 'Keyword moderation management' },
  { name: 'System', description: 'System settings, analytics, and audit logs' },
] as const;

const PERMISSIONS: PermissionDefinition[] = [
  ['User', 'user:read', 'View Users', 'user', 'read'],
  ['User', 'user:create', 'Create User', 'user', 'create'],
  ['User', 'user:update', 'Update User', 'user', 'update'],
  ['User', 'user:delete', 'Delete User', 'user', 'delete'],

  ['Role', 'role:read', 'View Roles', 'role', 'read'],
  ['Role', 'role:create', 'Create Role', 'role', 'create'],
  ['Role', 'role:update', 'Update Role', 'role', 'update'],
  ['Role', 'role:delete', 'Delete Role', 'role', 'delete'],
  [
    'Role',
    'role:assign-permission',
    'Assign Permissions to Role',
    'role',
    'assign-permission',
  ],
  ['Role', 'permission:read', 'View Permissions', 'permission', 'read'],

  ['Post', 'post:read', 'View Posts', 'post', 'read'],
  ['Post', 'post:create', 'Create Post', 'post', 'create'],
  ['Post', 'post:update', 'Update or Hide Post', 'post', 'update'],
  ['Post', 'post:delete', 'Delete Post', 'post', 'delete'],

  ['Report', 'report:read', 'View Reports', 'report', 'read'],
  ['Report', 'report:resolve', 'Resolve Reports', 'report', 'resolve'],

  ['Rule', 'rule:read', 'View Rules', 'rule', 'read'],
  ['Rule', 'rule:create', 'Create Rule', 'rule', 'create'],
  ['Rule', 'rule:update', 'Update Rule', 'rule', 'update'],
  ['Rule', 'rule:delete', 'Delete Rule', 'rule', 'delete'],

  ['Keyword', 'keyword:read', 'View Keywords', 'keyword', 'read'],
  ['Keyword', 'keyword:create', 'Create Keyword', 'keyword', 'create'],
  ['Keyword', 'keyword:update', 'Update Keyword', 'keyword', 'update'],
  ['Keyword', 'keyword:delete', 'Delete Keyword', 'keyword', 'delete'],

  ['System', 'system:read', 'View System Data', 'system', 'read'],
  ['System', 'system:update', 'Update System Data', 'system', 'update'],
].map(([group, name, displayName, resource, action]) => ({
  group,
  name,
  displayName,
  resource,
  action,
}));

const SYSTEM_ROLES = [
  { name: 'super_admin', description: 'System owner', level: 0 },
  { name: 'admin', description: 'Administrator', level: 10 },
  { name: 'moderator', description: 'Content moderator', level: 50 },
  { name: 'user', description: 'Default application user', level: 1000 },
] as const;

const MODERATOR_PERMISSIONS = [
  'post:read',
  'post:update',
  'post:delete',
  'report:read',
  'report:resolve',
  'rule:read',
  'keyword:read',
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: PERMISSIONS.map((permission) => permission.name),
  admin: PERMISSIONS.map((permission) => permission.name),
  moderator: MODERATOR_PERMISSIONS,
  // Public endpoints are authenticated by JWT and do not use these admin
  // permissions. Keeping this empty prevents regular users from opening
  // /admin/posts simply because they can read posts in the public product.
  user: [],
};

export async function seedRBAC(prisma: PrismaClient) {
  console.log('Seeding deterministic RBAC permissions and roles...');

  await prisma.$transaction(async (tx) => {
    for (const group of PERMISSION_GROUPS) {
      await tx.permissionGroup.upsert({
        where: { name: group.name },
        update: { description: group.description },
        create: group,
      });
    }

    const groups = await tx.permissionGroup.findMany({
      where: { name: { in: PERMISSION_GROUPS.map((group) => group.name) } },
      select: { id: true, name: true },
    });
    const groupIds = new Map(groups.map((group) => [group.name, group.id]));

    for (const permission of PERMISSIONS) {
      const groupId = groupIds.get(permission.group);
      if (!groupId) {
        throw new Error(`Permission group ${permission.group} was not created`);
      }

      await tx.permission.upsert({
        where: { name: permission.name },
        update: {
          displayName: permission.displayName,
          resource: permission.resource,
          action: permission.action,
          groupId,
        },
        create: {
          name: permission.name,
          displayName: permission.displayName,
          resource: permission.resource,
          action: permission.action,
          groupId,
        },
      });
    }

    for (const role of SYSTEM_ROLES) {
      await tx.role.upsert({
        where: { name: role.name },
        update: { description: role.description, level: role.level },
        create: role,
      });
    }

    const [permissions, roles] = await Promise.all([
      tx.permission.findMany({
        where: {
          name: { in: PERMISSIONS.map((permission) => permission.name) },
        },
        select: { id: true, name: true },
      }),
      tx.role.findMany({
        where: { name: { in: SYSTEM_ROLES.map((role) => role.name) } },
        select: { id: true, name: true },
      }),
    ]);
    const permissionIds = new Map(
      permissions.map((permission) => [permission.name, permission.id]),
    );
    const managedPermissionIds = permissions.map((permission) => permission.id);

    for (const role of roles) {
      const desiredPermissionIds = (ROLE_PERMISSIONS[role.name] ?? []).map(
        (name) => {
          const permissionId = permissionIds.get(name);
          if (!permissionId)
            throw new Error(`Permission ${name} was not created`);
          return permissionId;
        },
      );

      // Reconcile only permissions owned by this seed. Custom permissions and
      // custom roles remain untouched, while old grants are revoked safely.
      await tx.rolePermission.deleteMany({
        where: {
          roleId: role.id,
          permissionId: {
            in: managedPermissionIds,
            ...(desiredPermissionIds.length > 0
              ? { notIn: desiredPermissionIds }
              : {}),
          },
        },
      });

      if (desiredPermissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: desiredPermissionIds.map((permissionId) => ({
            roleId: role.id,
            permissionId,
          })),
          skipDuplicates: true,
        });
      }
    }
  });

  console.log(
    `RBAC ready: ${PERMISSION_GROUPS.length} groups, ${PERMISSIONS.length} permissions, ${SYSTEM_ROLES.length} system roles.`,
  );
}
