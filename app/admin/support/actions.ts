"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/admin/auth";
import {
  isAllowedSupportPriority,
  isAllowedSupportStatus,
  sanitizeSupportText,
  sendSupportReplyEmail,
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

export async function replyToSupportRequestAction(
  requestId: string,
  formData: FormData,
) {
  const admin = await requireSuperAdmin();
  const status = String(formData.get("status") ?? "").toUpperCase();
  const priority = String(formData.get("priority") ?? "").toUpperCase();
  const message = sanitizeSupportText(String(formData.get("replyMessage") ?? ""), 5000);

  if (!message || message.length < 2) {
    redirect(`/admin/support/${requestId}?error=${encodeURIComponent("Reply message is required.")}`);
  }

  if (!isAllowedSupportStatus(status)) {
    redirect(`/admin/support/${requestId}?error=${encodeURIComponent("Invalid status.")}`);
  }

  if (!isAllowedSupportPriority(priority)) {
    redirect(`/admin/support/${requestId}?error=${encodeURIComponent("Invalid priority.")}`);
  }

  const request = await prisma.supportRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      name: true,
      email: true,
      subject: true,
      resolvedAt: true,
    },
  });

  if (!request) {
    redirect(`/admin/support?error=${encodeURIComponent("Support request not found.")}`);
  }

  const shouldResolve = ["RESOLVED", "CLOSED"].includes(status);

  const supportMessage = await prisma.supportRequestMessage.create({
    data: {
      requestId,
      authorType: "ADMIN",
      authorUserId: admin.id,
      authorName: admin.name || admin.email,
      authorEmail: admin.email,
      visibility: "PUBLIC",
      message,
      emailStatus: "PENDING",
    },
  });

  await prisma.supportRequest.update({
    where: { id: requestId },
    data: {
      status,
      priority,
      resolvedAt: shouldResolve ? request.resolvedAt ?? new Date() : null,
    },
  });

  let emailOk = false;
  let emailReason = "";

  try {
    const result = await sendSupportReplyEmail({
      requestId,
      recipientEmail: request.email,
      recipientName: request.name,
      subject: request.subject,
      message,
      status,
    });

    emailOk = result.ok;
    emailReason = result.reason || "";
  } catch (error) {
    emailReason =
      error instanceof Error ? error.message : "Unable to send support reply email.";
  }

  await prisma.supportRequestMessage.update({
    where: { id: supportMessage.id },
    data: {
      emailStatus: emailOk ? "SENT" : `FAILED${emailReason ? `: ${emailReason.slice(0, 180)}` : ""}`,
      emailSentAt: emailOk ? new Date() : null,
    },
  });

  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${requestId}`);

  if (!emailOk) {
    redirect(
      `/admin/support/${requestId}?error=${encodeURIComponent(
        "Reply was saved, but the email could not be sent. Check Lark email settings.",
      )}`,
    );
  }

  redirect(
    `/admin/support/${requestId}?success=${encodeURIComponent("Reply sent to customer.")}`,
  );
}
