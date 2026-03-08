

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

  const customerId = "550e8400-e29b-41d4-a716-446655440000";
  const seedCustomerCreateInput = {
    id: customerId,
    first_name: "Seed",
    last_name: "Customer",
    email: "seed.customer@example.com"
  }

  await prisma.user.upsert({
    where: { username: process.env.SEED_ADMIN_USERNAME! },
    update: {},
    create: seedAccountCreateInput
  });

  await prisma.customer.upsert({
    where: { id: customerId },
    update: {},
    create: seedCustomerCreateInput
  });

  console.log("Admin seeded.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());