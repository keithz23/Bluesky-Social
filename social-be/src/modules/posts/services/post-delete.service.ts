import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PostMediaService } from './post-media.service';

@Injectable()
export class PostDeleteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly postMedia: PostMediaService,
  ) {}

  async delete(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId, isDeleted: false },
      include: { media: true },
    });

    if (!post) throw new NotFoundException('Post not found');

    if (post.userId !== userId)
      throw new ForbiddenException(
        'Your are not authorized to delete this post',
      );

    await this.prisma.$transaction(async (tx) => {
      const hashtags = await tx.postHashtag.findMany({
        where: { postId },
        select: { hashtagId: true },
      });

      await tx.postMedia.deleteMany({ where: { postId } });
      await tx.homeTimeline.deleteMany({ where: { postId } });

      if (post.parentPostId) {
        await tx.post.update({
          where: { id: post.parentPostId },
          data: { replyCount: { decrement: 1 } },
        });
      }

      await tx.user.update({
        where: {
          id: post.userId,
        },
        data: {
          postsCount: { decrement: 1 },
        },
      });

      await tx.post.delete({ where: { id: postId } });

      if (hashtags.length > 0) {
        await tx.hashtag.updateMany({
          where: { id: { in: hashtags.map((hashtag) => hashtag.hashtagId) } },
          data: { postCount: { decrement: 1 } },
        });
      }
    });

    // Schedule s3 cleanup
    if (post.media.length > 0) {
      const keys = post.media.map((m) =>
        this.postMedia.extractKeyFromUrl(m.mediaUrl),
      );
      await this.postMedia.scheduleCleanup(keys, 'post_deleted');
    }
  }
}
