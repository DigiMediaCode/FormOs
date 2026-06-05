"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_USERS_PATH = "/admin/users";

function redirectWith(type: "success" | "error", message: string): never {
  redirect(`${ADMIN_USERS_PATH}?${type}=${encodeURIComponent(message)}`);
}

function isActiveStripeStatus(status: string | null | undefined) {
  return ["ACTIVE", "TRIALING", "PAST_DUE", "INCOMPLETE"].includes(
    status?.toUpperCase() ?? "",
  );
}

async function assertNotSelfOrLastSuperAdmin(targetUserId: string) {
  const admin = await requireSuperAdmin();

  if (admin.id === targetUserId) {
    throw new Error("You cannot manage your own admin account with this action.");
  }

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { role: true },
  });

  if (!target) {
    throw new Error("User not found.");
  }

  if (target.role === UserRole.SUPER_ADMIN) {
    const superAdminCount = await prisma.user.count({
      where: { role: UserRole.SUPER_ADMIN },
    });

    if (superAdminCount <= 1) {
      throw new Error("You cannot suspend or delete the last Super Admin.");
    }
  }
}

export async function suspendUserAction(userId: string, formData: FormData) {
  try {
    await assertNotSelfOrLastSuperAdmin(userId);
    const reason = String(formData.get("suspendedReason") ?? "").trim();

    await prisma.user.update({
      where: { id: userId },
      data: {
        suspendedAt: new Date(),
        suspendedReason: reason || null,
      },
    });
  } catch (error) {
    redirectWith(
      "error",
      error instanceof Error ? error.message : "Unable to suspend user.",
    );
  }

  revalidatePath(ADMIN_USERS_PATH);
  revalidatePath(`/admin/users/${userId}`);
  redirectWith("success", "User suspended.");
}

export async function reactivateUserAction(userId: string) {
  try {
    await requireSuperAdmin();

    await prisma.user.update({
      where: { id: userId },
      data: {
        suspendedAt: null,
        suspendedReason: null,
      },
    });
  } catch (error) {
    redirectWith(
      "error",
      error instanceof Error ? error.message : "Unable to reactivate user.",
    );
  }

  revalidatePath(ADMIN_USERS_PATH);
  revalidatePath(`/admin/users/${userId}`);
  redirectWith("success", "User reactivated.");
}

export async function deleteUserAction(userId: string) {
  try {
    await assertNotSelfOrLastSuperAdmin(userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        subscription: {
          select: {
            billingProvider: true,
            status: true,
            stripeSubscriptionId: true,
          },
        },
        _count: {
          select: {
            forms: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error("User not found.");
    }

    if (
      user.subscription?.billingProvider === "stripe" &&
      user.subscription.stripeSubscriptionId &&
      isActiveStripeStatus(user.subscription.status)
    ) {
      throw new Error("This user has active billing. Cancel the subscription before deletion.");
    }

    if (user._count.forms > 0) {
      throw new Error("This user has important linked data. Suspend the account instead.");
    }

    await prisma.user.delete({
      where: { id: userId },
    });
  } catch (error) {
    redirectWith(
      "error",
      error instanceof Error ? error.message : "Unable to delete user.",
    );
  }

  revalidatePath(ADMIN_USERS_PATH);
  redirectWith("success", "User deleted.");
}
