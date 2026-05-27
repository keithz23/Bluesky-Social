import { PrismaClient, MediaType } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

const envInt = (name: string, fallback: number) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const config = {
  runId: process.env.PERF_RUN_ID ?? Date.now().toString(36),
  users: envInt('PERF_USERS', 500),
  postsPerUser: envInt('PERF_POSTS_PER_USER', 20),
  followsPerUser: envInt('PERF_FOLLOWS_PER_USER', 50),
  likesPerUser: envInt('PERF_LIKES_PER_USER', 80),
  bookmarksPerUser: envInt('PERF_BOOKMARKS_PER_USER', 20),
  conversations: envInt('PERF_CONVERSATIONS', 200),
  messagesPerConversation: envInt('PERF_MESSAGES_PER_CONVERSATION', 50),
  batchSize: envInt('PERF_BATCH_SIZE', 1000),
};

const id = (prefix: string) => `${prefix}_${randomUUID().replace(/-/g, '')}`;

const chunk = async <T>(
  label: string,
  items: T[],
  worker: (batch: T[]) => Promise<unknown>,
) => {
  let done = 0;

  for (let i = 0; i < items.length; i += config.batchSize) {
    const batch = items.slice(i, i + config.batchSize);
    await worker(batch);
    done += batch.length;
    process.stdout.write(`\r${label}: ${done}/${items.length}`);
  }

  process.stdout.write('\n');
};

const pick = <T>(items: T[], index: number) => items[index % items.length];

