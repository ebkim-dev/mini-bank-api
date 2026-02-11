
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
  host: process.env.MYSQL_HOST || 'fdmt-mysql-uks-mysqlcourse-001.mysql.database.azure.com',
  user: process.env.MYSQL_USER || 'byunggyukim',
  password: process.env.MYSQL_PASSWORD || '$7yHci^8&fHyx=sR',
  database: process.env.MYSQL_DB || 'minibankapi',
  port: Number(process.env.MYSQL_PORT) || 3306,

  // talk to mayank
  // --> cloudside config. ok to proceed or not?
  ssl: { rejectUnauthorized: false },
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

export default prisma;