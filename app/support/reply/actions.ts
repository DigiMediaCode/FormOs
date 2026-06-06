"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitKey } from "@/lib/security/rate-limit";
import {
  sanitizeSupportText,
  sendSupportCustomerReplyNotification,
} from "@/lib/support/requests";
import { verifySupportReplyToken } from "@/lib/support/reply-token";

function replyRedirect(
  token: string,
  type: "success" | "error",
  message: string,
): never {
  redirect(
    `/support/reply?token=${encodeURIComponent(token)}&${type}=${encodeURIComponent(message)}`,
  );
}

function requestIp(headersList: Headers) {
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return headersList.get("x-real-ip") || "unknown";
}

export async function createCustomerSupportReplyAction(formData: FormData) {
  const headersList = await headers();
  const token = String(formData.get("token") ?? "");
  const message = sanitizeSupportText(String(formData.get("message") ?? ""), 5000);
  const payload = verifySupportReplyToken(token);

  if (!payload) {
    redirect("/support/reply?error=This support reply link is invalid or expired.");
  }

  const rateLimit = checkRateLimit({
    key: rateLimitKey(
      "support-reply",
      `${requestIp(headersList)}:${payload.requestId}:${payload.email}`,
    ),
    limit: 8,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    replyRedirect(
      token,
      "error",
      `Please wait ${rateLimit.retryAfterSeconds} seconds before sending another reply.`,
    );
  }

  if (!message || message.length < 2) {
    replyRedirect(token, "error", "Reply message is required.");
  }

  const request = await prisma.supportRequest.findFirst({
    where: {
      id: payload.requestId,
      email: payload.email,
    },
    select: {
      id: true,
      name: true,
      email: true,
      subject: true,
      status: true,
    },
  });

  if (!request) {
    redirect("/support/reply?error=This support request could not be found.");
  }

  await prisma.supportRequestMessage.create({
    data: {
      requestId: request.id,
      authorType: "CUSTOMER",
      authorName: request.name,
      authorEmail: request.email,
      visibility: "PUBLIC",
      message,
      emailStatus: null,
    },
  });

  const shouldReopen = request.status === "CLOSED" || request.status === "RESOLVED";

  await prisma.supportRequest.update({
    where: { id: request.id },
    data: {
      status: shouldReopen ? "OPEN" : request.status,
      resolvedAt: shouldReopen ? null : undefined,
    },
  });

  try {
    await sendSupportCustomerReplyNotification({
      requestId: request.id,
      customerName: request.name,
      customerEmail: request.email,
      subject: request.subject,
      message,
    });
  } catch (error) {
    console.warn("[formos:support] Customer reply notification failed safely.", {
      requestId: request.id,
      error: error instanceof Error ? error.message : "Unknown notification error",
    });
  }

  replyRedirect(token, "success", "Your reply has been sent to FormOS support.");
}
