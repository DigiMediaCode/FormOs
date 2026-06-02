import "server-only";

import { Prisma, StorageProvider } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type NumericLimit = number | null;

export type PlanLimits = {
  maxForms: NumericLimit;
  maxMonthlySubmissions: NumericLimit;
  allowGoogleDrive: boolean;
  allowDropbox: boolean;
  allowPdfGeneration: boolean;
  allowOfficeUseFields: boolean;
  allowTemplates: boolean;
  allowQrCode: boolean;
  allowCustomBranding: boolean;
};

export type UserUsage = {
  formsUsed: number;
  monthlySubmissionsUsed: number;
};

export type UserPlanSummary = {
  id: string | null;
  name: string;
  slug: string;
  isAssigned: boolean;
};

export type UserPlanAccess = {
  plan: UserPlanSummary;
  limits: PlanLimits;
  usage: UserUsage;
  hasCustomQuota: boolean;
  isUnlimitedEverything: boolean;
};

const NUMERIC_LIMIT_KEYS = ["maxForms", "maxMonthlySubmissions"] as const;
const BOOLEAN_LIMIT_KEYS = [
  "allowGoogleDrive",
  "allowDropbox",
  "allowPdfGeneration",
  "allowOfficeUseFields",
  "allowTemplates",
  "allowQrCode",
  "allowCustomBranding",
] as const;

export const UNLIMITED_EVERYTHING_LIMITS: PlanLimits = {
  maxForms: null,
  maxMonthlySubmissions: null,
  allowGoogleDrive: true,
  allowDropbox: true,
  allowPdfGeneration: true,
  allowOfficeUseFields: true,
  allowTemplates: true,
  allowQrCode: true,
  allowCustomBranding: true,
};

export function getDefaultFreeLimits(): PlanLimits {
  return {
    maxForms: 1,
    maxMonthlySubmissions: 25,
    allowGoogleDrive: false,
    allowDropbox: false,
    allowPdfGeneration: false,
    allowOfficeUseFields: false,
    allowTemplates: false,
    allowQrCode: true,
    allowCustomBranding: false,
  };
}

export const DEFAULT_PLAN_DEFINITIONS = [
  {
    name: "Free",
    slug: "free",
    description: "A simple starter plan for trying FormOS.",
    priceMonthly: "0",
    priceYearly: "0",
    currency: "USD",
    isPublic: true,
    isActive: true,
    sortOrder: 0,
    limits: getDefaultFreeLimits(),
  },
  {
    name: "Starter",
    slug: "starter",
    description: "For small workflows that need templates and PDF delivery.",
    priceMonthly: "19",
    priceYearly: "190",
    currency: "USD",
    isPublic: true,
    isActive: true,
    sortOrder: 10,
    limits: {
      maxForms: 5,
      maxMonthlySubmissions: 100,
      allowGoogleDrive: true,
      allowDropbox: false,
      allowPdfGeneration: true,
      allowOfficeUseFields: false,
      allowTemplates: true,
      allowQrCode: true,
      allowCustomBranding: false,
    },
  },
  {
    name: "Pro",
    slug: "pro",
    description: "For teams using storage integrations and office workflows.",
    priceMonthly: "49",
    priceYearly: "490",
    currency: "USD",
    isPublic: true,
    isActive: true,
    sortOrder: 20,
    limits: {
      maxForms: 25,
      maxMonthlySubmissions: 1000,
      allowGoogleDrive: true,
      allowDropbox: true,
      allowPdfGeneration: true,
      allowOfficeUseFields: true,
      allowTemplates: true,
      allowQrCode: true,
      allowCustomBranding: false,
    },
  },
  {
    name: "Business",
    slug: "business",
    description: "For high-volume form and agreement operations.",
    priceMonthly: "99",
    priceYearly: "990",
    currency: "USD",
    isPublic: true,
    isActive: true,
    sortOrder: 30,
    limits: {
      maxForms: null,
      maxMonthlySubmissions: 10000,
      allowGoogleDrive: true,
      allowDropbox: true,
      allowPdfGeneration: true,
      allowOfficeUseFields: true,
      allowTemplates: true,
      allowQrCode: true,
      allowCustomBranding: true,
    },
  },
] satisfies Array<{
  name: string;
  slug: string;
  description: string;
  priceMonthly: string;
  priceYearly: string;
  currency: string;
  isPublic: boolean;
  isActive: boolean;
  sortOrder: number;
  limits: PlanLimits;
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeNumericLimit(value: unknown, fallback: NumericLimit): NumericLimit {
  if (value === null) {
    return null;
  }

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    return fallback;
  }

  return Math.floor(numberValue);
}

