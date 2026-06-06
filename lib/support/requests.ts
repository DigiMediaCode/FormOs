import "server-only";

import { getAppUrl } from "@/lib/app-url";
import { sendEmail } from "@/lib/email/send-email";
import { getPlatformSettings } from "@/lib/platform/settings";

export const SUPPORT_CATEGORIES = [
  "General Question",
  "Billing / Subscription",
  "Technical Issue",
  "File Upload / Storage",
  "Form Builder Help",
  "Account / Login",
  "Other",
] as const;

export const SUPPORT_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
] as const;

export const SUPPORT_PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;

export type SupportStatus = (typeof SUPPORT_STATUSES)[number];
export type SupportPriority = (typeof SUPPORT_PRIORITIES)[number];

export function isAllowedSupportCategory(value: string) {
  return SUPPORT_CATEGORIES.includes(value as (typeof SUPPORT_CATEGORIES)[number]);
}

export function isAllowedSupportStatus(value: string) {
  return SUPPORT_STATUSES.includes(value as SupportStatus);
}

export function isAllowedSupportPriority(value: string) {
  return SUPPORT_PRIORITIES.includes(value as SupportPriority);
}

export function validateSupportEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function sanitizeSupportText(value: string, maxLength = 5000) {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/\s+on[a-z]+\s*=/gi, " ")
    .trim()
    .slice(0, maxLength);
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function getSupportRecipientEmail() {
  const settings = await getPlatformSettings();
  return (
    settings.supportEmail ||
    settings.contactEmail ||
    process.env.SUPPORT_EMAIL ||
    process.env.LARK_SENDER_EMAIL ||
    ""
  );
}

export async function sendSupportRequestNotification(input: {
  id: string;
  name: string | null;
  email: string;
  category: string | null;
  subject: string;
  message: string;
}) {
  const recipient = await getSupportRecipientEmail();

  if (!recipient) {
    return {
      ok: false,
      reason: "No support recipient configured.",
    };
  }

  const appUrl = getAppUrl();
  const adminUrl = `${appUrl}/admin/support/${input.id}`;
  const safeName = input.name || "Not provided";
  const safeCategory = input.category || "General Question";
  const text = [
    `New FormOS support request: ${input.subject}`,
    "",
    `Request ID: ${input.id}`,
    `Name: ${safeName}`,
    `Email: ${input.email}`,
    `Category: ${safeCategory}`,
    `Subject: ${input.subject}`,
    "",
    "Message:",
    input.message,
    "",
    `Admin link: ${adminUrl}`,
  ].join("\n");
  const html = `
    <h2>New FormOS support request</h2>
    <p><strong>Request ID:</strong> ${escapeHtml(input.id)}</p>
    <p><strong>Name:</strong> ${escapeHtml(safeName)}</p>
    <p><strong>Email:</strong> ${escapeHtml(input.email)}</p>
    <p><strong>Category:</strong> ${escapeHtml(safeCategory)}</p>
    <p><strong>Subject:</strong> ${escapeHtml(input.subject)}</p>
    <h3>Message</h3>
    <p>${escapeHtml(input.message).replace(/\n/g, "<br />")}</p>
    <p><a href="${escapeHtml(adminUrl)}">Open support request in FormOS Admin</a></p>
  `;

  const result = await sendEmail({
    to: recipient,
    subject: `New FormOS support request: ${input.subject}`,
    text,
    html,
  });

  return {
    ok: result.ok,
    reason: result.error,
  };
}

export async function sendSupportReplyEmail(input: {
  requestId: string;
  recipientEmail: string;
  recipientName: string | null;
  subject: string;
  message: string;
  status: string;
}) {
  const appUrl = getAppUrl();
  const safeName = input.recipientName || "there";
  const text = [
    `Hi ${safeName},`,
    "",
    input.message,
    "",
    `Support request: ${input.subject}`,
    `Request ID: ${input.requestId}`,
    `Status: ${input.status}`,
    "",
    "Regards,",
    "FormOS Support",
    "",
    appUrl,
  ].join("\n");
  const html = `
    <p>Hi ${escapeHtml(safeName)},</p>
    <p>${escapeHtml(input.message).replace(/\n/g, "<br />")}</p>
    <hr />
    <p><strong>Support request:</strong> ${escapeHtml(input.subject)}</p>
    <p><strong>Request ID:</strong> ${escapeHtml(input.requestId)}</p>
    <p><strong>Status:</strong> ${escapeHtml(input.status)}</p>
    <p>Regards,<br />FormOS Support</p>
  `;

  const result = await sendEmail({
    to: input.recipientEmail,
    subject: `Re: ${input.subject}`,
    text,
    html,
  });

  return {
    ok: result.ok,
    reason: result.error,
  };
}

export function formatSupportDate(date: Date | null | undefined) {
  if (!date) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
