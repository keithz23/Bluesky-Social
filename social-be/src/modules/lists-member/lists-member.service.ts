import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ListsMemberService {
  constructor(private readonly prisma: PrismaService) {}

  async addUserToList(
    listId: string,
    currentUserId: string,
    userIdToAdd: string,
  ) {
    const list = await this.prisma.list.findUnique({
      where: { id: listId, userId: currentUserId },
      select: { id: true },
    });

    if (!list) {
      throw new ForbiddenException('List not found or you are not a owner');
    }

    const result = await this.prisma.listMember.createMany({
      data: {
        listId,
        memberId: userIdToAdd,
        addedBy: currentUserId,
      },
      skipDuplicates: true,
    });

    return {
      message: 'User added to list successfully',
      addedCount: result.count,
    };
  }

  async removeUserFromList(
    listId: string,
    currentUserId: string,
    userIdToRemove: string,
  ) {
    const list = await this.prisma.list.findUnique({
      where: { id: listId, userId: currentUserId },
      select: { id: true },
    });

    if (!list) {
      throw new ForbiddenException('List not found or you are not the owner');
    }

    // Why am I using deleteMany instead of delete?
    // - If we use `delete` and the user is not found -> Prisma throws an error.
    // - If we use `deleteMany`, it runs a raw SQL DELETE. If the user is not found (0 rows affected) -> it safely returns count === 0.

    const result = await this.prisma.listMember.deleteMany({
      where: {
        listId: listId,
        memberId: userIdToRemove,
      },
    });

    if (result.count === 0) {
      throw new BadRequestException('User is not a member of this list');
    }

    return {
      message: 'User removed from list successfully',
    };
  }

  async getListMember(
    listId: string,
    userId: string,
    cursor?: string,
    limit: number = 20,
  ) {
    const list = await this.prisma.list.findUnique({
      where: { id: listId, userId },
      select: {
        members: {
          ...(cursor && {
            cursor: { id: cursor },
            skip: 1,
          }),
          take: limit + 1,

          orderBy: [{ addedAt: 'desc' }, { id: 'desc' }],

          select: {
            id: true,
            listId: true,
            addedAt: true,
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                bio: true,
                avatarUrl: true,
                coverUrl: true,
              },
            },
          },
        },
      },
    });

    if (!list) {
      throw new ForbiddenException('List not found or you are not the owner');
    }

    const hasMore = list.members.length > limit;
    if (hasMore) {
      list.members.pop();
    }

    const nextCursor = hasMore
      ? list.members[list.members.length - 1].id
      : null;

    return {
      members: list.members,
      hasMore,
      nextCursor,
    };
  }
}
