import { PrismaClient } from '@prisma/client';
import { seedRBAC } from './seeds/rbac.seed';
import { seedAdmin } from './seeds/admin.seed';
import { main as seedPerf } from './seed-realistic';

const prisma = new PrismaClient();

async function main() {
  await seedRBAC();

  await seedAdmin();
  await seedPerf();
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
