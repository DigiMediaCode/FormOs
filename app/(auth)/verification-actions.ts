"use server";

import { AuthTokenType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  createAuthToken,
  findValidAuthToken,
  hasRecentAuthToken,
  invalidateUnusedAuthTokens,
  markAuthTokenUsed,
} from "@/lib/auth/tokens";
import { hashPassword } from "@/lib/auth/password";
import {
  sendEmailVerificationEmail,
  sendPasswordResetEmail,
} from "@/lib/notifications/auth-token-notifications";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitKey } from "@/lib/security/rate-limit";

const FORGOT_PASSWORD_SUCCESS =
  "If an account exists for this email, a password reset link has been sent.";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function redirectWith(
  path: string,
  messageType: "error" | "success",
  message: string,
): never {
  redirect(`${path}?${messageType}=${encodeURIComponent(message)}`);
}

export async function resendVerificationEmailAction() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.emailVerifiedAt) {
    redirectWith("/dashboard", "success", "Your email is already verified.");
  }

  const rateLimit = checkRateLimit({
    key: rateLimitKey("resend-verification", user.email),
    limit: 3,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    redirectWith(
      "/dashboard",
      "success",
      "A verification email was sent recently. Please check your inbox.",
    );
  }

  if (
    await hasRecentAuthToken({
      email: user.email,
      type: AuthTokenType.EMAIL_VERIFICATION,
      minutes: 3,
    })
  ) {
    redirectWith(
      "/dashboard",
      "success",
      "A verification email was sent recently. Please check your inbox.",
    );
  }

  const token = await createAuthToken({
    email: user.email,
    type: AuthTokenType.EMAIL_VERIFICATION,
    userId: user.id,
  });

  await sendEmailVerificationEmail({
    email: user.email,
    name: user.name,
    rawToken: token.rawToken,
  });

  redirectWith("/dashboard", "success", "Verification email sent.");
}

export async function verifyEmailToken(rawToken: string) {
  const token = await findValidAuthToken(
    rawToken,
    AuthTokenType.EMAIL_VERIFICATION,
  );

  if (!token) {
    return {
      ok: false,
      message: "This verification link is invalid, expired, or already used.",
    };
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: token.userId
        ? [{ id: token.userId }, { email: token.email }]
        : [{ email: token.email }],
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    return {
      ok: false,
      message: "We could not find an account for this verification link.",
    };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.authToken.update({
      where: { id: token.id },
      data: {
        usedAt: new Date(),
      },
    }),
  ]);

  revalidatePath("/dashboard");

  return {
    ok: true,
    message: "Your email address has been verified.",
  };
}

export async function forgotPasswordAction(formData: FormData) {
  const email = normalizeEmail(String(formData.get("email") ?? ""));

  if (email) {
    const rateLimit = checkRateLimit({
      key: rateLimitKey("forgot-password", email),
      limit: 3,
      windowMs: 30 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      redirectWith("/forgot-password", "success", FORGOT_PASSWORD_SUCCESS);
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
      },
    });

    if (user) {
      const token = await createAuthToken({
        email: user.email,
        type: AuthTokenType.PASSWORD_RESET,
        userId: user.id,
      });

      await sendPasswordResetEmail({
        email: user.email,
        rawToken: token.rawToken,
      });
    }
  }

  redirectWith("/forgot-password", "success", FORGOT_PASSWORD_SUCCESS);
}

export async function resetPasswordAction(formData: FormData) {
  const rawToken = String(formData.get("token") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (password.length < 8) {
    redirectWith(
      `/reset-password?token=${encodeURIComponent(rawToken)}`,
      "error",
      "Password must be at least 8 characters.",
    );
  }

  const token = await findValidAuthToken(rawToken, AuthTokenType.PASSWORD_RESET);

  if (!token) {
    redirectWith(
      "/forgot-password",
      "error",
      "This reset link is invalid, expired, or already used.",
    );
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: token.userId
        ? [{ id: token.userId }, { email: token.email }]
        : [{ email: token.email }],
    },
    select: { id: true, email: true },
  });

  if (!user) {
    redirectWith(
      "/forgot-password",
      "error",
      "This reset link is invalid, expired, or already used.",
    );
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(password),
      },
    }),
    prisma.authToken.update({
      where: { id: token.id },
      data: {
        usedAt: new Date(),
      },
    }),
  ]);

  await invalidateUnusedAuthTokens({
    email: user.email,
    type: AuthTokenType.PASSWORD_RESET,
    exceptTokenId: token.id,
  });

  redirectWith("/login", "success", "Password updated. Please log in.");
}

export async function isPasswordResetTokenValid(rawToken: string) {
  return Boolean(
    await findValidAuthToken(rawToken, AuthTokenType.PASSWORD_RESET),
  );
}
