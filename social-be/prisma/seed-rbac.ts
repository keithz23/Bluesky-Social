import { PrismaClient } from '@prisma/client';
import { seedRBAC } from './seeds/rbac.seed';

const prisma = new PrismaClient();

seedRBAC(prisma)
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
