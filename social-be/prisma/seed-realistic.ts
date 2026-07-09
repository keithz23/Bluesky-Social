import { MediaType, PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

type FakerApi = typeof import('@faker-js/faker');
type RecentPost = { id: string; createdAt: Date };

const prisma = new PrismaClient();

const importFaker = async (): Promise<FakerApi> =>
  new Function('specifier', 'return import(specifier)')('@faker-js/faker');

const envInt = (name: string, fallback: number) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
};

const config = {
  runId: process.env.REALISTIC_RUN_ID ?? Date.now().toString(36),
  users: envInt('REALISTIC_USERS', 5000),
  postsPerUser: envInt('REALISTIC_POSTS_PER_USER', 20),
  followsPerUser: envInt('REALISTIC_FOLLOWS_PER_USER', 100),
  batchSize: envInt('REALISTIC_BATCH_SIZE', 500),
  timelinePostsPerFollow: envInt('REALISTIC_TIMELINE_POSTS_PER_FOLLOW', 3),
  maxTimelineRows: envInt('REALISTIC_MAX_TIMELINE_ROWS', 1_000_000),
};

const id = (prefix: string) => `${prefix}_${randomUUID().replace(/-/g, '')}`;

const pick = <T>(items: T[], index: number) => items[index % items.length];

const slug = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase()
    .slice(0, 18);

const progress = (label: string, done: number, total: number) => {
  process.stdout.write(`\r${label}: ${done}/${total}`);
  if (done >= total) process.stdout.write('\n');
};

const postTemplates = [
  'Spent the morning thinking about {topic}. Small progress still counts. {tag}',
  'Trying a new workflow for {topic} today. It feels surprisingly good. {tag}',
  'Quick note: {topic} is easier when you stop overcomplicating it. {tag}',
  'Late coffee, clean desk, and a little bit of {topic}. Not a bad day.',
  'I keep coming back to this: consistency beats intensity. Especially with {topic}.',
  'Tiny update from today: shipped one small thing, learned one useful thing. {tag}',
  'Some days are for big ideas. Today was for fixing the little details.',
  'The best part of building in public is seeing rough ideas become real.',
];

const topics = [
  'frontend polish',
  'API design',
  'product thinking',
  'daily writing',
  'system design',
  'performance work',
  'habit tracking',
  'creative coding',
  'reading notes',
  'team communication',
];

const tags = [
  '#buildinpublic',
  '#dev',
  '#design',
  '#startup',
  '#learning',
  '#product',
  '#notes',
];

