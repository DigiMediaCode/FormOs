import "server-only";

import { Prisma } from "@prisma/client";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

type BillingEventStatus = "RECEIVED" | "PROCESSED" | "FAILED" | "DUPLICATE";

type BillingEventInput = {
  provider?: string;
  eventId?: string | null;
  eventType: string;
  userId?: string | null;
  subscriptionId?: string | null;
  customerId?: string | null;
  status?: BillingEventStatus;
  message?: string | null;
  metadata?: Record<string, unknown> | null;
  processedAt?: Date | null;
};

function safeString(value: string | null | undefined, maxLength = 500) {
  if (!value) {
    return null;
  }

  return value.slice(0, maxLength);
}

function sanitizeMetadata(metadata: Record<string, unknown> | null | undefined) {
  if (!metadata) {
    return undefined;
  }

  const safe: Record<string, string | number | boolean | null> = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      safe[key] = typeof value === "string" ? value.slice(0, 500) : value;
    }
  }

  return safe as Prisma.InputJsonValue;
}

export async function createBillingEvent(input: BillingEventInput) {
  try {
    return await prisma.billingEvent.create({
      data: {
        provider: input.provider ?? "stripe",
        eventId: input.eventId ?? null,
        eventType: input.eventType,
        userId: input.userId ?? null,
        subscriptionId: input.subscriptionId ?? null,
        customerId: input.customerId ?? null,
        status: input.status ?? "RECEIVED",
        message: safeString(input.message),
        metadata: sanitizeMetadata(input.metadata),
        processedAt: input.processedAt ?? undefined,
      },
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: unknown }).code === "P2002" &&
      input.eventId
    ) {
      return findBillingEventByStripeEventId(input.eventId);
    }

    console.warn("[formos:billing-events] Billing event logging failed safely.", {
      eventType: input.eventType,
      error: error instanceof Error ? error.message : "Unknown logging error",
    });
    return null;
  }
}

export async function markBillingEventProcessed(
  id: string,
  message?: string,
  metadata?: Record<string, unknown>,
) {
  return prisma.billingEvent.update({
    where: { id },
    data: {
      status: "PROCESSED",
      message: safeString(message),
      metadata: metadata ? sanitizeMetadata(metadata) : undefined,
      processedAt: new Date(),
    },
  });
}

export async function markBillingEventFailed(id: string, message?: string) {
  return prisma.billingEvent.update({
    where: { id },
    data: {
      status: "FAILED",
      message: safeString(message),
      processedAt: new Date(),
    },
  });
}

export async function findBillingEventByStripeEventId(eventId: string) {
  return prisma.billingEvent.findUnique({
    where: { eventId },
  });
}

export async function getBillingEventsForAdmin(filters?: {
  status?: string;
  eventType?: string;
}) {
  await requireSuperAdmin();

  return prisma.billingEvent.findMany({
    where: {
      status: filters?.status || undefined,
      eventType: filters?.eventType || undefined,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getBillingHealthForAdmin() {
  await requireSuperAdmin();
  const [failedBillingEventsCount, recentSuccessfulWebhookEventsCount, syncedPlansCount] =
    await Promise.all([
      prisma.billingEvent.count({ where: { status: "FAILED" } }),
      prisma.billingEvent.count({
        where: {
          provider: "stripe",
          status: "PROCESSED",
          eventId: { not: null },
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.subscriptionPlan.count({
        where: {
          stripeSyncStatus: "synced",
        },
      }),
    ]);

  return {
    stripeSecretConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
    stripeWebhookSecretConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    webhookEndpointPath: "/api/stripe/webhook",
    failedBillingEventsCount,
    recentSuccessfulWebhookEventsCount,
    syncedPlansCount,
  };
}
