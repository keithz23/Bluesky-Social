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
import { RolesReponse } from './roles.interface';
import { PaginatedResult } from 'src/common/interfaces/pagination.interface';

const roleInclude = Prisma.validator<Prisma.RoleInclude>()({
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
});

type RoleWithRelations = Prisma.RoleGetPayload<{ include: typeof roleInclude }>;

@Injectable()
export class RolesService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}
  private readonly PROTECTED_ROLE_NAMES = ['super_admin', 'admin', 'user'];

  private toRoleResponse(role: RoleWithRelations): RolesReponse {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      level: role.level,
      createdAt: role.createdAt.toISOString(),
      updatedAt: role.updatedAt.toISOString(),
      _count: role._count,
      rolePermissions: role.rolePermissions.map((rp) => ({
        id: rp.id,
        roleId: rp.roleId,
        permissionId: rp.permissionId,
        createdAt: rp.createdAt.toISOString(),
        permission: {
          id: rp.permission.id,
          displayName: rp.permission.displayName,
          name: rp.permission.name,
          description: rp.permission.description,
          resource: rp.permission.resource,
          action: rp.permission.action,
          groupId: rp.permission.groupId,
        },
      })),
    };
  }

  async create(
    userId: string,
    createRoleDto: CreateRoleDto,
  ): Promise<RolesReponse> {
    const { name, description, level } = createRoleDto;

    const currentUserLevel =
      await this.usersService.getUserMinRoleLevel(userId);

    if (currentUserLevel === undefined || level < currentUserLevel) {
      throw new ForbiddenException(
        `Cannot create a role with equal or higher privilege than your own level`,
      );
    }

    try {
      const role = await this.prisma.role.create({
        data: { name, description, level },
        include: roleInclude,
      });

      return this.toRoleResponse(role);
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

  async findAll(query: RoleQueryDto): Promise<PaginatedResult<RolesReponse>> {
    const limit = query.limit ?? 20;
    const page = query.page ?? 1;
    const sort = query.sort ?? 'all';

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const skip = PaginationUtil.getSkip(safePage, safeLimit);

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

      const mapped = rolesData.map((r) => this.toRoleResponse(r));

      return PaginationUtil.paginate<RolesReponse>(mapped, mapped.length, {
        page: 1,
        limit: mapped.length || 1,
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

    const mapped = rolesData.map((r) => this.toRoleResponse(r));

    return PaginationUtil.paginate<RolesReponse>(mapped, total, {
      page: safePage,
      limit: safeLimit,
    });
  }

  async findOne(roleId: string): Promise<RolesReponse> {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: roleInclude,
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return this.toRoleResponse(role);
  }

  async update(
    userId: string,
    roleId: string,
    updateRoleDto: UpdateRoleDto,
  ): Promise<RolesReponse> {
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
      const role = await this.prisma.role.update({
        where: { id: roleId },
        data: { name, description, level },
        include: roleInclude,
      });

      return this.toRoleResponse(role);
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

  async delete(
    userId: string,
    deleteRoleDto: DeleteRoleDto,
  ): Promise<Prisma.BatchPayload> {
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

    roles.forEach((r) => {
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

    return this.prisma.role.deleteMany({
      where: { id: { in: roleIds } },
    });
  }

  // Assign Permissions
  async assignPermissions(
    roleId: string,
    permissionIds: string[],
  ): Promise<RolesReponse> {
    return this.prisma.$transaction(async (tx) => {
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

      const updatedRole = await tx.role.findUniqueOrThrow({
        where: { id: roleId },
        include: roleInclude,
      });

      return this.toRoleResponse(updatedRole);
    });
  }

  // Revoke permission
  async revokePermission(
    roleId: string,
    permissionId: string,
  ): Promise<{ roleId: string; permissionId: string }> {
    try {
      const deleted = await this.prisma.rolePermission.delete({
        where: {
          roleId_permissionId: { roleId, permissionId },
        },
      });
      return { roleId: deleted.roleId, permissionId: deleted.permissionId };
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
  async syncPermissions(
    roleId: string,
    permissionIds: string[],
  ): Promise<RolesReponse> {
    return this.prisma.$transaction(async (tx) => {
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
          data: permissionIds.map((permissionId) => ({
            roleId,
            permissionId,
          })),
          skipDuplicates: true,
        });
      }

      const updatedRole = await tx.role.findUniqueOrThrow({
        where: { id: roleId },
        include: roleInclude,
      });

      return this.toRoleResponse(updatedRole);
    });
  }

  // Group Permissions — giữ nguyên, không liên quan RolesReponse
  async findAllGroupPermissions() {
    return this.prisma.permissionGroup.findMany({
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
  }
}
