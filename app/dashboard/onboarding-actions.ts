"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceOwner } from "@/lib/workspaces/access";

const DASHBOARD_PATH = "/dashboard";

export async function hideOnboardingChecklist() {
  const context = await requireWorkspaceOwner();

  await prisma.userOnboardingState.upsert({
    where: { userId: context.ownerId },
    create: {
      userId: context.ownerId,
      dismissedAt: new Date(),
    },
    update: {
      dismissedAt: new Date(),
    },
  });

  revalidatePath(DASHBOARD_PATH);
  redirect(`${DASHBOARD_PATH}?success=${encodeURIComponent("Setup checklist hidden.")}`);
}

export async function showOnboardingChecklist() {
  const context = await requireWorkspaceOwner();

  await prisma.userOnboardingState.upsert({
    where: { userId: context.ownerId },
    create: {
      userId: context.ownerId,
      dismissedAt: null,
    },
    update: {
      dismissedAt: null,
    },
  });

  revalidatePath(DASHBOARD_PATH);
  redirect(`${DASHBOARD_PATH}?success=${encodeURIComponent("Setup checklist shown.")}`);
}
