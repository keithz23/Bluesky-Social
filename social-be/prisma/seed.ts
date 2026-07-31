import { PrismaClient } from '@prisma/client';
import { seedRBAC } from './seeds/rbac.seed';
import { seedAdmin } from './seeds/admin.seed';
import { main as seedPerf } from './seed-realistic';
import { main as seedRulesKeywords } from './seeds/rule-keywords.seed';

const prisma = new PrismaClient();

async function main() {
  await seedRBAC(prisma);

  await seedAdmin();
  await seedPerf();
  await seedRulesKeywords();
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
