import "server-only";

import { cookies } from "next/headers";
import type { Prisma } from "@prisma/client";
import { RESTORE_PLAN_PROMPT_COOKIE } from "@/lib/billing/restore-plan-cookie";
import { prisma } from "@/lib/prisma";

const RESTORE_PLAN_WINDOW_DAYS = 14;
const RESTORE_PLAN_WINDOW_MS = RESTORE_PLAN_WINDOW_DAYS * 24 * 60 * 60 * 1000;

export type RestorePlanPrompt = {
  planName: string;
  restoreUntil: Date;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function metadataRecord(value: unknown) {
  return isRecord(value) ? value : {};
}

function parseDate(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: false,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge,
    path: "/",
  };
}

export function getPaymentFailureRestoreWindow(metadata: unknown) {
  return parseDate(metadataRecord(metadata).paymentFailureRestoreUntil);
}

export function isRestoreWindowActive(metadata: unknown) {
  const restoreUntil = getPaymentFailureRestoreWindow(metadata);

  return Boolean(restoreUntil && restoreUntil.getTime() > Date.now());
}

export async function markPaymentFailureRestoreWindow(input: {
  userId: string;
  invoiceId?: string | null;
  hostedInvoiceUrl?: string | null;
}) {
  const subscription = await prisma.userSubscription.findUnique({
    where: { userId: input.userId },
    select: {
      metadata: true,
      plan: {
        select: {
          name: true,
        },
      },
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          name: true,
        },
      },
    },
  });

  if (!subscription?.user) {
    return null;
  }

  const now = new Date();
  const restoreUntil = new Date(now.getTime() + RESTORE_PLAN_WINDOW_MS);
  const metadata = {
    ...metadataRecord(subscription.metadata),
    paymentFailedAt: now.toISOString(),
    paymentFailureRestoreUntil: restoreUntil.toISOString(),
    paymentFailurePlanName: subscription.plan?.name ?? "paid plan",
    lastPaymentFailureInvoiceId: input.invoiceId ?? "",
    hostedInvoiceUrl: input.hostedInvoiceUrl ?? "",
  };

  await prisma.userSubscription.update({
    where: { userId: input.userId },
    data: {
      metadata: metadata as Prisma.InputJsonValue,
    },
  });

  return {
    user: subscription.user,
    planName: subscription.plan?.name ?? "paid plan",
    restoreUntil,
  };
}

export async function clearPaymentFailureRestoreWindow(userId: string) {
  const subscription = await prisma.userSubscription.findUnique({
    where: { userId },
    select: { metadata: true },
  });

  if (!subscription) {
    return;
  }

  const rest = { ...metadataRecord(subscription.metadata) };
  delete rest.paymentFailedAt;
  delete rest.paymentFailureRestoreUntil;
  delete rest.paymentFailurePlanName;
  delete rest.lastPaymentFailureInvoiceId;
  delete rest.hostedInvoiceUrl;

  await prisma.userSubscription.update({
    where: { userId },
    data: {
      metadata: rest as Prisma.InputJsonValue,
    },
  });
}

export async function getRestorePlanPromptForUser(
  userId: string,
): Promise<RestorePlanPrompt | null> {
  const subscription = await prisma.userSubscription.findUnique({
    where: { userId },
    select: {
      status: true,
      metadata: true,
      plan: {
        select: {
          name: true,
        },
      },
    },
  });

  if (subscription?.status !== "PAST_DUE") {
    return null;
  }

  const restoreUntil = getPaymentFailureRestoreWindow(subscription.metadata);

  if (!restoreUntil || restoreUntil.getTime() <= Date.now()) {
    return null;
  }

  return {
    planName: subscription.plan?.name ?? "paid plan",
    restoreUntil,
  };
}

export async function setRestorePlanPromptCookieForUser(userId: string) {
  const prompt = await getRestorePlanPromptForUser(userId);
  const cookieStore = await cookies();

  if (!prompt) {
    cookieStore.delete(RESTORE_PLAN_PROMPT_COOKIE);
    return;
  }

  const maxAge = Math.max(
    60,
    Math.floor((prompt.restoreUntil.getTime() - Date.now()) / 1000),
  );

  cookieStore.set(RESTORE_PLAN_PROMPT_COOKIE, "1", cookieOptions(maxAge));
}

export async function shouldShowRestorePlanPrompt(userId: string) {
  const cookieStore = await cookies();

  if (cookieStore.get(RESTORE_PLAN_PROMPT_COOKIE)?.value !== "1") {
    return null;
  }

  return getRestorePlanPromptForUser(userId);
}
