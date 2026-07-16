import "server-only";

import { AuthTokenType } from "@prisma/client";
import { randomInt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { createSession } from "@/lib/auth/session";
import { hashAuthToken, invalidateUnusedAuthTokens } from "@/lib/auth/tokens";
import { setRestorePlanPromptCookieForUser } from "@/lib/billing/payment-failure";
import { sendLoginNotification, sendLoginVerificationCode } from "@/lib/notifications/auth-notifications";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitKey } from "@/lib/security/rate-limit";

const LOGIN_VERIFICATION_COOKIE = "formos_login_verification";
const LOGIN_VERIFICATION_NEXT_COOKIE = "formos_login_verification_next";
const LOGIN_CODE_TTL_MINUTES = 10;
const LOGIN_CODE_MAX_AGE_SECONDS = LOGIN_CODE_TTL_MINUTES * 60;

type LoginVerificationUser = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  suspendedAt?: Date | null;
};

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: LOGIN_CODE_MAX_AGE_SECONDS,
    path: "/",
  };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeNextPath(value?: string | null) {
  const path = String(value ?? "").trim();

  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return "/dashboard";
  }

  return path;
}

function generateLoginCode() {
  return String(randomInt(100000, 1000000));
}

function normalizeLoginCode(value: string) {
  return value.replace(/\D/g, "").slice(0, 6);
}

function safeEqual(first: string, second: string) {
  const firstBuffer = Buffer.from(first);
  const secondBuffer = Buffer.from(second);

  return (
    firstBuffer.length === secondBuffer.length &&
    timingSafeEqual(firstBuffer, secondBuffer)
  );
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");

  if (!name || !domain) {
    return email;
  }

  const visible = name.length <= 2 ? name[0] : name.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(2, name.length - visible.length))}@${domain}`;
}

async function getPendingCookieValues() {
  const cookieStore = await cookies();

  return {
    tokenId: cookieStore.get(LOGIN_VERIFICATION_COOKIE)?.value ?? "",
    nextPath: normalizeNextPath(
      cookieStore.get(LOGIN_VERIFICATION_NEXT_COOKIE)?.value,
    ),
  };
}

export async function clearPendingLoginVerification() {
  const cookieStore = await cookies();
  cookieStore.delete(LOGIN_VERIFICATION_COOKIE);
  cookieStore.delete(LOGIN_VERIFICATION_NEXT_COOKIE);
}

export async function startLoginVerification(input: {
  user: LoginVerificationUser;
  nextPath?: string | null;
}) {
  if (input.user.suspendedAt) {
    return {
      ok: false,
      message: "Your account has been suspended. Please contact support.",
    };
  }

  const email = normalizeEmail(input.user.email);
  const code = generateLoginCode();
  const tokenHash = hashAuthToken(code);
  const expiresAt = new Date(Date.now() + LOGIN_CODE_MAX_AGE_SECONDS * 1000);

  await invalidateUnusedAuthTokens({
    email,
    type: AuthTokenType.LOGIN_OTP,
  });

  const token = await prisma.authToken.create({
    data: {
      email,
      type: AuthTokenType.LOGIN_OTP,
      userId: input.user.id,
      tokenHash,
      expiresAt,
    },
    select: {
      id: true,
    },
  });

  const sent = await sendLoginVerificationCode({
    user: input.user,
    code,
    expiresInMinutes: LOGIN_CODE_TTL_MINUTES,
  });

  if (!sent) {
    await prisma.authToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() },
    });
    await clearPendingLoginVerification();

    return {
      ok: false,
      message: "Unable to send your login code right now. Please try again.",
    };
  }

  const cookieStore = await cookies();
  cookieStore.set(LOGIN_VERIFICATION_COOKIE, token.id, cookieOptions());
  cookieStore.set(
    LOGIN_VERIFICATION_NEXT_COOKIE,
    normalizeNextPath(input.nextPath),
    cookieOptions(),
  );

  return {
    ok: true,
    message: "We sent a login code to your email address.",
  };
}

export async function getPendingLoginVerification() {
  const { tokenId } = await getPendingCookieValues();

  if (!tokenId) {
    return null;
  }

  const token = await prisma.authToken.findFirst({
    where: {
      id: tokenId,
      type: AuthTokenType.LOGIN_OTP,
      usedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    select: {
      email: true,
      expiresAt: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          name: true,
          suspendedAt: true,
        },
      },
    },
  });

  if (!token?.user) {
    return null;
  }

  return {
    email: token.email,
    maskedEmail: maskEmail(token.email),
    expiresAt: token.expiresAt,
    createdAt: token.createdAt,
    user: token.user,
  };
}

export async function verifyPendingLoginCode(rawCode: string) {
  const { tokenId, nextPath } = await getPendingCookieValues();

  if (!tokenId) {
    return {
      ok: false,
      message: "Your login verification session has expired. Please log in again.",
    };
  }

  const rateLimit = checkRateLimit({
    key: rateLimitKey("login-otp", tokenId),
    limit: 8,
    windowMs: LOGIN_CODE_MAX_AGE_SECONDS * 1000,
  });

  if (!rateLimit.allowed) {
    return {
      ok: false,
      message: `Too many code attempts. Please try again in ${rateLimit.retryAfterSeconds} seconds.`,
    };
  }

  const code = normalizeLoginCode(rawCode);

  if (!/^\d{6}$/.test(code)) {
    return {
      ok: false,
      message: "Enter the 6-digit login code from your email.",
    };
  }

  const token = await prisma.authToken.findFirst({
    where: {
      id: tokenId,
      type: AuthTokenType.LOGIN_OTP,
      usedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
      tokenHash: true,
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          name: true,
          suspendedAt: true,
        },
      },
    },
  });

  if (!token?.user || !safeEqual(token.tokenHash, hashAuthToken(code))) {
    return {
      ok: false,
      message: "That login code is invalid or expired.",
    };
  }

  if (token.user.suspendedAt) {
    await prisma.authToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() },
    });
    await clearPendingLoginVerification();

    return {
      ok: false,
      message: "Your account has been suspended. Please contact support.",
    };
  }

  await prisma.authToken.update({
    where: { id: token.id },
    data: { usedAt: new Date() },
  });
  await createSession(token.user.id);
  await setRestorePlanPromptCookieForUser(token.user.id);
  await clearPendingLoginVerification();
  await sendLoginNotification(token.user);

  return {
    ok: true,
    nextPath,
  };
}

export async function resendPendingLoginCode() {
  const pending = await getPendingLoginVerification();
  const { nextPath } = await getPendingCookieValues();

  if (!pending) {
    return {
      ok: false,
      message: "Your login verification session has expired. Please log in again.",
    };
  }

  const secondsSinceLastCode =
    (Date.now() - pending.createdAt.getTime()) / 1000;

  if (secondsSinceLastCode < 60) {
    return {
      ok: false,
      message: "Please wait a minute before requesting another code.",
    };
  }

  const rateLimit = checkRateLimit({
    key: rateLimitKey("login-otp-resend", pending.email),
    limit: 4,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return {
      ok: false,
      message: `Too many code requests. Please try again in ${rateLimit.retryAfterSeconds} seconds.`,
    };
  }

  return startLoginVerification({
    user: pending.user,
    nextPath,
  });
}
