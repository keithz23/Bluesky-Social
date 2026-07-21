import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL ?? 'admin@gmail.com';

  const password = process.env.ADMIN_PASSWORD ?? 'Admin@123';

  const hash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      username: 'Administrator',
      displayName: 'Administrator',
      email,
      passwordHash: hash,
      verified: true,
    },
  });

  const role = await prisma.role.findUnique({
    where: {
      name: 'admin',
    },
  });

  if (!role) throw new Error('Admin role not found');

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: admin.id,
        roleId: role.id,
      },
    },
    update: {},
    create: {
      userId: admin.id,
      roleId: role.id,
    },
  });

  console.log('✅ Admin seeded');
}
