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
const ADMIN_EMAIL_NEW_PATH = "/admin/email-notifications/new";
const ADMIN_EMAIL_BROADCAST_PATH = "/admin/email-notifications/broadcast";

function safeRedirectPath(value: unknown) {
  if (
    value === ADMIN_EMAIL_PATH ||
    value === ADMIN_EMAIL_NEW_PATH ||
    value === ADMIN_EMAIL_BROADCAST_PATH
  ) {
    return value;
  }

  if (
    typeof value === "string" &&
    (/^\/admin\/email-notifications\/[a-zA-Z0-9_-]+$/.test(value) ||
      /^\/admin\/email-notifications\/broadcast\/[a-zA-Z0-9_-]+$/.test(value))
  ) {
    return value;
  }

  return ADMIN_EMAIL_PATH;
}

function redirectWith(
  type: "success" | "error",
  message: string,
  path = ADMIN_EMAIL_PATH,
): never {
  redirect(`${safeRedirectPath(path)}?${type}=${encodeURIComponent(message)}`);
}

function isTemplateKey(value: string): value is EmailTemplateKey {
  return (EMAIL_TEMPLATE_KEYS as readonly string[]).includes(value);
}

function sanitizePlainText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function parseEmailList(value: FormDataEntryValue | null) {
  return Array.from(
    new Set(
      String(value ?? "")
        .split(/[\s,;]+/)
        .map((email) => email.trim().toLowerCase())
        .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)),
    ),
  );
}

type BroadcastRecipient = {
  email: string;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
};

function dedupeRecipients(recipients: BroadcastRecipient[]) {
  const seenEmails = new Set<string>();

  return recipients.filter((recipient) => {
    const email = recipient.email.trim().toLowerCase();

    if (!email || seenEmails.has(email)) {
      return false;
    }

    seenEmails.add(email);
    recipient.email = email;
    return true;
  });
}

