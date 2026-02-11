
import 'dotenv/config';
// import PrismaPkg from '../generated/client.js';
import { PrismaClient } from '../generated/client';
// import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
// import { PrismaMysql } from "@prisma/adapter-mysql";

// const { PrismaClient } = PrismaPkg;

// const adapter = new PrismaMariaDb({
//   url: process.env.DATABASE_URL
// });

const adapter = new PrismaMariaDb({
  host: process.env.MYSQL_HOST!,
  user: process.env.MYSQL_USER!,
  password: process.env.MYSQL_PASSWORD!,
  database: process.env.MYSQL_DB!,
  port: Number(process.env.MYSQL_PORT)!,

  // talk to mayank
  // --> cloudside config. ok to proceed or not?
  ssl: { rejectUnauthorized: false },
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

export default prisma;