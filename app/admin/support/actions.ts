"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/admin/auth";
import {
  isAllowedSupportPriority,
  isAllowedSupportStatus,
  sanitizeSupportText,
} from "@/lib/support/requests";
import { prisma } from "@/lib/prisma";

export async function updateSupportRequestAction(
  requestId: string,
  formData: FormData,
) {
  await requireSuperAdmin();

  const status = String(formData.get("status") ?? "").toUpperCase();
  const priority = String(formData.get("priority") ?? "").toUpperCase();
  const adminNotes = sanitizeSupportText(
    String(formData.get("adminNotes") ?? ""),
    5000,
  );

  if (!isAllowedSupportStatus(status)) {
    redirect(`/admin/support/${requestId}?error=${encodeURIComponent("Invalid status.")}`);
  }

  if (!isAllowedSupportPriority(priority)) {
    redirect(`/admin/support/${requestId}?error=${encodeURIComponent("Invalid priority.")}`);
  }

  const existing = await prisma.supportRequest.findUnique({
    where: { id: requestId },
    select: {
      resolvedAt: true,
    },
  });

  if (!existing) {
    redirect(`/admin/support?error=${encodeURIComponent("Support request not found.")}`);
  }

  const shouldResolve = ["RESOLVED", "CLOSED"].includes(status);

  await prisma.supportRequest.update({
    where: { id: requestId },
    data: {
      status,
      priority,
      adminNotes: adminNotes || null,
      resolvedAt: shouldResolve ? existing.resolvedAt ?? new Date() : null,
    },
  });

  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${requestId}`);
  redirect(`/admin/support/${requestId}?success=${encodeURIComponent("Support request updated.")}`);
}
