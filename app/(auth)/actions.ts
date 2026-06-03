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

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function errorRedirect(path: "/login" | "/signup", message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
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

  redirect("/login?success=Account created. Please check your email to verify your account.");
}

export async function loginAction(formData: FormData) {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    errorRedirect("/login", "Email and password are required.");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
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
  await sendLoginNotification({ email: user.email });
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
