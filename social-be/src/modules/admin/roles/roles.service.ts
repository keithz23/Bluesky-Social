import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { RoleQueryDto } from './dto/role-query.dto';
import { PaginationUtil } from 'src/common/utils/pagination.util';
import { DeleteRoleDto } from './dto/delete-role.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class RolesService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}
  private readonly PROTECTED_ROLE_NAMES = ['super_admin', 'admin', 'user'];

  async create(userId: string, createRoleDto: CreateRoleDto) {
    const { name, description, level } = createRoleDto;

    const currentUserLevel =
      await this.usersService.getUserMinRoleLevel(userId);

    if (currentUserLevel === undefined || level < currentUserLevel) {
      throw new ForbiddenException(
        `Cannot create a role with equal or higher privilege than your own level`,
      );
    }

    try {
      return await this.prisma.role.create({
        data: { name, description, level },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('This role name already exists');
      }
      throw error;
    }
  }

  async findAll(query: RoleQueryDto) {
    const limit = query.limit ?? 20;
    const page = query.page ?? 1;
    const sort = query.sort ?? 'all';

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const skip = PaginationUtil.getSkip(safePage, safeLimit);

    const roleInclude = {
      _count: {
        select: {
          userRoles: true,
          rolePermissions: true,
        },
      },
      rolePermissions: {
        include: {
          permission: true,
        },
      },
    };

    const where: Prisma.RoleWhereInput = {};
    if (query.search) {
      where.name = {
        contains: query.search,
        mode: 'insensitive',
      };
    }

    let orderBy: Prisma.RoleOrderByWithRelationInput = { createdAt: 'desc' };

    if (query.sort === 'asc') {
      orderBy = { name: 'asc' }; // A-Z
    } else if (query.sort === 'desc') {
      orderBy = { name: 'desc' }; // Z-A
    }

    if (sort === 'all' || limit === -1) {
      const rolesData = await this.prisma.role.findMany({
        where,
        orderBy,
        include: roleInclude,
      });

      return PaginationUtil.paginate(rolesData, rolesData.length, {
        page: 1,
        limit: rolesData.length || 1,
      });
    }

    const [rolesData, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy,
        include: roleInclude,
      }),
      this.prisma.role.count({
        where,
      }),
    ]);

    return PaginationUtil.paginate(rolesData, total, {
      page: safePage,
      limit: safeLimit,
    });
  }

  async findOne(roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return {
      ...role,
      permissions: role.rolePermissions.map((rp) => rp.permission),
    };
  }

  async update(userId: string, roleId: string, updateRoleDto: UpdateRoleDto) {
    const { name, description, level } = updateRoleDto;

    const currentUserLevel =
      await this.usersService.getUserMinRoleLevel(userId);

    const targetRole = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!targetRole) throw new NotFoundException('Role not found');

    if (currentUserLevel > targetRole.level)
      throw new ForbiddenException(
        `Cannot delete a role with equal or higher privilege than your own level`,
      );

    try {
      return await this.prisma.role.update({
        where: { id: roleId },
        data: { name, description, level },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Role not found');
        }
        if (error.code === 'P2002') {
          throw new ConflictException('This role name already exists');
        }
      }
      throw error;
    }
  }

  async delete(userId: string, deleteRoleDto: DeleteRoleDto) {
    const { roleIds } = deleteRoleDto;
    const currentUserLevel =
      await this.usersService.getUserMinRoleLevel(userId);

    const roles = await this.prisma.role.findMany({
      where: { id: { in: roleIds } },
      include: { _count: { select: { userRoles: true } } },
    });

    const protectedRole = roles.find((r) =>
      this.PROTECTED_ROLE_NAMES.includes(r.name),
    );
    if (protectedRole) {
      throw new ConflictException(
        `Cannot delete system role "${protectedRole.name}"`,
      );
    }

    roles.flatMap((r) => {
      if (currentUserLevel > r.level)
        throw new ForbiddenException(
          'Cannot delete a role with equal or higher privilege than your own level',
        );
    });

    const roleInUse = roles.find((r) => r._count.userRoles > 0);
    if (roleInUse) {
      throw new ConflictException(
        `Role "${roleInUse.name}" is still assigned to users`,
      );
    }

    return await this.prisma.role.deleteMany({
      where: { id: { in: roleIds } },
    });
  }

  // Assign Permissions
  async assignPermissions(roleId: string, permissionIds: string[]) {
    return await this.prisma.$transaction(async (tx) => {
      const role = await tx.role.findUnique({ where: { id: roleId } });
      if (!role) throw new NotFoundException('Role not found');

      const permissions = await tx.permission.findMany({
        where: { id: { in: permissionIds } },
      });
      if (permissions.length !== permissionIds.length) {
        throw new NotFoundException('One or more permissions not found');
      }

      await tx.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
        skipDuplicates: true,
      });

      return tx.role.findUnique({
        where: { id: roleId },
        include: { rolePermissions: { include: { permission: true } } },
      });
    });
  }

  // Revoke permission
  async revokePermission(roleId: string, permissionId: string) {
    try {
      return await this.prisma.rolePermission.delete({
        where: {
          roleId_permissionId: { roleId, permissionId },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(
          'This permission is not assigned to the role',
        );
      }
      throw error;
    }
  }

  // Sync Permissions
  async syncPermissions(roleId: string, permissionIds: string[]) {
    return await this.prisma.$transaction(async (tx) => {
      const role = await tx.role.findUnique({ where: { id: roleId } });
      if (!role) throw new NotFoundException('Role not found');

      if (permissionIds.length > 0) {
        const permissions = await tx.permission.findMany({
          where: { id: { in: permissionIds } },
        });
        if (permissions.length !== permissionIds.length) {
          throw new NotFoundException('One or more permissions not found');
        }
      }

      await tx.rolePermission.deleteMany({
        where: {
          roleId: roleId,
          permissionId: { notIn: permissionIds },
        },
      });

      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
          skipDuplicates: true,
        });
      }

      return tx.role.findUnique({
        where: { id: roleId },
        include: { rolePermissions: { include: { permission: true } } },
      });
    });
  }

  // Group Permissions
  async findAllGroupPermissions() {
    const result = await this.prisma.permissionGroup.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        permissions: {
          select: {
            id: true,
            name: true,
            description: true,
            displayName: true,
            resource: true,
            action: true,
          },
        },
      },
    });
    return result;
  }
}
