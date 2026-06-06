"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitKey } from "@/lib/security/rate-limit";
import {
  isAllowedSupportCategory,
  sanitizeSupportText,
  sendSupportRequestNotification,
  validateSupportEmail,
} from "@/lib/support/requests";

function contactRedirect(type: "success" | "error", message: string): never {
  redirect(`/contact?${type}=${encodeURIComponent(message)}`);
}

function requestIp(headersList: Headers) {
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return headersList.get("x-real-ip") || "unknown";
}

export async function createSupportRequestAction(formData: FormData) {
  const [user, headersList] = await Promise.all([getCurrentUser(), headers()]);
  const name = sanitizeSupportText(String(formData.get("name") ?? ""), 160);
  const email = sanitizeSupportText(String(formData.get("email") ?? ""), 254).toLowerCase();
  const subject = sanitizeSupportText(String(formData.get("subject") ?? ""), 200);
  const message = sanitizeSupportText(String(formData.get("message") ?? ""), 5000);
  const category = sanitizeSupportText(String(formData.get("category") ?? ""), 80);

  const rateLimit = checkRateLimit({
    key: rateLimitKey("support-contact", `${requestIp(headersList)}:${email}`),
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    contactRedirect(
      "error",
      `Please wait ${rateLimit.retryAfterSeconds} seconds before sending another request.`,
    );
  }

  if (!email || !validateSupportEmail(email)) {
    contactRedirect("error", "Please enter a valid email address.");
  }

  if (!subject) {
    contactRedirect("error", "Subject is required.");
  }

  if (!message || message.length < 10) {
    contactRedirect("error", "Message must be at least 10 characters.");
  }

  if (message.length > 5000) {
    contactRedirect("error", "Message must be 5000 characters or less.");
  }

  if (!isAllowedSupportCategory(category)) {
    contactRedirect("error", "Please select a valid support category.");
  }

  const supportRequest = await prisma.supportRequest.create({
    data: {
      userId: user?.id,
      name: name || null,
      email,
      subject,
      message,
      category,
    },
    select: {
      id: true,
      name: true,
      email: true,
      category: true,
      subject: true,
      message: true,
    },
  });

  try {
    await sendSupportRequestNotification(supportRequest);
  } catch (error) {
    console.warn("[formos:support] Support notification failed safely.", {
      requestId: supportRequest.id,
      error: error instanceof Error ? error.message : "Unknown notification error",
    });
  }

  contactRedirect("success", "Thanks for contacting us. We'll get back to you soon.");
}
