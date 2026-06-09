import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";

const TOKEN_PREFIX = "fos";
const TOKEN_BYTES = 32;

export function generateApiToken() {
  return `${TOKEN_PREFIX}_${randomBytes(TOKEN_BYTES).toString("base64url")}`;
}

export function hashApiToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function isValidApiTokenFormat(token: string) {
  return token.startsWith(`${TOKEN_PREFIX}_`) && token.length >= 32;
}

export async function authenticateApiToken(rawToken: string) {
  const token = rawToken.trim();

  if (!isValidApiTokenFormat(token)) {
    return null;
  }

  const tokenHash = hashApiToken(token);
  const apiToken = await prisma.apiToken.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      tokenHash: true,
      revokedAt: true,
      user: {
        select: {
          id: true,
          suspendedAt: true,
        },
      },
    },
  });

  if (!apiToken || apiToken.revokedAt || apiToken.user.suspendedAt) {
    return null;
  }

  const supplied = Buffer.from(tokenHash);
  const stored = Buffer.from(apiToken.tokenHash);

  if (supplied.length !== stored.length || !timingSafeEqual(supplied, stored)) {
    return null;
  }

  await prisma.apiToken.update({
    where: { id: apiToken.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    tokenId: apiToken.id,
    userId: apiToken.user.id,
  };
}
