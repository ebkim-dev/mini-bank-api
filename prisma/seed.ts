import 'dotenv/config';
import prisma from '../src/db/prismaClient';
import bcrypt from "bcrypt";
import { UserRole } from '../src/generated/enums';
import { mockCustomerId, mockEmail, mockFirstName, mockLastName } from '../tests/commonMock';

async function main() {
  const hashedPassword = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD!, 10);

  const seedCustomerCreateInput = {
    id: mockCustomerId,
    first_name: mockFirstName,
    last_name: mockLastName,
    email: mockEmail
  }

  const seedUserCreateInput = {
    customer_id: mockCustomerId,
    username: process.env.SEED_ADMIN_USERNAME!,
    password_hash: hashedPassword,
    role: UserRole.ADMIN
  }

  await prisma.customer.upsert({
    where: { email: mockEmail },
    update: {},
    create: seedCustomerCreateInput
  });

  await prisma.user.upsert({
    where: { username: process.env.SEED_ADMIN_USERNAME! },
    update: {},
    create: seedUserCreateInput
  });

  console.log("Admin seeded.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());