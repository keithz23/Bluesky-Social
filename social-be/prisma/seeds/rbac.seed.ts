import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedRBAC() {
  const groups = [
    { name: 'User', description: 'User management' },
    { name: 'Post', description: 'Post management' },
    { name: 'Report', description: 'Report management' },
    { name: 'System', description: 'System management' },
  ];

  for (const group of groups) {
    await prisma.permissionGroup.upsert({
      where: { name: group.name },
      update: {},
      create: group,
    });
  }

  const groupMap = new Map(
    (await prisma.permissionGroup.findMany()).map((g) => [g.name, g.id]),
  );

  const permissions = [
    ['User', 'user:read', 'View Users', 'user', 'read'],
    ['User', 'user:update', 'Update User', 'user', 'update'],
    ['User', 'user:delete', 'Delete User', 'user', 'delete'],

    ['Post', 'post:read', 'View Posts', 'post', 'read'],
    ['Post', 'post:create', 'Create Post', 'post', 'create'],
    ['Post', 'post:update', 'Update Post', 'post', 'update'],
    ['Post', 'post:delete', 'Delete Post', 'post', 'delete'],

    ['Report', 'report:read', 'View Reports', 'report', 'read'],
    ['Report', 'report:resolve', 'Resolve Reports', 'report', 'update'],

    ['System', 'system:read', 'View Settings', 'system', 'read'],
    ['System', 'system:update', 'Update Settings', 'system', 'update'],
  ];

  for (const [group, name, displayName, resource, action] of permissions) {
    await prisma.permission.upsert({
      where: { name },
      update: {},
      create: {
        name,
        displayName,
        resource,
        action,
        groupId: groupMap.get(group)!,
      },
    });
  }

  const roles = [
    { name: 'super_admin', description: 'System Owner' },
    { name: 'admin', description: 'Administrator' },
    { name: 'moderator', description: 'Moderator' },
    { name: 'user', description: 'Default User' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  const roleMap = new Map(
    (await prisma.role.findMany()).map((r) => [r.name, r.id]),
  );

  const allPermissions = await prisma.permission.findMany();

  const userPermissions = ['post.read', 'post.create', 'post.update'];

  const moderatorPermissions = [
    ...userPermissions,
    'post:delete',
    'report:read',
    'report:resolve',
  ];

  const adminPermissions = allPermissions.map((p) => p.name);

  const mapping = [
    ['super_admin', adminPermissions],
    ['admin', adminPermissions],
    ['moderator', moderatorPermissions],
    ['user', userPermissions],
  ] as const;

  for (const [roleName, perms] of mapping) {
    for (const permissionName of perms) {
      const permission = allPermissions.find((p) => p.name === permissionName);

      if (!permission) continue;

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: roleMap.get(roleName)!,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: roleMap.get(roleName)!,
          permissionId: permission.id,
        },
      });
    }
  }

  console.log('✅ RBAC seeded');
}
