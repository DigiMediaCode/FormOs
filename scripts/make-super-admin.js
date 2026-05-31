require("dotenv/config");

const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();

  if (!email) {
    console.error("Usage: node scripts/make-super-admin.js user@example.com");
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;

  if (!databaseUrl) {
    console.error("DATABASE_URL or DIRECT_URL is required.");
    process.exit(1);
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg(databaseUrl),
  });

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (!user) {
      console.error(`No FormOS user found for ${email}.`);
      process.exit(1);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { role: "SUPER_ADMIN" },
    });

    console.log(`${user.email} is now a SUPER_ADMIN.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Unable to update user role.");
  process.exit(1);
});
