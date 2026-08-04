import { PrismaClient } from '@prisma/client';
import { seedRBAC } from './seeds/rbac.seed';
import { seedAdmin } from './seeds/admin.seed';
import { seedRealistic } from './seed-realistic';
import { seedRulesKeywords } from './seeds/rule-keywords.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');
  await seedRBAC(prisma);
  await seedAdmin(prisma);
  await seedRealistic(prisma);
  await seedRulesKeywords(prisma);

  const admin = await prisma.user.findUnique({
    where: { email: process.env.ADMIN_EMAIL ?? 'admin@gmail.com' },
    select: { id: true },
  });
  if (admin) {
    await prisma.userPinnedFeed.createMany({
      data: ['discover', 'following', 'popular'].map((feedSlug, position) => ({
        userId: admin.id,
        feedSlug,
        position,
      })),
      skipDuplicates: true,
    });
  }
  console.log('Database seed complete.');
}

main()
  .catch((error) => {
    console.error('Database seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
