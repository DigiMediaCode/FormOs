"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function errorRedirect(path: "/login" | "/signup", message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function signupAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    errorRedirect("/signup", "Email and password are required.");
  }

  if (password.length < 8) {
    errorRedirect("/signup", "Password must be at least 8 characters.");
  }

  try {
    await prisma.user.create({
      data: {
        name: name || null,
        email,
        passwordHash: await hashPassword(password),
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      errorRedirect("/signup", "An account already exists for that email.");
    }

    errorRedirect("/signup", "Unable to create your account right now.");
  }

  redirect("/login?success=Account created. Please log in.");
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
      passwordHash: true,
    },
  });

  if (!user) {
    errorRedirect("/login", "Invalid email or password.");
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash);

  if (!isValidPassword) {
    errorRedirect("/login", "Invalid email or password.");
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
