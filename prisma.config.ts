import "dotenv/config";
import { defineConfig, env } from "prisma/config";

const directUrl = process.env.DIRECT_URL;

if (!directUrl) {
  throw new Error(
    "DIRECT_URL is required for Prisma CLI commands. Use the direct Supabase connection on port 5432, not the pooled DATABASE_URL on port 6543.",
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DIRECT_URL"),
  },
});