async function main() {
  const { faker } = await importFaker();
  faker.seed(Number.parseInt(config.runId, 36) || Date.now());

  console.log('Realistic seed config:', config);

  const now = new Date();
  const userIds = Array.from({ length: config.users }, () => id('user'));
  const usernames = userIds.map((_, i) => {
    const base = slug(faker.person.firstName() + '_' + faker.person.lastName());
    return `bot_${config.runId}_${base}_${i}`;
  });
  const recentPostsByAuthor = new Map<string, RecentPost[]>();

  for (let i = 0; i < userIds.length; i += config.batchSize) {
    const batch = userIds.slice(i, i + config.batchSize).map((userId, index) => {
      const userIndex = i + index;
      const fullName = faker.person.fullName();
      const createdAt = faker.date.between({
        from: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 180),
        to: now,
      });

      return {
        id: userId,
        username: usernames[userIndex],
        displayName: `${fullName} ${config.runId}-${userIndex}`,
        email: `bot_${config.runId}_${userIndex}@example.test`,
        passwordHash: null,
        dateOfBirth: faker.date.birthdate({ min: 18, max: 45, mode: 'age' }),
        bio: faker.helpers.arrayElement([
          `${faker.person.jobTitle()}. ${faker.company.catchPhrase()}.`,
          `Building small things on the internet. ${faker.location.city()}.`,
          `Notes on code, design, and everyday momentum.`,
          `${faker.person.jobArea()} enthusiast. Usually overthinking details.`,
        ]),
        avatarUrl: `https://i.pravatar.cc/240?u=${encodeURIComponent(userId)}`,
        coverUrl: `https://picsum.photos/seed/cover-${userId}/1200/400`,
        verified: userIndex % 17 === 0,
        createdAt,
        updatedAt: createdAt,
        followersCount: Math.min(config.followsPerUser, config.users - 1),
        followingCount: Math.min(config.followsPerUser, config.users - 1),
        postsCount: config.postsPerUser,
      };
    });

    await prisma.user.createMany({ data: batch, skipDuplicates: true });
    progress('users', Math.min(i + config.batchSize, userIds.length), userIds.length);
  }

  const totalPosts = config.users * config.postsPerUser;
  let postsDone = 0;
  let mediaDone = 0;
  let mediaSeed = 0;

  for (let userIndex = 0; userIndex < userIds.length; userIndex += 1) {
    const userId = userIds[userIndex];
    const postBatch = Array.from(
      { length: config.postsPerUser },
      (_, postIndex) => {
        const createdAt = faker.date.between({
          from: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 14),
          to: now,
        });
        const topic = faker.helpers.arrayElement(topics);
        const tag = faker.helpers.arrayElement(tags);
        const template = faker.helpers.arrayElement(postTemplates);

        return {
          id: id('post'),
          userId,
          content: template.replace('{topic}', topic).replace('{tag}', tag),
          isDeleted: false,
          createdAt,
          updatedAt: createdAt,
          likeCount: faker.number.int({ min: 0, max: 240 }),
          bookmarkCount: faker.number.int({ min: 0, max: 40 }),
          repostCount: faker.number.int({ min: 0, max: 35 }),
          replyCount: faker.number.int({ min: 0, max: 25 }),
          viewCount: faker.number.int({ min: 20, max: 12_000 }),
        };
      },
    );

    await prisma.post.createMany({ data: postBatch, skipDuplicates: true });
    recentPostsByAuthor.set(
      userId,
      postBatch
        .slice()
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, config.timelinePostsPerFollow)
        .map((post) => ({ id: post.id, createdAt: post.createdAt })),
    );

    const media = postBatch
      .filter((_, index) => (postsDone + index) % 4 === 0)
      .map((post) => ({
        id: id('media'),
        postId: post.id,
        mediaUrl: `https://picsum.photos/seed/realistic-${config.runId}-${mediaSeed++}/1200/800`,
        mediaType: MediaType.IMAGE,
        width: 1200,
        height: 800,
        fileSize: 220_000,
        orderIndex: 0,
        createdAt: post.createdAt,
      }));

    if (media.length > 0) {
      await prisma.postMedia.createMany({ data: media, skipDuplicates: true });
      mediaDone += media.length;
    }

    postsDone += postBatch.length;
    if (userIndex % 25 === 0 || postsDone >= totalPosts) {
      progress('posts', postsDone, totalPosts);
    }
  }

  console.log(`media: ${mediaDone}`);

  const followsPerUser = Math.min(config.followsPerUser, config.users - 1);
  const totalFollows = config.users * followsPerUser;
  const estimatedTimelineRows =
    totalFollows * Math.min(config.timelinePostsPerFollow, config.postsPerUser);
  const shouldSeedTimeline =
    config.timelinePostsPerFollow > 0 &&
    estimatedTimelineRows <= config.maxTimelineRows;

  if (!shouldSeedTimeline && estimatedTimelineRows > 0) {
    console.warn(
      `Skipping home timelines: estimated rows ${estimatedTimelineRows} exceeds REALISTIC_MAX_TIMELINE_ROWS=${config.maxTimelineRows}.`,
    );
    console.warn(
      'Increase REALISTIC_MAX_TIMELINE_ROWS or lower REALISTIC_TIMELINE_POSTS_PER_FOLLOW if you really want to seed them.',
    );
  }

  let followsDone = 0;
  let timelineRowsDone = 0;
  let followBatch: Array<{
    id: string;
    followerId: string;
    followingId: string;
    createdAt: Date;
  }> = [];
  let timelineBatch: Array<{
    id: string;
    userId: string;
    postId: string;
    authorId: string;
    reason: string;
    score: number;
    createdAt: Date;
  }> = [];

  const flushFollows = async () => {
    if (followBatch.length === 0) return;
    await prisma.follow.createMany({ data: followBatch, skipDuplicates: true });
    followBatch = [];
  };

  const flushTimelines = async () => {
    if (timelineBatch.length === 0) return;
    await prisma.homeTimeline.createMany({
      data: timelineBatch,
      skipDuplicates: true,
    });
    timelineBatch = [];
  };

  for (let i = 0; i < userIds.length; i += 1) {
    const followerId = userIds[i];

    for (let j = 0; j < followsPerUser; j += 1) {
      const followingId = pick(userIds, i + j + 1);
      const createdAt = new Date(now.getTime() - (i + j) * 45_000);

      followBatch.push({
        id: id('follow'),
        followerId,
        followingId,
        createdAt,
      });

      if (shouldSeedTimeline) {
        for (const post of recentPostsByAuthor.get(followingId) ?? []) {
          timelineBatch.push({
            id: id('timeline'),
            userId: followerId,
            postId: post.id,
            authorId: followingId,
            reason: 'seed_follow',
            score: post.createdAt.getTime(),
            createdAt: post.createdAt,
          });
        }
      }

      followsDone += 1;

      if (followBatch.length >= config.batchSize) {
        await flushFollows();
        progress('follows', followsDone, totalFollows);
      }

      if (timelineBatch.length >= config.batchSize) {
        timelineRowsDone += timelineBatch.length;
        await flushTimelines();
        progress('home timelines', timelineRowsDone, estimatedTimelineRows);
      }
    }
  }

  await flushFollows();
  progress('follows', followsDone, totalFollows);

  if (shouldSeedTimeline) {
    timelineRowsDone += timelineBatch.length;
    await flushTimelines();
    progress('home timelines', timelineRowsDone, estimatedTimelineRows);
  }

  console.log(`Realistic seed complete. runId=${config.runId}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
