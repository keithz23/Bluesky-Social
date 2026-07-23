import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

const CONFIG = {
  CUSTOM_GROUPS: 15,
  CUSTOM_ROLES: 15,
  ACTIONS: [
    'read',
    'create',
    'update',
    'delete',
    'export',
    'import',
    'approve',
  ],
};

export async function seedRBAC() {
  console.log('Starting RBAC...');

  const baseGroups = [
    { name: 'User', description: 'User management' },
    { name: 'Post', description: 'Post management' },
    { name: 'Report', description: 'Report management' },
    { name: 'System', description: 'System management' },
  ];

  const groupNames = new Set(baseGroups.map((g) => g.name));
  const groups = [...baseGroups];

  while (groups.length < baseGroups.length + CONFIG.CUSTOM_GROUPS) {
    const fakeName = faker.commerce.department();
    if (!groupNames.has(fakeName)) {
      groupNames.add(fakeName);
      groups.push({ name: fakeName, description: `${fakeName} management` });
    }
  }

  for (const group of groups) {
    await prisma.permissionGroup.upsert({
      where: { name: group.name },
      update: {},
      create: group,
    });
    console.log(group);
  }

  const groupMap = new Map(
    (await prisma.permissionGroup.findMany()).map((g) => [g.name, g.id]),
  );

  const permissions: Array<{
    group: string;
    name: string;
    displayName: string;
    resource: string;
    action: string;
  }> = [
    {
      group: 'User',
      name: 'user:read',
      displayName: 'View Users',
      resource: 'user',
      action: 'read',
    },
    {
      group: 'User',
      name: 'user:update',
      displayName: 'Update User',
      resource: 'user',
      action: 'update',
    },
    {
      group: 'User',
      name: 'user:delete',
      displayName: 'Delete User',
      resource: 'user',
      action: 'delete',
    },
    {
      group: 'Post',
      name: 'post:read',
      displayName: 'View Posts',
      resource: 'post',
      action: 'read',
    },
    {
      group: 'Post',
      name: 'post:create',
      displayName: 'Create Post',
      resource: 'post',
      action: 'create',
    },
    {
      group: 'Post',
      name: 'post:update',
      displayName: 'Update Post',
      resource: 'post',
      action: 'update',
    },
    {
      group: 'Post',
      name: 'post:delete',
      displayName: 'Delete Post',
      resource: 'post',
      action: 'delete',
    },
    {
      group: 'Report',
      name: 'report:read',
      displayName: 'View Reports',
      resource: 'report',
      action: 'read',
    },
    {
      group: 'Report',
      name: 'report:resolve',
      displayName: 'Resolve Reports',
      resource: 'report',
      action: 'update',
    },
    {
      group: 'System',
      name: 'system:read',
      displayName: 'View Settings',
      resource: 'system',
      action: 'read',
    },
    {
      group: 'System',
      name: 'system:update',
      displayName: 'Update Settings',
      resource: 'system',
      action: 'update',
    },
  ];

  for (let i = baseGroups.length; i < groups.length; i++) {
    const groupName = groups[i].name;
    const resource = groupName.toLowerCase().replace(/\s+/g, '_');

    const assignedActions = faker.helpers.arrayElements(
      CONFIG.ACTIONS,
      faker.number.int({ min: 2, max: CONFIG.ACTIONS.length }),
    );

    for (const action of assignedActions) {
      permissions.push({
        group: groupName,
        name: `${resource}:${action}`,
        displayName: `${action.charAt(0).toUpperCase() + action.slice(1)} ${groupName}`,
        resource,
        action,
      });
    }
  }

  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { name: p.name },
      update: {},
      create: {
        name: p.name,
        displayName: p.displayName,
        resource: p.resource,
        action: p.action,
        groupId: groupMap.get(p.group)!,
      },
    });
  }

  const allPermissions = await prisma.permission.findMany();

  const baseRoles = [
    { name: 'super_admin', description: 'System Owner' },
    { name: 'admin', description: 'Administrator' },
    { name: 'moderator', description: 'Moderator' },
    { name: 'user', description: 'Default User' },
  ];

  const roleNames = new Set(baseRoles.map((r) => r.name));
  const roles = [...baseRoles];

  while (roles.length < baseRoles.length + CONFIG.CUSTOM_ROLES) {
    const fakeRoleName = faker.person
      .jobTitle()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');
    if (!roleNames.has(fakeRoleName)) {
      roleNames.add(fakeRoleName);
      roles.push({
        name: fakeRoleName,
        description: faker.person.jobTitle(),
      });
    }
  }

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

  const userPermissions = ['post:read', 'post:create', 'post:update'];
  const moderatorPermissions = [
    ...userPermissions,
    'post:delete',
    'report:read',
    'report:resolve',
  ];
  const adminPermissions = allPermissions.map((p) => p.name);

  const rolePermissionsMap = new Map<string, string[]>([
    ['super_admin', adminPermissions],
    ['admin', adminPermissions],
    ['moderator', moderatorPermissions],
    ['user', userPermissions],
  ]);

  for (let i = baseRoles.length; i < roles.length; i++) {
    const roleName = roles[i].name;
    const randomPerms = faker.helpers.arrayElements(
      allPermissions.map((p) => p.name),
      faker.number.int({ min: 5, max: 15 }),
    );
    rolePermissionsMap.set(roleName, randomPerms);
  }

  for (const [roleName, perms] of rolePermissionsMap.entries()) {
    const roleId = roleMap.get(roleName);
    if (!roleId) continue;

    for (const permissionName of perms) {
      const permission = allPermissions.find((p) => p.name === permissionName);
      if (!permission) continue;

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: roleId,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: roleId,
          permissionId: permission.id,
        },
      });
    }
  }

  console.log(
    `Success: ${groups.length} Groups, ${permissions.length} Permissions, ${roles.length} Roles.`,
  );
}
