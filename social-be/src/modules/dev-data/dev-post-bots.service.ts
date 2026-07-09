import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JOB_NAMES, QUEUE_NAMES } from 'src/common/constants/queue.constant';
import { PrismaService } from 'src/prisma/prisma.service';

type FakerApi = typeof import('@faker-js/faker');

const FANOUT_WRITE_MAX_FOLLOWERS = 5000;

const importFaker = async (): Promise<FakerApi> =>
  new Function('specifier', 'return import(specifier)')('@faker-js/faker');

const envInt = (name: string, fallback: number) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

@Injectable()
export class DevPostBotsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DevPostBotsService.name);
  private timer?: NodeJS.Timeout;
  private isRunning = false;
  private faker?: FakerApi['faker'];

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.FEED_FANOUT)
    private readonly feedFanoutQueue: Queue,
  ) {}

  async onModuleInit() {
    if (process.env.DEV_POST_BOTS_ENABLED !== 'true') return;

    const intervalMs = envInt('DEV_POST_BOTS_INTERVAL_MS', 60_000);
    this.logger.warn(
      `Dev post bots enabled. interval=${intervalMs}ms batch=${this.batchSize}`,
    );

    await this.createScheduledPosts();
    this.timer = setInterval(() => {
      this.createScheduledPosts().catch((error) =>
        this.logger.warn('Dev post bot tick failed', error),
      );
    }, intervalMs);
    this.timer.unref?.();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private get batchSize() {
    return envInt('DEV_POST_BOTS_BATCH', 1);
  }

  private get botPrefix() {
    return process.env.DEV_POST_BOTS_USER_PREFIX ?? 'bot_';
  }

  private async createScheduledPosts() {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const faker = await this.getFaker();
      const botCount = await this.prisma.user.count({
        where: { username: { startsWith: this.botPrefix } },
      });

      if (botCount === 0) {
        this.logger.warn(
          `No bot users found with prefix "${this.botPrefix}". Run seed:realistic first.`,
        );
        return;
      }

      for (let i = 0; i < this.batchSize; i++) {
        const skip = faker.number.int({
          min: 0,
          max: Math.max(0, botCount - 1),
        });
        const [author] = await this.prisma.user.findMany({
          where: { username: { startsWith: this.botPrefix } },
          orderBy: { id: 'asc' },
          skip,
          take: 1,
          select: { id: true, username: true, followersCount: true },
        });

        if (!author) continue;
        await this.createPostForAuthor(author);
      }
    } finally {
      this.isRunning = false;
    }
  }

  private async createPostForAuthor(author: {
    id: string;
    username: string;
    followersCount: number;
  }) {
    const faker = await this.getFaker();
    const now = new Date();
    const content = this.generatePostContent(faker);

    const post = await this.prisma.post.create({
      data: {
        userId: author.id,
        content,
        createdAt: now,
        updatedAt: now,
        viewCount: faker.number.int({ min: 0, max: 500 }),
        likeCount: faker.number.int({ min: 0, max: 30 }),
        replyCount: faker.number.int({ min: 0, max: 8 }),
        repostCount: faker.number.int({ min: 0, max: 5 }),
        bookmarkCount: faker.number.int({ min: 0, max: 10 }),
      },
      select: { id: true },
    });

    await this.prisma.user.update({
      where: { id: author.id },
      data: { postsCount: { increment: 1 } },
    });

    try {
      if (author.followersCount <= FANOUT_WRITE_MAX_FOLLOWERS) {
        await this.feedFanoutQueue.add(JOB_NAMES.FANOUT_POST, {
          postId: post.id,
          authorId: author.id,
        });
      }
    } catch (error) {
      this.logger.warn('Failed to enqueue dev post fanout job', error);
    }

    this.logger.log(`Created bot post ${post.id} by @${author.username}`);
  }

  private generatePostContent(faker: FakerApi['faker']) {
    const templates = [
      'Small update: {sentence} {tag}',
      'Thinking about {topic} today. {sentence}',
      '{sentence} Shipping tiny improvements still counts. {tag}',
      'Late note from the desk: {sentence}',
      'Today felt like a good day for {topic}. {tag}',
    ];
    const topics = [
      'frontend polish',
      'API design',
      'clean interfaces',
      'daily writing',
      'system design',
      'creative work',
      'product details',
    ];
    const tags = [
      '#buildinpublic',
      '#dev',
      '#design',
      '#learning',
      '#product',
    ];

    return faker.helpers
      .arrayElement(templates)
      .replace('{sentence}', faker.company.catchPhrase())
      .replace('{topic}', faker.helpers.arrayElement(topics))
      .replace('{tag}', faker.helpers.arrayElement(tags));
  }

  private async getFaker() {
    if (!this.faker) {
      const { faker } = await importFaker();
      this.faker = faker;
    }

    return this.faker;
  }
}
