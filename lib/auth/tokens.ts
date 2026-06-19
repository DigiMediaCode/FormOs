import "server-only";

import { AuthTokenType } from "@prisma/client";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
const LOGIN_OTP_TTL_MS = 10 * 60 * 1000;

export type ValidAuthToken = {
  id: string;
  email: string;
  userId: string | null;
  type: AuthTokenType;
};

export function generateRawAuthToken() {
  return randomBytes(32).toString("base64url");
}

export function hashAuthToken(rawToken: string) {
  return createHash("sha256").update(rawToken).digest("hex");
}

function tokenTtl(type: AuthTokenType) {
  if (type === AuthTokenType.EMAIL_VERIFICATION) {
    return EMAIL_VERIFICATION_TTL_MS;
  }

  if (type === AuthTokenType.LOGIN_OTP) {
    return LOGIN_OTP_TTL_MS;
  }

  return PASSWORD_RESET_TTL_MS;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function safeEqual(first: string, second: string) {
  const firstBuffer = Buffer.from(first);
  const secondBuffer = Buffer.from(second);

  return (
    firstBuffer.length === secondBuffer.length &&
    timingSafeEqual(firstBuffer, secondBuffer)
  );
}

export async function createAuthToken(input: {
  email: string;
  type: AuthTokenType;
  userId?: string | null;
}) {
  const rawToken = generateRawAuthToken();
  const tokenHash = hashAuthToken(rawToken);
  const expiresAt = new Date(Date.now() + tokenTtl(input.type));

  await prisma.authToken.create({
    data: {
      email: normalizeEmail(input.email),
      type: input.type,
      userId: input.userId ?? null,
      tokenHash,
      expiresAt,
    },
  });

  return {
    rawToken,
    expiresAt,
  };
}

export async function findValidAuthToken(rawToken: string, type: AuthTokenType) {
  const tokenHash = hashAuthToken(rawToken);
  const token = await prisma.authToken.findFirst({
    where: {
      tokenHash,
      type,
      usedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
      email: true,
      userId: true,
      type: true,
      tokenHash: true,
    },
  });

  if (!token || !safeEqual(token.tokenHash, tokenHash)) {
    return null;
  }

  return {
    id: token.id,
    email: token.email,
    userId: token.userId,
    type: token.type,
  } satisfies ValidAuthToken;
}

export async function markAuthTokenUsed(tokenId: string) {
  await prisma.authToken.update({
    where: { id: tokenId },
    data: {
      usedAt: new Date(),
    },
  });
}

export async function hasRecentAuthToken(input: {
  email: string;
  type: AuthTokenType;
  minutes: number;
}) {
  const recentToken = await prisma.authToken.findFirst({
    where: {
      email: normalizeEmail(input.email),
      type: input.type,
      createdAt: {
        gt: new Date(Date.now() - input.minutes * 60 * 1000),
      },
    },
    select: {
      id: true,
    },
  });

  return Boolean(recentToken);
}

export async function invalidateUnusedAuthTokens(input: {
  email: string;
  type: AuthTokenType;
  exceptTokenId?: string;
}) {
  await prisma.authToken.updateMany({
    where: {
      email: normalizeEmail(input.email),
      type: input.type,
      usedAt: null,
      id: input.exceptTokenId ? { not: input.exceptTokenId } : undefined,
    },
    data: {
      usedAt: new Date(),
    },
  });
}