export function normalizePlanLimits(value: unknown): PlanLimits {
  const fallback = getDefaultFreeLimits();
  const source = isRecord(value) ? value : {};
  const limits = { ...fallback };

  for (const key of NUMERIC_LIMIT_KEYS) {
    limits[key] = normalizeNumericLimit(source[key], fallback[key]);
  }

  for (const key of BOOLEAN_LIMIT_KEYS) {
    limits[key] = typeof source[key] === "boolean" ? source[key] : fallback[key];
  }

  return limits;
}

export function mergeLimits(
  defaultLimits: PlanLimits,
  planLimits?: unknown,
  overrideLimits?: unknown,
): PlanLimits {
  const merged = {
    ...defaultLimits,
    ...normalizePlanLimits(planLimits ?? defaultLimits),
  };

  if (!isRecord(overrideLimits)) {
    return merged;
  }

  for (const key of NUMERIC_LIMIT_KEYS) {
    if (key in overrideLimits) {
      merged[key] = normalizeNumericLimit(overrideLimits[key], merged[key]);
    }
  }

  for (const key of BOOLEAN_LIMIT_KEYS) {
    if (typeof overrideLimits[key] === "boolean") {
      merged[key] = overrideLimits[key];
    }
  }

  return merged;
}

export async function seedDefaultPlansIfMissing() {
  const planCount = await prisma.subscriptionPlan.count();

  if (planCount > 0) {
    return;
  }

  await prisma.subscriptionPlan.createMany({
    data: DEFAULT_PLAN_DEFINITIONS.map((plan) => ({
      ...plan,
      priceMonthly: new Prisma.Decimal(plan.priceMonthly),
      priceYearly: new Prisma.Decimal(plan.priceYearly),
      limits: plan.limits as unknown as Prisma.InputJsonValue,
    })),
    skipDuplicates: true,
  });
}

export async function getPlanLimits(planId: string | null | undefined) {
  if (!planId) {
    return getDefaultFreeLimits();
  }

  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
    select: { limits: true },
  });

  return normalizePlanLimits(plan?.limits);
}

