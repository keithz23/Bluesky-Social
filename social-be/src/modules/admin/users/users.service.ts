import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { HashUtil } from 'src/common/utils/hash.util';
import { Prisma } from '@prisma/client';
import { UserQueryDto } from './dto/user-query.dto';
import { PaginationUtil } from 'src/common/utils/pagination.util';
import { DeleteUserDto } from './dto/delete-usr.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { username, email, password, dateOfBirth, roleIds } = createUserDto;

    const [existingUser, validRoleCount] = await Promise.all([
      this.prisma.user.findFirst({
        where: { OR: [{ email }, { username }] },
        select: { email: true, username: true },
      }),
      roleIds?.length
        ? this.prisma.role.count({ where: { id: { in: roleIds } } })
        : Promise.resolve(0),
    ]);

    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'username';
      throw new ConflictException(`This ${field} is already in use`);
    }

    if (roleIds?.length && validRoleCount !== roleIds.length) {
      throw new BadRequestException('One or more roleIds are invalid');
    }

    const passwordHash = await HashUtil.hash(password);

    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          username,
          passwordHash,
          displayName: username,
          dateOfBirth,
          status: 'DEACTIVATED',
          ...(roleIds?.length
            ? {
                userRoles: {
                  createMany: {
                    data: roleIds.map((roleId) => ({ roleId })),
                  },
                },
              }
            : {}),
        },
      });
      const { passwordHash: _, ...safeUser } = user;
      return safeUser;
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('Email or username already exists');
      }
      throw e;
    }
  }

  async findAll(query: UserQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 50);
    const skip = PaginationUtil.getSkip(safePage, safeLimit);

    const [usersData, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      }),
      this.prisma.user.count(),
    ]);

    const safeUsersData = usersData.map(
      ({ passwordHash, ...safeUser }) => safeUser,
    );

    return PaginationUtil.paginate(safeUsersData, total, {
      page: safePage,
      limit: safeLimit,
    });
  }

  async findOne(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  async update(userId: string, updateUserDto: UpdateUserDto) {
    const { username, email, dateOfBirth, roleIds, status } = updateUserDto;

    if (roleIds?.length) {
      const validRoleCount = await this.prisma.role.count({
        where: { id: { in: roleIds } },
      });
      if (validRoleCount !== roleIds.length) {
        throw new BadRequestException('One or more roleIds are invalid');
      }
    }

    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          email,
          username,
          dateOfBirth,
          status,
          displayName: username,
          ...(roleIds
            ? {
                userRoles: {
                  deleteMany: {},
                  createMany: {
                    data: roleIds.map((roleId) => ({ roleId })),
                  },
                },
              }
            : {}),
        },
      });
      const { passwordHash: _, ...safeUser } = user;
      return safeUser;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('User not found');
        }
        if (error.code === 'P2002') {
          throw new ConflictException('Email or username already exists');
        }
      }
      throw error;
    }
  }

  async delete(deleteUserDto: DeleteUserDto) {
    const { userIds } = deleteUserDto;
    if (!userIds?.length) {
      throw new BadRequestException('userIds is required');
    }
    const result = await this.prisma.user.deleteMany({
      where: { id: { in: userIds } },
    });
    if (result.count === 0) {
      throw new NotFoundException('No users found to delete');
    }
    return result;
  }
}
