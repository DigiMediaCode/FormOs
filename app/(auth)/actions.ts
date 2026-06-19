"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createAuthToken } from "@/lib/auth/tokens";
import {
  sendLoginNotification,
  sendSignupNotification,
} from "@/lib/notifications/auth-notifications";
import { sendEmailVerificationEmail } from "@/lib/notifications/auth-token-notifications";
import { AuthTokenType } from "@prisma/client";
import { checkRateLimit, rateLimitKey } from "@/lib/security/rate-limit";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function errorRedirect(path: "/login" | "/signup", message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function safeTemplateParam(value: FormDataEntryValue | null) {
  const template = String(value ?? "").trim();

  return /^[a-z0-9-]+$/.test(template) ? template : "";
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}

export async function signupAction(formData: FormData) {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const name = [firstName, lastName].filter(Boolean).join(" ").trim();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const template = safeTemplateParam(formData.get("template"));

  if (!email || !password) {
    errorRedirect("/signup", "Email and password are required.");
  }

  if (password.length < 8) {
    errorRedirect("/signup", "Password must be at least 8 characters.");
  }

  try {
    const user = await prisma.user.create({
      data: {
        name: name || null,
        firstName: firstName || null,
        lastName: lastName || null,
        email,
        passwordHash: await hashPassword(password),
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    await sendSignupNotification(user);
    const verificationToken = await createAuthToken({
      email: user.email,
      type: AuthTokenType.EMAIL_VERIFICATION,
      userId: user.id,
    });
    await sendEmailVerificationEmail({
      email: user.email,
      name: user.name,
      rawToken: verificationToken.rawToken,
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      errorRedirect("/signup", "An account already exists for that email.");
    }

    errorRedirect("/signup", "Unable to create your account right now.");
  }

  const loginParams = new URLSearchParams({
    success: "Account created. Please check your email to verify your account.",
  });

  if (template) {
    loginParams.set("template", template);
  }

  redirect(`/login?${loginParams.toString()}`);
}

export async function loginAction(formData: FormData) {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const template = safeTemplateParam(formData.get("template"));

  if (!email || !password) {
    errorRedirect("/login", "Email and password are required.");
  }

  const rateLimit = checkRateLimit({
    key: rateLimitKey("login", email),
    limit: 8,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    errorRedirect(
      "/login",
      `Too many login attempts. Please try again in ${rateLimit.retryAfterSeconds} seconds.`,
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      name: true,
      passwordHash: true,
    },
  });

  if (!user || !user.passwordHash) {
    errorRedirect("/login", "Invalid email or password.");
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash);

  if (!isValidPassword) {
    errorRedirect("/login", "Invalid email or password.");
  }

  await createSession(user.id);
  await sendLoginNotification(user);
  redirect(template ? `/dashboard?template=${template}` : "/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
