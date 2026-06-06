"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { sendEmail } from "@/lib/email/send-email";
import {
  DEFAULT_EMAIL_TEMPLATES,
  EMAIL_TEMPLATE_KEYS,
  normalizeEmailTemplateKey,
  renderTemplateString,
  sanitizeEmailHtml,
  seedDefaultEmailTemplatesIfMissing,
  validateEmailTemplateKey,
  type EmailTemplateKey,
} from "@/lib/email/templates";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAIL_PATH = "/admin/email-notifications";

function redirectWith(type: "success" | "error", message: string): never {
  redirect(`${ADMIN_EMAIL_PATH}?${type}=${encodeURIComponent(message)}`);
}

function isTemplateKey(value: string): value is EmailTemplateKey {
  return (EMAIL_TEMPLATE_KEYS as readonly string[]).includes(value);
}

function sanitizePlainText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export async function seedDefaultEmailTemplatesAction() {
  const user = await requireSuperAdmin();
  await seedDefaultEmailTemplatesIfMissing(user.id);
  revalidatePath(ADMIN_EMAIL_PATH);
  redirectWith("success", "Default email templates checked.");
}

export async function saveEmailTemplateAction(formData: FormData) {
  const user = await requireSuperAdmin();
  const key = String(formData.get("key") ?? "");

  const existing = await prisma.emailTemplate.findUnique({
    where: { key },
  });

  if (!existing && !isTemplateKey(key)) {
    redirectWith("error", "Template not found.");
  }

  const defaults = isTemplateKey(key) ? DEFAULT_EMAIL_TEMPLATES[key] : null;
  const name = sanitizePlainText(formData.get("name")) || defaults?.name || key;
  const description =
    sanitizePlainText(formData.get("description")) || defaults?.description || null;
  const subject = sanitizePlainText(formData.get("subject"));
  const textBody = sanitizePlainText(formData.get("textBody"));
  const htmlBody = sanitizePlainText(formData.get("htmlBody"));

  if (!subject || !textBody) {
    redirectWith("error", "Subject and text body are required.");
  }

  await prisma.emailTemplate.upsert({
    where: { key },
    update: {
      name,
      description,
      subject,
      textBody,
      htmlBody: htmlBody ? sanitizeEmailHtml(htmlBody) : null,
      isActive: formData.get("isActive") === "on",
      updatedById: user.id,
    },
    create: {
      key,
      name,
      description,
      subject,
      textBody,
      htmlBody: htmlBody ? sanitizeEmailHtml(htmlBody) : null,
      isActive: formData.get("isActive") === "on",
      updatedById: user.id,
    },
  });

  revalidatePath(ADMIN_EMAIL_PATH);
  redirectWith("success", `${name} template saved.`);
}

export async function createEmailTemplateAction(formData: FormData) {
  const user = await requireSuperAdmin();
  const key = normalizeEmailTemplateKey(String(formData.get("key") ?? ""));
  const keyError = validateEmailTemplateKey(key);

  if (keyError) {
    redirectWith("error", keyError);
  }

  if (isTemplateKey(key)) {
    redirectWith("error", "This key is reserved for a built-in system template.");
  }

  const name = sanitizePlainText(formData.get("name"));
  const description = sanitizePlainText(formData.get("description"));
  const subject = sanitizePlainText(formData.get("subject"));
  const textBody = sanitizePlainText(formData.get("textBody"));
  const htmlBody = sanitizePlainText(formData.get("htmlBody"));

  if (!name || !subject || !textBody) {
    redirectWith("error", "Name, subject, and text body are required.");
  }

  try {
    await prisma.emailTemplate.create({
      data: {
        key,
        name,
        description: description || null,
        subject,
        textBody,
        htmlBody: htmlBody ? sanitizeEmailHtml(htmlBody) : null,
        isActive: formData.get("isActive") === "on",
        updatedById: user.id,
      },
    });
  } catch {
    redirectWith("error", "A template with this key already exists.");
  }

  revalidatePath(ADMIN_EMAIL_PATH);
  redirectWith("success", `${name} template created.`);
}

export async function resetEmailTemplateAction(key: EmailTemplateKey) {
  const user = await requireSuperAdmin();
  const defaults = DEFAULT_EMAIL_TEMPLATES[key];

  await prisma.emailTemplate.upsert({
    where: { key },
    update: {
      name: defaults.name,
      description: defaults.description,
      subject: defaults.subject,
      textBody: defaults.textBody,
      htmlBody: defaults.htmlBody ?? null,
      isActive: true,
      updatedById: user.id,
    },
    create: {
      key,
      name: defaults.name,
      description: defaults.description,
      subject: defaults.subject,
      textBody: defaults.textBody,
      htmlBody: defaults.htmlBody,
      isActive: true,
      updatedById: user.id,
    },
  });

  revalidatePath(ADMIN_EMAIL_PATH);
  redirectWith("success", `${defaults.name} template reset.`);
}

export async function sendBroadcastEmailAction(formData: FormData) {
  const user = await requireSuperAdmin();
  const name = sanitizePlainText(formData.get("name")) || "Email broadcast";
  const subject = sanitizePlainText(formData.get("subject"));
  const textBody = sanitizePlainText(formData.get("textBody"));
  const htmlBody = sanitizePlainText(formData.get("htmlBody"));

  if (!subject || !textBody) {
    redirectWith("error", "Broadcast subject and text body are required.");
  }

  const recipients = await prisma.user.findMany({
    where: {
      email: {
        not: "",
      },
      suspendedAt: null,
    },
    select: {
      email: true,
      firstName: true,
      lastName: true,
      name: true,
    },
  });

  if (recipients.length === 0) {
    redirectWith("error", "No eligible users found for this broadcast.");
  }

  let sentCount = 0;
  let failedCount = 0;
  const safeHtml = htmlBody ? sanitizeEmailHtml(htmlBody) : undefined;

  for (const recipient of recipients) {
    const userName =
      recipient.name ||
      [recipient.firstName, recipient.lastName].filter(Boolean).join(" ") ||
      recipient.email;
    const variables = {
      firstName: recipient.firstName,
      lastName: recipient.lastName,
      userName,
      userEmail: recipient.email,
    };

    const result = await sendEmail({
      to: recipient.email,
      subject: renderTemplateString(subject, variables),
      text: renderTemplateString(textBody, variables),
      html: safeHtml ? renderTemplateString(safeHtml, variables) : undefined,
    });

    if (result.ok) {
      sentCount += 1;
    } else {
      failedCount += 1;
    }
  }

  await prisma.emailCampaign.create({
    data: {
      name,
      subject,
      textBody,
      htmlBody: safeHtml,
      recipientCount: recipients.length,
      sentCount,
      failedCount,
      status: failedCount > 0 ? "PARTIAL" : "SENT",
      createdById: user.id,
    },
  });

  revalidatePath(ADMIN_EMAIL_PATH);
  redirectWith(
    "success",
    failedCount > 0
      ? `Broadcast sent to ${sentCount} users. ${failedCount} failed safely.`
      : `Broadcast sent to ${sentCount} users.`,
  );
}
