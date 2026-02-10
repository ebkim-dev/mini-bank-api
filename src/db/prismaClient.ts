
import 'dotenv/config';
// import PrismaPkg from '../generated/client.js';
import { PrismaClient } from '../generated/client';
// import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

// const { PrismaClient } = PrismaPkg;

const adapter = new PrismaMariaDb({
  host: process.env.MYSQL_HOST!,
  user: process.env.MYSQL_USER!,
  password: process.env.MYSQL_PASSWORD!,
  database: process.env.MYSQL_DB!,
  port: Number(process.env.MYSQL_PORT)!,
  connectionLimit: 5,
});

// const prisma = new PrismaClient();
const prisma = new PrismaClient({ adapter });

export default prisma;