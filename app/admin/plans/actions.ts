"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/admin/auth";
import {
  normalizePlanLimits,
  seedDefaultPlansIfMissing,
  type PlanLimits,
} from "@/lib/plans/limits";
import { prisma } from "@/lib/prisma";

const ADMIN_PLANS_PATH = "/admin/plans";

function redirectWith(messageType: "error" | "success", message: string): never {
  redirect(`${ADMIN_PLANS_PATH}?${messageType}=${encodeURIComponent(message)}`);
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
  return normalizePlanLimits({
    maxForms: readNumericLimit(formData, "maxForms"),
    maxMonthlySubmissions: readNumericLimit(formData, "maxMonthlySubmissions"),
    allowGoogleDrive: readBoolean(formData, "allowGoogleDrive"),
    allowDropbox: readBoolean(formData, "allowDropbox"),
    allowPdfGeneration: readBoolean(formData, "allowPdfGeneration"),
    allowOfficeUseFields: readBoolean(formData, "allowOfficeUseFields"),
    allowTemplates: readBoolean(formData, "allowTemplates"),
    allowQrCode: readBoolean(formData, "allowQrCode"),
    allowCustomBranding: readBoolean(formData, "allowCustomBranding"),
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

export async function seedDefaultPlansAction() {
  await requireSuperAdmin();
  await seedDefaultPlansIfMissing();
  revalidatePath(ADMIN_PLANS_PATH);
  redirectWith("success", "Default plans are ready.");
}

export async function createPlanAction(formData: FormData) {
  await requireSuperAdmin();

  try {
    await prisma.subscriptionPlan.create({
      data: readPlanData(formData),
    });
  } catch (error) {
    redirectWith(
      "error",
      error instanceof Error ? error.message : "Unable to create plan.",
    );
  }

  revalidatePath(ADMIN_PLANS_PATH);
  redirectWith("success", "Plan created.");
}

export async function updatePlanAction(planId: string, formData: FormData) {
  await requireSuperAdmin();

  try {
    await prisma.subscriptionPlan.update({
      where: { id: planId },
      data: readPlanData(formData),
    });
  } catch (error) {
    redirectWith(
      "error",
      error instanceof Error ? error.message : "Unable to update plan.",
    );
  }

  revalidatePath(ADMIN_PLANS_PATH);
  redirectWith("success", "Plan updated.");
}