export async function getUserPlan(userId: string): Promise<UserPlanSummary> {
  const subscription = await prisma.userSubscription.findUnique({
    where: { userId },
    select: {
      plan: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  if (!subscription?.plan) {
    return {
      id: null,
      name: "Free",
      slug: "free",
      isAssigned: false,
    };
  }

  return {
    ...subscription.plan,
    isAssigned: true,
  };
}

export async function getUserEffectiveLimits(userId: string) {
  const [subscription, override] = await Promise.all([
    prisma.userSubscription.findUnique({
      where: { userId },
      select: {
        plan: {
          select: {
            limits: true,
          },
        },
      },
    }),
    prisma.userQuotaOverride.findUnique({
      where: { userId },
      select: {
        limits: true,
      },
    }),
  ]);

  return mergeLimits(
    getDefaultFreeLimits(),
    subscription?.plan?.limits,
    override?.limits,
  );
}

function monthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);

  return { start, end };
}

export async function getUserUsage(userId: string): Promise<UserUsage> {
  const { start, end } = monthRange();
  const [formsUsed, monthlySubmissionsUsed] = await Promise.all([
    prisma.form.count({
      where: { ownerId: userId },
    }),
    prisma.formSubmission.count({
      where: {
        ownerId: userId,
        createdAt: {
          gte: start,
          lt: end,
        },
      },
    }),
  ]);

  return {
    formsUsed,
    monthlySubmissionsUsed,
  };
}

export async function getUserPlanAccess(userId: string): Promise<UserPlanAccess> {
  const [plan, limits, usage, override] = await Promise.all([
    getUserPlan(userId),
    getUserEffectiveLimits(userId),
    getUserUsage(userId),
    prisma.userQuotaOverride.findUnique({
      where: { userId },
      select: { limits: true },
    }),
  ]);

  return {
    plan,
    limits,
    usage,
    hasCustomQuota: Boolean(override),
    isUnlimitedEverything: override
      ? JSON.stringify(normalizePlanLimits(override.limits)) ===
        JSON.stringify(UNLIMITED_EVERYTHING_LIMITS)
      : false,
  };
}

function formatLimit(limit: NumericLimit) {
  return limit === null ? "unlimited" : String(limit);
}

export async function assertCanCreateForm(userId: string) {
  const [limits, usage] = await Promise.all([
    getUserEffectiveLimits(userId),
    getUserUsage(userId),
  ]);

  if (limits.maxForms !== null && usage.formsUsed >= limits.maxForms) {
    throw new Error(
      `Your current plan allows up to ${formatLimit(limits.maxForms)} forms. Upgrade your plan to create more forms.`,
    );
  }
}

export async function assertCanReceiveSubmission(ownerId: string) {
  const [limits, usage] = await Promise.all([
    getUserEffectiveLimits(ownerId),
    getUserUsage(ownerId),
  ]);

  if (
    limits.maxMonthlySubmissions !== null &&
    usage.monthlySubmissionsUsed >= limits.maxMonthlySubmissions
  ) {
    throw new Error(
      "This form is temporarily unavailable because the owner has reached their monthly submission limit.",
    );
  }
}

export async function assertCanUseStorageProvider(
  userId: string,
  provider: StorageProvider,
) {
  const limits = await getUserEffectiveLimits(userId);

  if (provider === StorageProvider.GOOGLE_DRIVE && !limits.allowGoogleDrive) {
    throw new Error("Your current plan does not include Google Drive uploads.");
  }

  if (provider === StorageProvider.DROPBOX && !limits.allowDropbox) {
    throw new Error("Your current plan does not include Dropbox uploads.");
  }
}

export async function assertCanUseOfficeFields(userId: string) {
  const limits = await getUserEffectiveLimits(userId);

  if (!limits.allowOfficeUseFields) {
    throw new Error("Office Use Only fields are not included in your current plan.");
  }
}

export async function assertCanGeneratePdf(userId: string) {
  const limits = await getUserEffectiveLimits(userId);

  if (!limits.allowPdfGeneration) {
    throw new Error("Completed PDF generation is not included in your current plan.");
  }
}

export async function assertCanUseTemplate(userId: string) {
  const limits = await getUserEffectiveLimits(userId);

  if (!limits.allowTemplates) {
    throw new Error("Templates are not included in your current plan.");
  }
}

export async function assertCanUseQrCode(userId: string) {
  const limits = await getUserEffectiveLimits(userId);

  if (!limits.allowQrCode) {
    throw new Error("QR codes are not included in your current plan.");
  }
}

export function limitLabel(limit: NumericLimit) {
  return limit === null ? "Unlimited" : String(limit);
}

export function featureLabels(limits: PlanLimits) {
  return [
    { label: "Google Drive", allowed: limits.allowGoogleDrive },
    { label: "Dropbox", allowed: limits.allowDropbox },
    { label: "PDF generation", allowed: limits.allowPdfGeneration },
    { label: "Office fields", allowed: limits.allowOfficeUseFields },
    { label: "Templates", allowed: limits.allowTemplates },
    { label: "QR codes", allowed: limits.allowQrCode },
    { label: "Custom branding", allowed: limits.allowCustomBranding },
  ];
}