async function main() {
  console.log('Perf seed config:', config);

  const now = new Date();
  const userIds = Array.from({ length: config.users }, (_, i) => id('user'));
  const usernames = userIds.map((_, i) => `perf_${config.runId}_${i}`);

  const users = userIds.map((userId, i) => ({
    id: userId,
    username: usernames[i],
    displayName: `Perf User ${config.runId} ${i}`,
    email: `perf_${config.runId}_${i}@example.test`,
    passwordHash: null,
    dateOfBirth: new Date('1995-01-01'),
    bio: `Performance seed user ${i}`,
    avatarUrl: null,
    coverUrl: null,
    verified: i % 7 === 0,
    createdAt: new Date(now.getTime() - i * 60_000),
    followersCount: Math.min(config.followsPerUser, config.users - 1),
    followingCount: Math.min(config.followsPerUser, config.users - 1),
    postsCount: config.postsPerUser,
  }));

  await chunk('users', users, (batch) =>
    prisma.user.createMany({ data: batch, skipDuplicates: true }),
  );

  const follows = userIds.flatMap((followerId, i) => {
    const max = Math.min(config.followsPerUser, config.users - 1);

    return Array.from({ length: max }, (_, j) => {
      const followingId = pick(userIds, i + j + 1);
      return {
        id: id('follow'),
        followerId,
        followingId,
        createdAt: new Date(now.getTime() - (i + j) * 1000),
      };
    });
  });

  await chunk('follows', follows, (batch) =>
    prisma.follow.createMany({ data: batch, skipDuplicates: true }),
  );

  const posts = userIds.flatMap((userId, userIndex) =>
    Array.from({ length: config.postsPerUser }, (_, postIndex) => {
      const postId = id('post');
      const createdAt = new Date(
        now.getTime() - (userIndex * config.postsPerUser + postIndex) * 30_000,
      );

      return {
        id: postId,
        userId,
        content: `Perf post ${config.runId}/${userIndex}/${postIndex} #loadtest @${pick(
          usernames,
          userIndex + postIndex + 1,
        )}`,
        isDeleted: false,
        createdAt,
        updatedAt: createdAt,
        likeCount: Math.min(config.likesPerUser, config.users),
        bookmarkCount: Math.min(config.bookmarksPerUser, config.users),
        repostCount: postIndex % 5 === 0 ? 3 : 0,
        replyCount: postIndex % 4 === 0 ? 2 : 0,
        viewCount: (userIndex + 1) * (postIndex + 1),
      };
    }),
  );

  await chunk('posts', posts, (batch) =>
    prisma.post.createMany({ data: batch, skipDuplicates: true }),
  );

  const media = posts
    .filter((_, i) => i % 5 === 0)
    .map((post, i) => ({
      id: id('media'),
      postId: post.id,
      mediaUrl: `https://picsum.photos/seed/${config.runId}-${i}/1200/800`,
      mediaType: MediaType.IMAGE,
      width: 1200,
      height: 800,
      fileSize: 180_000,
      orderIndex: 0,
      createdAt: post.createdAt,
    }));

  await chunk('media', media, (batch) =>
    prisma.postMedia.createMany({ data: batch, skipDuplicates: true }),
  );

  const postIds = posts.map((post) => post.id);
  const likes = userIds.flatMap((userId, userIndex) =>
    Array.from({ length: Math.min(config.likesPerUser, postIds.length) }, (_, j) => ({
      id: id('like'),
      userId,
      postId: pick(postIds, userIndex * 17 + j * 13),
      createdAt: new Date(now.getTime() - (userIndex + j) * 1200),
    })),
  );

  await chunk('likes', likes, (batch) =>
    prisma.like.createMany({ data: batch, skipDuplicates: true }),
  );

  const bookmarks = userIds.flatMap((userId, userIndex) =>
    Array.from(
      { length: Math.min(config.bookmarksPerUser, postIds.length) },
      (_, j) => ({
        id: id('bookmark'),
        userId,
        postId: pick(postIds, userIndex * 19 + j * 23),
        createdAt: new Date(now.getTime() - (userIndex + j) * 2000),
      }),
    ),
  );

  await chunk('bookmarks', bookmarks, (batch) =>
    prisma.bookmark.createMany({ data: batch, skipDuplicates: true }),
  );

  const conversations = Array.from(
    { length: Math.min(config.conversations, Math.floor(config.users / 2)) },
    (_, i) => {
      const createdAt = new Date(now.getTime() - i * 90_000);
      return {
        id: id('conv'),
        lastMessageAt: createdAt,
        messageCount: config.messagesPerConversation,
        createdAt,
        updatedAt: createdAt,
      };
    },
  );

  await chunk('conversations', conversations, (batch) =>
    prisma.conversation.createMany({ data: batch, skipDuplicates: true }),
  );

  const participants = conversations.flatMap((conversation, i) => [
    {
      id: id('cp'),
      conversationId: conversation.id,
      userId: pick(userIds, i),
      role: 'MEMBER' as const,
      joinedAt: conversation.createdAt,
    },
    {
      id: id('cp'),
      conversationId: conversation.id,
      userId: pick(userIds, i + 1),
      role: 'MEMBER' as const,
      joinedAt: conversation.createdAt,
      unreadCount: i % 9,
    },
  ]);

  await chunk('participants', participants, (batch) =>
    prisma.conversationParticipant.createMany({
      data: batch,
      skipDuplicates: true,
    }),
  );

  const messages = conversations.flatMap((conversation, conversationIndex) =>
    Array.from({ length: config.messagesPerConversation }, (_, messageIndex) => {
      const createdAt = new Date(
        conversation.createdAt.getTime() + messageIndex * 10_000,
      );

      return {
        id: id('msg'),
        conversationId: conversation.id,
        senderId: pick(userIds, conversationIndex + messageIndex),
        content: `Perf message ${config.runId}/${conversationIndex}/${messageIndex}`,
        createdAt,
        updatedAt: createdAt,
      };
    }),
  );

  await chunk('messages', messages, (batch) =>
    prisma.message.createMany({ data: batch, skipDuplicates: true }),
  );

  const lastMessages = conversations.map((conversation, i) => {
    const last = messages[(i + 1) * config.messagesPerConversation - 1];
    return prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageId: last.id,
        lastMessageAt: last.createdAt,
      },
    });
  });

  await Promise.all(lastMessages);

  console.log(`Perf seed complete. runId=${config.runId}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
