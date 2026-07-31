import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { PaginationUtil } from 'src/common/utils/pagination.util';
import { AdminPostQueryDto } from './dto/admin-post-query.dto';
import { UpdatePostVisibilityDto } from './dto/update-post-visibility.dto';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly postInclude = {
    user: {
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        status: true,
      },
    },
    _count: { select: { reports: true, media: true } },
  } as const;

  async findAll(query: AdminPostQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.PostWhereInput = {
      ...(query.status === 'visible' ? { isDeleted: false } : {}),
      ...(query.status === 'hidden' ? { isDeleted: true } : {}),
      ...(query.status === 'flagged' ? { autoFlagged: true } : {}),
      ...(query.search
        ? {
            OR: [
              { content: { contains: query.search, mode: 'insensitive' } },
              {
                user: {
                  is: {
                    OR: [
                      {
                        username: {
                          contains: query.search,
                          mode: 'insensitive',
                        },
                      },
                      {
                        displayName: {
                          contains: query.search,
                          mode: 'insensitive',
                        },
                      },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip: PaginationUtil.getSkip(page, limit),
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: this.postInclude,
      }),
      this.prisma.post.count({ where }),
    ]);
    return PaginationUtil.paginate(data, total, { page, limit });
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        ...this.postInclude,
        reports: {
          orderBy: { createdAt: 'desc' },
          include: { rule: { select: { id: true, title: true, severity: true } } },
        },
        media: { orderBy: { orderIndex: 'asc' } },
      },
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async updateVisibility(id: string, dto: UpdatePostVisibilityDto) {
    try {
      return await this.prisma.post.update({
        where: { id },
        // Visibility and automated keyword signals are separate concerns.
        // A manual hide/restore must not rewrite the original scan result.
        data: { isDeleted: dto.isDeleted },
        include: this.postInclude,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Post not found');
      }
      throw error;
    }
  }
}
