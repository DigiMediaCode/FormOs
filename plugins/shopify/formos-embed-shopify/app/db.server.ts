import { PrismaClient } from "@prisma/client";

declare global {
  var __formosShopifyPrisma: PrismaClient | undefined;
}

const prisma = global.__formosShopifyPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__formosShopifyPrisma = prisma;
}

export default prisma;

