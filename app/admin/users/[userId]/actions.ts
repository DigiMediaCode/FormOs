"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { isSupportedFieldType } from "@/lib/forms/fields";
import {
  normalizePlanLimits,
  UNLIMITED_EVERYTHING_LIMITS,
  type PlanLimits,
} from "@/lib/plans/limits";
import { prisma } from "@/lib/prisma";

function userPath(userId: string) {
  return `/admin/users/${userId}`;
}

function redirectWith(
  userId: string,
  messageType: "error" | "success",
  message: string,
): never {
  redirect(`${userPath(userId)}?${messageType}=${encodeURIComponent(message)}`);
}

function readBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readOverrideNumericLimit(formData: FormData, key: keyof PlanLimits) {
  const mode = readString(formData, `${key}Mode`);

  if (mode === "inherit") {
    return undefined;
  }

  if (mode === "unlimited") {
    return null;
  }

  const value = Number(readString(formData, key));

  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${key} must be a valid number.`);
  }

  return Math.floor(value);
}

function readOverrideBoolean(formData: FormData, key: keyof PlanLimits) {
  const mode = readString(formData, `${key}Mode`);

  if (mode === "inherit") {
    return undefined;
  }

  return mode === "allow";
}

function readQuotaOverride(formData: FormData) {
  if (readBoolean(formData, "unlimitedEverything")) {
    return UNLIMITED_EVERYTHING_LIMITS;
  }

  const limits: Partial<PlanLimits> = {};
  const maxForms = readOverrideNumericLimit(formData, "maxForms");
  const maxMonthlySubmissions = readOverrideNumericLimit(
    formData,
    "maxMonthlySubmissions",
  );
  const maxTeamMembers = readOverrideNumericLimit(formData, "maxTeamMembers");

  if (maxForms !== undefined) {
    limits.maxForms = maxForms;
  }

  if (maxMonthlySubmissions !== undefined) {
    limits.maxMonthlySubmissions = maxMonthlySubmissions;
  }

  if (maxTeamMembers !== undefined) {
    limits.maxTeamMembers = maxTeamMembers;
  }

  for (const key of [
    "allowGoogleDrive",
    "allowDropbox",
    "allowPdfGeneration",
    "allowOfficeUseFields",
    "allowTemplates",
    "allowQrCode",
    "allowCustomBranding",
    "allowTeamMembers",
    "allowAdFreeForms",
    "allowEmbeds",
    "allowApiAccess",
  ] as const) {
    const value = readOverrideBoolean(formData, key);

    if (value !== undefined) {
      limits[key] = value;
    }
  }

  const allowedFieldTypesMode = readString(formData, "allowedFieldTypesMode");

  if (allowedFieldTypesMode === "all") {
    limits.allowedFieldTypes = null;
  } else if (allowedFieldTypesMode === "custom") {
    const allowedFieldTypes = formData
      .getAll("allowedFieldTypes")
      .map((value) => String(value))
      .filter(isSupportedFieldType);

    if (allowedFieldTypes.length === 0) {
      throw new Error("Choose at least one custom field type or use the plan default.");
    }

    limits.allowedFieldTypes = allowedFieldTypes;
  }

  return limits;
}

export async function assignUserPlanAction(userId: string, formData: FormData) {
  const admin = await requireSuperAdmin();
  const planId = readString(formData, "planId");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    notFound();
  }

  try {
    await prisma.userSubscription.upsert({
      where: { userId },
      create: {
        userId,
        planId: planId || null,
        assignedBy: admin.id,
        status: "MANUAL",
        billingProvider: "manual",
      },
      update: {
        planId: planId || null,
        assignedBy: admin.id,
        assignedAt: new Date(),
        status: "MANUAL",
        billingProvider: "manual",
      },
    });
  } catch (error) {
    redirectWith(
      userId,
      "error",
      error instanceof Error ? error.message : "Unable to assign plan.",
    );
  }

  revalidatePath("/admin/users");
  revalidatePath(userPath(userId));
  redirectWith(userId, "success", "User plan updated.");
}

export async function saveUserQuotaOverrideAction(
  userId: string,
  formData: FormData,
) {
  const admin = await requireSuperAdmin();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    notFound();
  }

  try {
    const limits = readQuotaOverride(formData);

    await prisma.userQuotaOverride.upsert({
      where: { userId },
      create: {
        userId,
        limits: limits as unknown as Prisma.InputJsonValue,
        reason: readString(formData, "reason") || null,
        createdBy: admin.id,
      },
      update: {
        limits: limits as unknown as Prisma.InputJsonValue,
        reason: readString(formData, "reason") || null,
        createdBy: admin.id,
      },
    });
  } catch (error) {
    redirectWith(
      userId,
      "error",
      error instanceof Error ? error.message : "Unable to save quota override.",
    );
  }

  revalidatePath("/admin/users");
  revalidatePath(userPath(userId));
  redirectWith(userId, "success", "Quota override saved.");
}

export async function clearUserQuotaOverrideAction(userId: string) {
  await requireSuperAdmin();

  await prisma.userQuotaOverride.deleteMany({
    where: { userId },
  });

  revalidatePath("/admin/users");
  revalidatePath(userPath(userId));
  redirectWith(userId, "success", "Quota override cleared.");
}
