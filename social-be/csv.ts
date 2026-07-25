import { createWriteStream } from 'fs';
import { faker } from '@faker-js/faker';
import { randomUUID } from 'crypto';

const TOTAL_USERS = 1_000_000;
const BATCH_SIZE = 10_000;

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

async function writeToStream(stream: NodeJS.WritableStream, data: string) {
  if (!stream.write(data)) {
    await new Promise<void>((resolve) => stream.once('drain', resolve));
  }
}

async function generateUsers() {
  console.log('Starting...');
  const userStream = createWriteStream('users.csv');

  const streamError = new Promise<never>((_, reject) => {
    userStream.on('error', (err) => reject(err));
  });

  const header =
    'id,username,display_name,email,verified,is_private,is_online,followers_count,following_count,posts_count,status,two_factor_enabled,created_at,updated_at\n';
  await writeToStream(userStream, header);

  let buffer = '';

  const writeUsers = async () => {
    for (let i = 0; i < TOTAL_USERS; i++) {
      const id = `user_${randomUUID().replace(/-/g, '')}`;
      const username = faker.internet.username().toLowerCase() + `_${i}`;

      const displayName = csvEscape(`${faker.person.fullName()} ${i}`);
      const email = `test_${i}@example.com`;
      const createdAt = new Date().toISOString();

      const verified = false;
      const isPrivate = false;
      const isOnline = false;
      const followersCount = 0;
      const followingCount = 0;
      const postsCount = 0;
      const status = 'ACTIVE';
      const twoFactorEnabled = false;

      buffer += `${id},${username},${displayName},${email},${verified},${isPrivate},${isOnline},${followersCount},${followingCount},${postsCount},${status},${twoFactorEnabled},${createdAt},${createdAt}\n`;

      if ((i + 1) % BATCH_SIZE === 0) {
        await writeToStream(userStream, buffer);
        buffer = '';
        process.stdout.write(`\r${i + 1} / ${TOTAL_USERS} users`);
        await new Promise((resolve) => setImmediate(resolve));
      }
    }

    if (buffer.length > 0) {
      await writeToStream(userStream, buffer);
    }
  };

  await Promise.race([writeUsers(), streamError]);

  await new Promise<void>((resolve, reject) => {
    userStream.end((err?: Error | null) => (err ? reject(err) : resolve()));
  });

  console.log('\nDone users.csv!');
}

generateUsers().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