function rawEmailRecipient(email: string): BroadcastRecipient {
  const localPart = email.split("@")[0] || email;

  return {
    email,
    firstName: null,
    lastName: null,
    name: localPart,
  };
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
  const redirectPath = safeRedirectPath(
    sanitizePlainText(formData.get("redirectTo")) || ADMIN_EMAIL_PATH,
  );

  const existing = await prisma.emailTemplate.findUnique({
    where: { key },
  });

  if (!existing && !isTemplateKey(key)) {
    redirectWith("error", "Template not found.", redirectPath);
  }

  const defaults = isTemplateKey(key) ? DEFAULT_EMAIL_TEMPLATES[key] : null;
  const name = sanitizePlainText(formData.get("name")) || defaults?.name || key;
  const description =
    sanitizePlainText(formData.get("description")) || defaults?.description || null;
  const subject = sanitizePlainText(formData.get("subject"));
  const textBody = sanitizePlainText(formData.get("textBody"));
  const htmlBody = sanitizePlainText(formData.get("htmlBody"));

  if (!subject || !textBody) {
    redirectWith("error", "Subject and text body are required.", redirectPath);
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
  revalidatePath(redirectPath);
  redirectWith("success", `${name} template saved.`, redirectPath);
}

export async function createEmailTemplateAction(formData: FormData) {
  const user = await requireSuperAdmin();
  const key = normalizeEmailTemplateKey(String(formData.get("key") ?? ""));
  const keyError = validateEmailTemplateKey(key);

  if (keyError) {
    redirectWith("error", keyError, ADMIN_EMAIL_NEW_PATH);
  }

  if (isTemplateKey(key)) {
    redirectWith(
      "error",
      "This key is reserved for a built-in system template.",
      ADMIN_EMAIL_NEW_PATH,
    );
  }

  const name = sanitizePlainText(formData.get("name"));
  const description = sanitizePlainText(formData.get("description"));
  const subject = sanitizePlainText(formData.get("subject"));
  const textBody = sanitizePlainText(formData.get("textBody"));
  const htmlBody = sanitizePlainText(formData.get("htmlBody"));

  if (!name || !subject || !textBody) {
    redirectWith(
      "error",
      "Name, subject, and text body are required.",
      ADMIN_EMAIL_NEW_PATH,
    );
  }
  let templateId = "";

  try {
    const template = await prisma.emailTemplate.create({
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
      select: {
        id: true,
      },
    });
    templateId = template.id;
  } catch {
    redirectWith(
      "error",
      "A template with this key already exists.",
      ADMIN_EMAIL_NEW_PATH,
    );
  }

  revalidatePath(ADMIN_EMAIL_PATH);
  redirectWith("success", `${name} template created.`, `${ADMIN_EMAIL_PATH}/${templateId}`);
}

export async function resetEmailTemplateAction(
  key: EmailTemplateKey,
  redirectPath: string | FormData = ADMIN_EMAIL_PATH,
) {
  const user = await requireSuperAdmin();
  const defaults = DEFAULT_EMAIL_TEMPLATES[key];
  const destination = safeRedirectPath(redirectPath);

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
  revalidatePath(destination);
  redirectWith("success", `${defaults.name} template reset.`, destination);
}

export async function sendBroadcastEmailAction(formData: FormData) {
  const user = await requireSuperAdmin();
  const name = sanitizePlainText(formData.get("name")) || "Email broadcast";
  const subject = sanitizePlainText(formData.get("subject"));
  const textBody = sanitizePlainText(formData.get("textBody"));
  const htmlBody = sanitizePlainText(formData.get("htmlBody"));
  const recipientMode = sanitizePlainText(formData.get("recipientMode")) || "all";

  if (!subject || !textBody) {
    redirectWith(
      "error",
      "Broadcast subject and text body are required.",
      ADMIN_EMAIL_BROADCAST_PATH,
    );
  }

  const selectedUserIds = formData
    .getAll("recipientUserIds")
    .map((value) => String(value))
    .filter(Boolean);
  const selectedPlanIds = formData
    .getAll("recipientPlanIds")
    .map((value) => String(value))
    .filter(Boolean);
  const selectedEmails = parseEmailList(formData.get("recipientEmails"));
  const effectiveRecipientMode =
    selectedPlanIds.length > 0
      ? "plan"
      : selectedUserIds.length > 0 || selectedEmails.length > 0
        ? "specific"
        : recipientMode;

  if (
    effectiveRecipientMode === "specific" &&
    selectedUserIds.length === 0 &&
    selectedEmails.length === 0
  ) {
    redirectWith(
      "error",
      "Choose at least one user or enter at least one valid email address.",
      ADMIN_EMAIL_BROADCAST_PATH,
    );
  }

  if (effectiveRecipientMode === "plan" && selectedPlanIds.length === 0) {
    redirectWith(
      "error",
      "Choose at least one package/plan for this broadcast.",
      ADMIN_EMAIL_BROADCAST_PATH,
    );
  }

  const selectedPlans =
    effectiveRecipientMode === "plan"
      ? await prisma.subscriptionPlan.findMany({
          where: {
            id: {
              in: selectedPlanIds,
            },
          },
          select: {
            id: true,
            slug: true,
          },
        })
      : [];
  const includeFreeFallback = selectedPlans.some(
    (plan) => plan.slug.toLowerCase() === "free",
  );
  const userSelect = {
    email: true,
    firstName: true,
    lastName: true,
    name: true,
  } as const;
  const registeredRecipients =
    effectiveRecipientMode === "all"
      ? await prisma.user.findMany({
          where: {
            email: {
              not: "",
            },
            suspendedAt: null,
          },
          select: userSelect,
        })
      : effectiveRecipientMode === "plan"
        ? await prisma.user.findMany({
            where: {
              email: {
                not: "",
              },
              suspendedAt: null,
              OR: [
                {
                  subscription: {
                    is: {
                      planId: {
                        in: selectedPlanIds,
                      },
                    },
                  },
                },
                ...(includeFreeFallback
                  ? [
                      {
                        subscription: {
                          is: null,
                        },
                      },
                    ]
                  : []),
              ],
            },
            select: userSelect,
          })
        : selectedUserIds.length > 0
          ? await prisma.user.findMany({
              where: {
                email: {
                  not: "",
                },
                suspendedAt: null,
                id: {
                  in: selectedUserIds,
                },
              },
              select: userSelect,
            })
          : [];
  const recipients = dedupeRecipients([
    ...registeredRecipients,
    ...selectedEmails.map(rawEmailRecipient),
  ]);

  if (recipients.length === 0) {
    redirectWith("error", "No eligible users found for this broadcast.", ADMIN_EMAIL_BROADCAST_PATH);
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
  revalidatePath(ADMIN_EMAIL_BROADCAST_PATH);
  redirectWith(
    "success",
    failedCount > 0
      ? `Broadcast sent to ${sentCount} users. ${failedCount} failed safely.`
      : `Broadcast sent to ${sentCount} users.`,
    ADMIN_EMAIL_BROADCAST_PATH,
  );
}
