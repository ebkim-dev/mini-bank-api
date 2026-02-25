

import 'dotenv/config';
import prisma from '../src/db/prismaClient';
import bcrypt from "bcrypt";
import { UserRole } from '../src/generated/enums';

async function main() {
  const hashedPassword = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD!, 10);

  const seedAccountCreateInput = {
    username: process.env.SEED_ADMIN_USERNAME!,
    password_hash: hashedPassword,
    role: UserRole.ADMIN
  }

  await prisma.user.upsert({
    where: { username: process.env.SEED_ADMIN_USERNAME! },
    update: {},
    create: seedAccountCreateInput
  });

  console.log("Admin seeded.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());