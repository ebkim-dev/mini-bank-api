import 'dotenv/config';
import prisma from '../src/db/prismaClient';
import bcrypt from "bcrypt";
import { UserRole } from '../src/generated/enums';
import { mockCustomerId1, mockCustomerId2, mockCustomerId3, mockEmail, mockFirstName, mockLastName } from '../tests/commonMock';

async function main() {

  // Admin 1

  const seedAdminCustomerCreateInput = {
    id: mockCustomerId1,
    first_name: mockFirstName,
    last_name: mockLastName,
    email: mockEmail
  };

  const seedAdminUserCreateInput = {
    customer_id: mockCustomerId1,
    username: process.env.SEED_ADMIN_USERNAME!,
    password_hash: await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD!, 10),
    role: UserRole.ADMIN
  };

  await prisma.customer.upsert({
    where: { email: mockEmail },
    update: {},
    create: seedAdminCustomerCreateInput
  });

  await prisma.user.upsert({
    where: { username: seedAdminUserCreateInput.username },
    update: {},
    create: seedAdminUserCreateInput
  });

  // Standard 1

  const seedStandardCustomerCreateInput1 = {
    id: mockCustomerId2,
    first_name: mockFirstName,
    last_name: mockLastName,
    email: "standard@mock.com"
  };

  const seedStandardUserCreateInput1 = {
    customer_id: mockCustomerId2,
    username: process.env.SEED_STANDARD_USERNAME1!,
    password_hash: await bcrypt.hash(process.env.SEED_STANDARD_PASSWORD1!, 10),
    role: UserRole.STANDARD
  };

  await prisma.customer.upsert({
    where: { email: seedStandardCustomerCreateInput1.email },
    update: {},
    create: seedStandardCustomerCreateInput1
  });

  await prisma.user.upsert({
    where: { username: seedStandardUserCreateInput1.username },
    update: {},
    create: seedStandardUserCreateInput1
  });

  // Standard 2

  const seedStandardCustomerCreateInput2 = {
    id: mockCustomerId3,
    first_name: mockFirstName,
    last_name: mockLastName,
    email: "standard2@mock.com"
  };

  const seedStandardUserCreateInput2 = {
    customer_id: mockCustomerId3,
    username: process.env.SEED_STANDARD_USERNAME2!,
    password_hash: await bcrypt.hash(process.env.SEED_STANDARD_PASSWORD2!, 10),
    role: UserRole.STANDARD
  };

  await prisma.customer.upsert({
    where: { email: seedStandardCustomerCreateInput2.email },
    update: {},
    create: seedStandardCustomerCreateInput2
  });

  await prisma.user.upsert({
    where: { username: seedStandardUserCreateInput2.username },
    update: {},
    create: seedStandardUserCreateInput2
  });

  console.log("Users seeded.");
  
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());