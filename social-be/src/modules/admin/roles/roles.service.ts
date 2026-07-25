import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
<<<<<<< HEAD
import { RoleQueryDto } from './dto/role-query.dto';
=======
import { RoleQueryDto } from './dto/role-query,dto';
>>>>>>> origin/feat/add-staging
import { PaginationUtil } from 'src/common/utils/pagination.util';
import { DeleteRoleDto } from './dto/delete-role.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}
<<<<<<< HEAD
  private readonly PROTECTED_ROLE_NAMES = ['super_admin', 'admin', 'user'];
=======
>>>>>>> origin/feat/add-staging

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

<<<<<<< HEAD
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
=======
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
        },
      }),
      this.prisma.role.count(),
>>>>>>> origin/feat/add-staging
    ]);

    return PaginationUtil.paginate(rolesData, total, {
      page: safePage,
      limit: safeLimit,
    });
  }

  async findOne(roleId: string) {
<<<<<<< HEAD
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
=======
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
>>>>>>> origin/feat/add-staging
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
    const { roleIds } = deleteRoleDto;
<<<<<<< HEAD

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

    const roleInUse = roles.find((r) => r._count.userRoles > 0);
    if (roleInUse) {
      throw new ConflictException(
        `Role "${roleInUse.name}" is still assigned to users`,
      );
    }

=======
>>>>>>> origin/feat/add-staging
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
<<<<<<< HEAD
      const role = await tx.role.findUnique({ where: { id: roleId } });
      if (!role) throw new NotFoundException('Role not found');

=======
      // 1. Kiểm tra Role có tồn tại không
      const role = await tx.role.findUnique({ where: { id: roleId } });
      if (!role) throw new NotFoundException('Role not found');

      // 2. Kiểm tra xem các permissionIds gửi lên có hợp lệ không (chỉ check nếu mảng có data)
>>>>>>> origin/feat/add-staging
      if (permissionIds.length > 0) {
        const permissions = await tx.permission.findMany({
          where: { id: { in: permissionIds } },
        });
        if (permissions.length !== permissionIds.length) {
          throw new NotFoundException('One or more permissions not found');
        }
      }

<<<<<<< HEAD
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

=======
      // 3. XÓA CÁC QUYỀN THỪA: Xóa các quyền cũ của Role mà không có trong mảng permissionIds mới
      await tx.rolePermission.deleteMany({
        where: {
          roleId: roleId,
          permissionId: { notIn: permissionIds }, // Trong Prisma: Nếu mảng rỗng, nó sẽ xóa hết
        },
      });

      // 4. THÊM CÁC QUYỀN MỚI (Nếu có)
      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
          skipDuplicates: true, // Prisma tự động bỏ qua các record đã tồn tại (dựa vào khóa chính/composite key)
        });
      }

      // 5. Trả về kết quả mới nhất
>>>>>>> origin/feat/add-staging
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
