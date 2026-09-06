import { Injectable } from '@nestjs/common';
import { ReplyPolicy } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PostReplyPolicyService {
  constructor(private readonly prisma: PrismaService) {}

  async canReplyToPost(
    userId: string,
    post: {
      userId: string;
      content: string;
      replyPolicy: ReplyPolicy;
      replyFollowers: boolean;
      replyFollowing: boolean;
      replyMentioned: boolean;
    },
  ) {
    if (post.userId === userId) return true;
    if (post.replyPolicy === ReplyPolicy.ANYONE) return true;
    if (post.replyPolicy === ReplyPolicy.NOBODY) return false;

    const checks: Promise<unknown>[] = [];

    if (post.replyFollowers) {
      checks.push(
        this.prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: userId,
              followingId: post.userId,
            },
          },
        }),
      );
    }

    if (post.replyFollowing) {
      checks.push(
        this.prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: post.userId,
              followingId: userId,
            },
          },
        }),
      );
    }

    if (post.replyMentioned) {
      checks.push(
        this.prisma.user
          .findUnique({
            where: { id: userId },
            select: { username: true },
          })
          .then((user) => {
            if (!user?.username) return null;
            const mentionRegex = new RegExp(
              `@${this.escapeRegExp(user.username)}\\b`,
              'i',
            );
            return mentionRegex.test(post.content) ? user : null;
          }),
      );
    }

    if (checks.length === 0) return false;
    const results = await Promise.all(checks);
    return results.some(Boolean);
  }

  private escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
