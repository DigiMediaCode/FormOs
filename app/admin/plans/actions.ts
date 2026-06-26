"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { syncPlanToStripe } from "@/lib/billing/stripe";
import { isSupportedFieldType } from "@/lib/forms/fields";
import {
  normalizePlanLimits,
  seedDefaultPlansIfMissing,
  type PlanLimits,
} from "@/lib/plans/limits";
import { prisma } from "@/lib/prisma";

const ADMIN_PLANS_PATH = "/admin/plans";
const ADMIN_NEW_PLAN_PATH = "/admin/plans/new";

function safeRedirectPath(value: unknown) {
  if (typeof value !== "string") {
    return ADMIN_PLANS_PATH;
  }

  if (value === ADMIN_PLANS_PATH || value === ADMIN_NEW_PLAN_PATH) {
    return value;
  }

  if (/^\/admin\/plans\/[a-zA-Z0-9_-]+$/.test(value)) {
    return value;
  }

  return ADMIN_PLANS_PATH;
}

function redirectWith(
  messageType: "error" | "success",
  message: string,
  path = ADMIN_PLANS_PATH,
): never {
  redirect(`${safeRedirectPath(path)}?${messageType}=${encodeURIComponent(message)}`);
}

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function readDecimal(formData: FormData, key: string) {
  const value = readString(formData, key);

  if (!value) {
    return null;
  }

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    throw new Error(`${key} must be a valid positive number.`);
  }

  return new Prisma.Decimal(value);
}

function readInt(formData: FormData, key: string) {
  const value = Number(readString(formData, key) || "0");

  if (!Number.isInteger(value)) {
    throw new Error(`${key} must be a whole number.`);
  }

  return value;
}

