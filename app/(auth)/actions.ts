"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { destroySession } from "@/lib/auth/session";
import {
  resendPendingLoginCode,
  startLoginVerification,
  verifyPendingLoginCode,
} from "@/lib/auth/login-verification";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createAuthToken } from "@/lib/auth/tokens";
import {
  sendSignupNotification,
} from "@/lib/notifications/auth-notifications";
import { sendEmailVerificationEmail } from "@/lib/notifications/auth-token-notifications";
import { AuthTokenType } from "@prisma/client";
import { checkRateLimit, rateLimitKey } from "@/lib/security/rate-limit";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function errorRedirect(
  path: "/login" | "/signup",
  message: string,
  extras?: Record<string, string>,
): never {
  const params = new URLSearchParams({
    error: message,
    ...(extras ?? {}),
  });
  redirect(`${path}?${params.toString()}`);
}

function safeTemplateParam(value: FormDataEntryValue | null) {
  const template = String(value ?? "").trim();

  return /^[a-z0-9-]+$/.test(template) ? template : "";
}

function safePlanParam(value: FormDataEntryValue | null) {
  const plan = String(value ?? "").trim().toLowerCase();

  return /^[a-z0-9-]+$/.test(plan) ? plan : "";
}

function checkoutPathForPlan(plan: string) {
  return `/api/billing/start-trial?plan=${encodeURIComponent(plan)}&interval=monthly`;
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
  const plan = safePlanParam(formData.get("plan"));
  const paidTrialPlan = plan && plan !== "free" ? plan : "";
  const redirectParams = {
    ...(template ? { template } : {}),
    ...(paidTrialPlan ? { plan: paidTrialPlan } : {}),
  };

  if (!email || !password) {
    errorRedirect("/signup", "Email and password are required.", redirectParams);
  }

  if (password.length < 8) {
    errorRedirect("/signup", "Password must be at least 8 characters.", redirectParams);
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
      errorRedirect("/signup", "An account already exists for that email.", redirectParams);
    }

    errorRedirect("/signup", "Unable to create your account right now.", redirectParams);
  }

  const loginParams = new URLSearchParams({
    success: "Account created. Please check your email to verify your account.",
  });

  if (template) {
    loginParams.set("template", template);
  }

  if (paidTrialPlan) {
    loginParams.set("plan", paidTrialPlan);
  }

  redirect(`/login?${loginParams.toString()}`);
}

export async function loginAction(formData: FormData) {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const template = safeTemplateParam(formData.get("template"));
  const plan = safePlanParam(formData.get("plan"));
  const paidTrialPlan = plan && plan !== "free" ? plan : "";
  const redirectParams = {
    ...(template ? { template } : {}),
    ...(paidTrialPlan ? { plan: paidTrialPlan } : {}),
  };

  if (!email || !password) {
    errorRedirect("/login", "Email and password are required.", redirectParams);
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
      redirectParams,
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
    errorRedirect("/login", "Invalid email or password.", redirectParams);
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash);

  if (!isValidPassword) {
    errorRedirect("/login", "Invalid email or password.", redirectParams);
  }

  const verification = await startLoginVerification({
    user,
    nextPath: paidTrialPlan
      ? checkoutPathForPlan(paidTrialPlan)
      : template
        ? `/dashboard?template=${template}`
        : "/dashboard",
  });

  if (!verification.ok) {
    errorRedirect("/login", verification.message, redirectParams);
  }

  redirect(
    `/verify-login?success=${encodeURIComponent(verification.message)}`,
  );
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function verifyLoginCodeAction(formData: FormData) {
  const code = String(formData.get("code") ?? "");
  const result = await verifyPendingLoginCode(code);

  if (!result.ok) {
    const message =
      "message" in result && result.message
        ? result.message
        : "Unable to verify that login code.";
    redirect(`/verify-login?error=${encodeURIComponent(message)}`);
  }

  const nextPath =
    "nextPath" in result && result.nextPath ? result.nextPath : "/dashboard";
  redirect(nextPath);
}

export async function resendLoginCodeAction() {
  const result = await resendPendingLoginCode();
  const paramName = result.ok ? "success" : "error";
  const message =
    "message" in result && result.message
      ? result.message
      : "Unable to send another code.";

  redirect(`/verify-login?${paramName}=${encodeURIComponent(message)}`);
}
