import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  BackfillUserFeedJobData,
  CleanupAuthorFeedJobData,
  FanoutPostJobData,
  JOB_NAMES,
  QUEUE_NAMES,
} from 'src/common/constants/queue.constant';
import { PrismaService } from 'src/prisma/prisma.service';

const FANOUT_BATCH_SIZE = 1000;
const BACKFILL_POST_LIMIT = 50;

@Processor(QUEUE_NAMES.FEED_FANOUT)
export class FeedFanoutProcessor extends WorkerHost {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job) {
    if (job.name === JOB_NAMES.FANOUT_POST) {
      return this.fanoutPost(job.data as FanoutPostJobData);
    }

    if (job.name === JOB_NAMES.BACKFILL_USER_FEED) {
      return this.backfillUserFeed(job.data as BackfillUserFeedJobData);
    }

    if (job.name === JOB_NAMES.CLEANUP_AUTHOR_FEED) {
      return this.cleanupAuthorFeed(job.data as CleanupAuthorFeedJobData);
    }
  }

  private async fanoutPost(data: FanoutPostJobData) {
    let cursor: string | undefined;
    let totalInserted = 0;

    while (true) {
      const followers = await this.prisma.follow.findMany({
        where: { followingId: data.authorId },
        orderBy: { id: 'asc' },
        take: FANOUT_BATCH_SIZE,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
        select: { id: true, followerId: true },
      });

      if (followers.length === 0) break;

      const result = await this.prisma.homeTimeline.createMany({
        data: followers.map((f) => ({
          userId: f.followerId,
          postId: data.postId,
          authorId: data.authorId,
          reason: 'follow',
          score: Date.now(),
        })),
        skipDuplicates: true,
      });

      totalInserted += result.count;
      cursor = followers[followers.length - 1].id;

      if (followers.length < FANOUT_BATCH_SIZE) break;
    }

    return { inserted: totalInserted };
  }

  private async backfillUserFeed(data: BackfillUserFeedJobData) {
    const posts = await this.prisma.post.findMany({
      where: {
        userId: data.followingId,
        isDeleted: false,
        parentPostId: null,
      },
      orderBy: { createdAt: 'desc' },
      take: BACKFILL_POST_LIMIT,
      select: { id: true, createdAt: true },
    });

    if (posts.length === 0) return { inserted: 0 };

    const result = await this.prisma.homeTimeline.createMany({
      data: posts.map((post) => ({
        userId: data.followerId,
        postId: post.id,
        authorId: data.followingId,
        reason: 'follow_backfill',
        score: post.createdAt.getTime(),
        createdAt: post.createdAt,
      })),
      skipDuplicates: true,
    });

    return { inserted: result.count };
  }

  private async cleanupAuthorFeed(data: CleanupAuthorFeedJobData) {
    const result = await this.prisma.homeTimeline.deleteMany({
      where: {
        userId: data.userId,
        authorId: data.authorId,
      },
    });

    return { deleted: result.count };
  }
}