function readNumericLimit(formData: FormData, key: keyof PlanLimits) {
  if (formData.get(`${key}Unlimited`) === "on") {
    return null;
  }

  const value = Number(readString(formData, key));

  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${key} must be a valid number or unlimited.`);
  }

  return Math.floor(value);
}

function readLimits(formData: FormData): PlanLimits {
  const allowedFieldTypes = readBoolean(formData, "allowAllFieldTypes")
    ? null
    : formData
        .getAll("allowedFieldTypes")
        .map((value) => String(value))
        .filter(isSupportedFieldType);

  if (allowedFieldTypes !== null && allowedFieldTypes.length === 0) {
    throw new Error("Choose at least one allowed field type, or allow all field types.");
  }

  return normalizePlanLimits({
    maxForms: readNumericLimit(formData, "maxForms"),
    maxMonthlySubmissions: readNumericLimit(formData, "maxMonthlySubmissions"),
    maxTeamMembers: readNumericLimit(formData, "maxTeamMembers"),
    maxConditionalRules: readNumericLimit(formData, "maxConditionalRules"),
    maxClients: readNumericLimit(formData, "maxClients"),
    maxDocumentsPerMonth: readNumericLimit(formData, "maxDocumentsPerMonth"),
    allowGoogleDrive: readBoolean(formData, "allowGoogleDrive"),
    allowDropbox: readBoolean(formData, "allowDropbox"),
    allowPdfGeneration: readBoolean(formData, "allowPdfGeneration"),
    allowOfficeUseFields: readBoolean(formData, "allowOfficeUseFields"),
    allowTemplates: readBoolean(formData, "allowTemplates"),
    allowQrCode: readBoolean(formData, "allowQrCode"),
    allowCustomBranding: readBoolean(formData, "allowCustomBranding"),
    allowTeamMembers: readBoolean(formData, "allowTeamMembers"),
    allowAdFreeForms: readBoolean(formData, "allowAdFreeForms"),
    allowEmbeds: readBoolean(formData, "allowEmbeds"),
    allowApiAccess: readBoolean(formData, "allowApiAccess"),
    allowConditionalLogic: readBoolean(formData, "allowConditionalLogic"),
    allowBasicAnalytics: readBoolean(formData, "allowBasicAnalytics"),
    allowCustomSubmissionNotifications: readBoolean(
      formData,
      "allowCustomSubmissionNotifications",
    ),
    allowClients: readBoolean(formData, "allowClients"),
    allowConvertSubmissionToClient: readBoolean(
      formData,
      "allowConvertSubmissionToClient",
    ),
    allowContracts: readBoolean(formData, "allowContracts"),
    allowAgreements: readBoolean(formData, "allowAgreements"),
    allowDocumentTemplates: readBoolean(formData, "allowDocumentTemplates"),
    allowedFieldTypes,
  });
}

function readPlanData(formData: FormData) {
  const name = readString(formData, "name");
  const slug = readString(formData, "slug")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!name) {
    throw new Error("Plan name is required.");
  }

  if (!slug) {
    throw new Error("Plan slug is required.");
  }

  return {
    name,
    slug,
    description: readString(formData, "description") || null,
    priceMonthly: readDecimal(formData, "priceMonthly"),
    priceYearly: readDecimal(formData, "priceYearly"),
    currency: readString(formData, "currency") || "USD",
    isActive: readBoolean(formData, "isActive"),
    isPublic: readBoolean(formData, "isPublic"),
    sortOrder: readInt(formData, "sortOrder"),
    limits: readLimits(formData) as unknown as Prisma.InputJsonValue,
  };
}

export async function syncPlanToStripeAction(
  planId: string,
  redirectPath: string | FormData = ADMIN_PLANS_PATH,
) {
  await requireSuperAdmin();
  const destination = safeRedirectPath(redirectPath);

  try {
    await syncPlanToStripe(planId);
  } catch (error) {
    revalidatePath(ADMIN_PLANS_PATH);
    redirectWith(
      "error",
      error instanceof Error ? error.message : "Unable to sync plan to Stripe.",
      destination,
    );
  }

  revalidatePath(ADMIN_PLANS_PATH);
  revalidatePath(`/admin/plans/${planId}`);
  redirectWith("success", "Plan synced to Stripe.", destination);
}

export async function seedDefaultPlansAction() {
  await requireSuperAdmin();
  await seedDefaultPlansIfMissing();
  revalidatePath(ADMIN_PLANS_PATH);
  redirectWith("success", "Default plans are ready.");
}

export async function createPlanAction(formData: FormData) {
  await requireSuperAdmin();
  let planId = "";

  try {
    const plan = await prisma.subscriptionPlan.create({
      data: readPlanData(formData),
      select: {
        id: true,
      },
    });
    planId = plan.id;
  } catch (error) {
    redirectWith(
      "error",
      error instanceof Error ? error.message : "Unable to create plan.",
      ADMIN_NEW_PLAN_PATH,
    );
  }

  revalidatePath(ADMIN_PLANS_PATH);
  redirectWith("success", "Plan created.", `/admin/plans/${planId}`);
}

export async function updatePlanAction(planId: string, formData: FormData) {
  await requireSuperAdmin();
  const redirectPath = safeRedirectPath(
    readString(formData, "redirectTo") || `/admin/plans/${planId}`,
  );

  try {
    await prisma.subscriptionPlan.update({
      where: { id: planId },
      data: readPlanData(formData),
    });
  } catch (error) {
    redirectWith(
      "error",
      error instanceof Error ? error.message : "Unable to update plan.",
      redirectPath,
    );
  }

  revalidatePath(ADMIN_PLANS_PATH);
  revalidatePath(`/admin/plans/${planId}`);
  redirectWith("success", "Plan updated.", redirectPath);
}

export async function toggleSubscriptionPlanStatus(
  planId: string,
  redirectPath: string | FormData = ADMIN_PLANS_PATH,
) {
  await requireSuperAdmin();
  const destination = safeRedirectPath(redirectPath);

  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
    select: {
      id: true,
      isActive: true,
      name: true,
    },
  });

  if (!plan) {
    redirectWith("error", "Plan not found.", destination);
  }

  const nextIsActive = !plan.isActive;

  await prisma.subscriptionPlan.update({
    where: { id: plan.id },
    data: {
      isActive: nextIsActive,
    },
  });

  revalidatePath(ADMIN_PLANS_PATH);
  revalidatePath(`/admin/plans/${plan.id}`);
  redirectWith(
    "success",
    `${plan.name} ${nextIsActive ? "activated" : "deactivated"}.`,
    destination,
  );
}

export async function deleteSubscriptionPlan(
  planId: string,
  redirectPath: string | FormData = ADMIN_PLANS_PATH,
) {
  await requireSuperAdmin();
  const destination = safeRedirectPath(redirectPath);

  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          subscriptions: true,
        },
      },
    },
  });

  if (!plan) {
    redirectWith("error", "Plan not found.", destination);
  }

  if (plan._count.subscriptions > 0) {
    redirectWith(
      "error",
      "This plan is assigned to users and cannot be deleted. Deactivate it instead.",
      destination,
    );
  }

  await prisma.subscriptionPlan.delete({
    where: { id: plan.id },
  });

  revalidatePath(ADMIN_PLANS_PATH);
  redirectWith("success", `${plan.name} deleted.`);
}
