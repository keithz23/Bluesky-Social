import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { RoleQueryDto } from './dto/role-query,dto';
import { PaginationUtil } from 'src/common/utils/pagination.util';
import { DeleteRoleDto } from './dto/delete-role.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(createRoleDto: CreateRoleDto) {
    const { name, description } = createRoleDto;

    try {
      return await this.prisma.role.create({
        data: { name, description },
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

  async findAll(roleQueryDto: RoleQueryDto) {
    const limit = roleQueryDto.limit ?? 20;
    const page = roleQueryDto.page ?? 1;

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 50);
    const skip = PaginationUtil.getSkip(safePage, safeLimit);

    const [rolesData, total] = await Promise.all([
      this.prisma.role.findMany({
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      }),
      this.prisma.role.count(),
    ]);

    return PaginationUtil.paginate(rolesData, total, {
      page: safePage,
      limit: safeLimit,
    });
  }

  async findOne(roleId: string) {
    return await this.prisma.$transaction(async (tx) => {
      const role = await tx.role.findUnique({
        where: { id: roleId },
        include: {
          rolePermissions: true,
        },
      });

      const permissionIds = role?.rolePermissions.map((rp) => rp.permissionId);

      const permissions = await tx.permission.findMany({
        where: {
          id: { in: permissionIds },
        },
      });

      return { role, permissions };
    });
  }

  async update(roleId: string, updateRoleDto: UpdateRoleDto) {
    const { name, description } = updateRoleDto;

    try {
      return await this.prisma.role.update({
        where: { id: roleId },
        data: { name, description },
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

  async delete(deleteRoleDto: DeleteRoleDto) {
    const { ids } = deleteRoleDto;
    return await this.prisma.role.deleteMany({
      where: { id: { in: ids } },
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

  // Revoke permision
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
}
