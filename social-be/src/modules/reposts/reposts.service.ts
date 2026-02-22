import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateRepostDto } from './dto/create-repost.dto';
import { UpdateRepostDto } from './dto/update-repost.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RepostsService {
  constructor(private readonly prisma: PrismaService) {}

  async repost(userId: string, postId: string) {
    const existing = await this.prisma.repost.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) throw new BadRequestException('Already reposted');

    await this.prisma.$transaction([
      this.prisma.repost.create({
        data: { userId, postId },
      }),

      this.prisma.post.update({
        where: { id: postId },
        data: {
          repostCount: { increment: 1 },
        },
      }),
    ]);

    return { reposted: true };
  }

  async unRepost(userId: string, postId: string) {
    const existing = await this.prisma.repost.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (!existing) throw new BadRequestException('Not reposted yet');

    await this.prisma.$transaction([
      this.prisma.repost.delete({
        where: { userId_postId: { userId, postId } },
      }),

      this.prisma.post.update({
        where: { id: postId },
        data: {
          repostCount: { decrement: 1 },
        },
      }),
    ]);

    return { reposted: false };
  }
}
