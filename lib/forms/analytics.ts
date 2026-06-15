import "server-only";

import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

export const ANALYTICS_EVENT_TYPES = {
  SUBMIT: "SUBMIT",
  VIEW: "VIEW",
} as const;

export const ANALYTICS_SOURCES = {
  EMBED: "EMBED",
  PUBLIC: "PUBLIC",
  SHOPIFY: "SHOPIFY",
  UNKNOWN: "UNKNOWN",
  WORDPRESS: "WORDPRESS",
} as const;

type AnalyticsEventType =
  (typeof ANALYTICS_EVENT_TYPES)[keyof typeof ANALYTICS_EVENT_TYPES];

type AnalyticsSource =
  (typeof ANALYTICS_SOURCES)[keyof typeof ANALYTICS_SOURCES];

type HeaderLike = Pick<Headers, "get">;

type AnalyticsRequestContext = {
  headers?: HeaderLike;
  referrer?: string | null;
  sessionId?: string | null;
  source?: string | null;
  userAgent?: string | null;
};

function cleanString(value: string | null | undefined, maxLength: number) {
  const normalized = value?.trim();

  if (!normalized) {
    return null;
  }

  return normalized.slice(0, maxLength);
}

function getIpAddress(headerStore?: HeaderLike) {
  const forwardedFor = headerStore?.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }

  return headerStore?.get("x-real-ip");
}

function hashIpAddress(ipAddress: string | null | undefined) {
  const normalized = ipAddress?.trim();

  if (!normalized || normalized === "unknown") {
    return null;
  }

  return createHash("sha256").update(normalized).digest("hex");
}

function sourceFromReferrer(referrer: string | null | undefined) {
  if (!referrer) {
    return null;
  }

  try {
    const hostname = new URL(referrer).hostname.toLowerCase();

    if (hostname.includes("myshopify.com") || hostname.includes("shopify")) {
      return ANALYTICS_SOURCES.SHOPIFY;
    }

    if (hostname.includes("wordpress") || hostname.includes("wp")) {
      return ANALYTICS_SOURCES.WORDPRESS;
    }
  } catch {
    return null;
  }

  return null;
}

export function normalizeAnalyticsSource(
  source: string | null | undefined,
  referrer?: string | null,
): AnalyticsSource {
  const normalized = source?.trim().toUpperCase();

  if (normalized === "PUBLIC" || normalized === "PUBLIC_FORM") {
    return ANALYTICS_SOURCES.PUBLIC;
  }

  if (normalized === "WORDPRESS") {
    return ANALYTICS_SOURCES.WORDPRESS;
  }

  if (normalized === "SHOPIFY") {
    return ANALYTICS_SOURCES.SHOPIFY;
  }

  if (normalized === "EMBED") {
    return sourceFromReferrer(referrer) ?? ANALYTICS_SOURCES.EMBED;
  }

  return sourceFromReferrer(referrer) ?? ANALYTICS_SOURCES.UNKNOWN;
}

async function createAnalyticsEvent(input: {
  formId: string;
  ownerId: string;
  type: AnalyticsEventType;
  context?: AnalyticsRequestContext;
}) {
  const headerStore = input.context?.headers;
  const referrer =
    input.context?.referrer ?? headerStore?.get("referer") ?? headerStore?.get("referrer");
  const userAgent = input.context?.userAgent ?? headerStore?.get("user-agent");
  const ipHash = hashIpAddress(getIpAddress(headerStore));
  const source = normalizeAnalyticsSource(input.context?.source, referrer);

  try {
    await prisma.formAnalyticsEvent.create({
      data: {
        formId: input.formId,
        ownerId: input.ownerId,
        type: input.type,
        source,
        referrer: cleanString(referrer, 500),
        userAgent: cleanString(userAgent, 500),
        ipHash,
        sessionId: cleanString(input.context?.sessionId, 120),
      },
    });
  } catch (error) {
    console.warn("[formos:analytics] Could not record analytics event.", {
      formId: input.formId,
      type: input.type,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function recordFormView(input: {
  formId: string;
  ownerId: string;
  context?: AnalyticsRequestContext;
}) {
  await createAnalyticsEvent({
    ...input,
    type: ANALYTICS_EVENT_TYPES.VIEW,
  });
}

export async function recordFormSubmit(input: {
  formId: string;
  ownerId: string;
  context?: AnalyticsRequestContext;
}) {
  await createAnalyticsEvent({
    ...input,
    type: ANALYTICS_EVENT_TYPES.SUBMIT,
  });
}

export function formatCompletionRate(submissions: number, views: number) {
  if (views <= 0) {
    return "0%";
  }

  return `${Math.round((submissions / views) * 100)}%`;
}

export async function getOwnerAnalyticsSummary(ownerId: string, days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const [views, submissions, forms] = await Promise.all([
    prisma.formAnalyticsEvent.count({
      where: {
        ownerId,
        type: ANALYTICS_EVENT_TYPES.VIEW,
        createdAt: { gte: since },
      },
    }),
    prisma.formSubmission.count({
      where: {
        ownerId,
        createdAt: { gte: since },
      },
    }),
    prisma.form.findMany({
      where: { ownerId },
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            submissions: {
              where: {
                createdAt: { gte: since },
              },
            },
          },
        },
      },
    }),
  ]);
  const topForm = forms
    .sort((a, b) => b._count.submissions - a._count.submissions)
    .find((form) => form._count.submissions > 0);

  return {
    averageCompletionRate: formatCompletionRate(submissions, views),
    submissions,
    topForm: topForm
      ? {
          id: topForm.id,
          submissions: topForm._count.submissions,
          title: topForm.title,
        }
      : null,
    views,
  };
}

export async function getFormAnalyticsSummary(formId: string, ownerId: string, days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const [views, submissions, sourceRows] = await Promise.all([
    prisma.formAnalyticsEvent.count({
      where: {
        formId,
        ownerId,
        type: ANALYTICS_EVENT_TYPES.VIEW,
        createdAt: { gte: since },
      },
    }),
    prisma.formSubmission.count({
      where: {
        formId,
        ownerId,
        createdAt: { gte: since },
      },
    }),
    prisma.formAnalyticsEvent.groupBy({
      by: ["source"],
      _count: {
        _all: true,
      },
      where: {
        formId,
        ownerId,
        createdAt: { gte: since },
      },
    }),
  ]);

  return {
    completionRate: formatCompletionRate(submissions, views),
    sourceBreakdown: sourceRows
      .map((row) => ({
        count: row._count._all,
        source: row.source ?? ANALYTICS_SOURCES.UNKNOWN,
      }))
      .sort((a, b) => b.count - a.count),
    submissions,
    views,
  };
}
