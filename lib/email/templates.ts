import "server-only";

import { prisma } from "@/lib/prisma";

export const EMAIL_TEMPLATE_KEYS = [
  "signup_welcome",
  "login_notification",
  "email_verification",
  "password_reset",
  "new_submission_owner",
  "form_completed_submitter",
  "completed_pdf_owner",
  "completed_pdf_submitter",
  "workspace_invite",
] as const;

export type EmailTemplateKey = (typeof EMAIL_TEMPLATE_KEYS)[number];

export type EmailTemplateRenderInput = {
  key: EmailTemplateKey;
  variables: Record<string, string | number | null | undefined>;
  fallback: {
    subject: string;
    text: string;
    html?: string;
  };
};

export function normalizeEmailTemplateKey(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

export function validateEmailTemplateKey(key: string) {
  if (!key) {
    return "Template key is required.";
  }

  if (!/^[a-z0-9_]+$/.test(key)) {
    return "Template key can only use lowercase letters, numbers, and underscores.";
  }

  return null;
}

export const DEFAULT_EMAIL_TEMPLATES: Record<
  EmailTemplateKey,
  {
    name: string;
    description: string;
    subject: string;
    textBody: string;
    htmlBody?: string;
    variables: string[];
  }
> = {
  signup_welcome: {
    name: "Signup welcome",
    description: "Sent after a new user creates an account.",
    subject: "Welcome to FormOS",
    textBody:
      "Hi {{userName}},\n\nWelcome to FormOS. Your account is ready.\nAccount email: {{userEmail}}\nDashboard: {{dashboardLink}}",
    variables: ["userName", "userEmail", "dashboardLink"],
  },
  login_notification: {
    name: "Successful login",
    description: "Sent after a successful account login.",
    subject: "New login to your FormOS account",
    textBody:
      "Account email: {{userEmail}}\nLogin time: {{loginTime}}\n\nIf this was you, no action is needed. If this was not you, please secure your account.",
    variables: ["userEmail", "loginTime"],
  },
  email_verification: {
    name: "Email verification",
    description: "Sent when a user needs to verify their email address.",
    subject: "Verify your FormOS email address",
    textBody:
      "Hi {{userName}},\n\nPlease verify your FormOS email address using the link below.\n{{verificationLink}}\n\nThis link expires in 24 hours.\nIf you did not create a FormOS account, you can ignore this email.",
    variables: ["userName", "userEmail", "verificationLink"],
  },
  password_reset: {
    name: "Password reset",
    description: "Sent when a user requests a password reset.",
    subject: "Reset your FormOS password",
    textBody:
      "A password reset was requested for your FormOS account.\n\nReset your password using the link below:\n{{resetLink}}\n\nThis link expires in 1 hour.\nIf you did not request this, you can ignore this email.",
    variables: ["userEmail", "resetLink"],
  },
  new_submission_owner: {
    name: "New submission to owner",
    description: "Sent to the form owner after a public submission succeeds.",
    subject: "New submission received: {{formTitle}}",
    textBody:
      "Form: {{formTitle}}\nSubmitted: {{submittedAt}}\nReview submission: {{submissionLink}}\n\nLog in to FormOS to review the submission and complete any office-use fields.",
    variables: ["formTitle", "submittedAt", "submissionLink"],
  },
  form_completed_submitter: {
    name: "Form completed to submitter",
    description: "Sent to submitter when office work is marked completed.",
    subject: "Your form has been completed: {{formTitle}}",
    textBody:
      "Form: {{formTitle}}\nCompleted: {{completedAt}}\n\nThe form owner has completed processing your submission.",
    variables: ["formTitle", "completedAt"],
  },
  completed_pdf_owner: {
    name: "Completed PDF to owner",
    description: "Sent to owner with the completed PDF attached.",
    subject: "Completed submission: {{formTitle}}",
    textBody:
      "Your completed submission PDF is attached.\n\nForm: {{formTitle}}\nCompleted: {{completedAt}}\nSubmission ID: {{submissionId}}",
    variables: ["formTitle", "completedAt", "submissionId"],
  },
  completed_pdf_submitter: {
    name: "Completed PDF to submitter",
    description: "Sent to submitter with the completed PDF attached.",
    subject: "Your completed form: {{formTitle}}",
    textBody:
      "Your completed form is attached as a PDF.\n\nForm: {{formTitle}}\nCompleted: {{completedAt}}",
    variables: ["formTitle", "completedAt"],
  },
  workspace_invite: {
    name: "Workspace invite",
    description: "Sent when an owner invites a staff member.",
    subject: "You have been invited to FormOS",
    textBody:
      "You have been invited to join {{workspaceName}} on FormOS.\n\nAccept Invite:\n{{inviteUrl}}\n\nThis invite expires in 7 days.",
    htmlBody:
      "<p>You have been invited to join <strong>{{workspaceName}}</strong> on FormOS.</p><p><a href=\"{{inviteUrl}}\">Accept Invite</a></p><p>This invite expires in 7 days.</p>",
    variables: ["workspaceName", "inviteUrl"],
  },
};

export async function seedDefaultEmailTemplatesIfMissing(updatedById?: string) {
  await Promise.all(
    EMAIL_TEMPLATE_KEYS.map((key) => {
      const template = DEFAULT_EMAIL_TEMPLATES[key];

      return prisma.emailTemplate.upsert({
        where: { key },
        update: {},
        create: {
          key,
          name: template.name,
          description: template.description,
          subject: template.subject,
          textBody: template.textBody,
          htmlBody: template.htmlBody,
          updatedById,
        },
      });
    }),
  );
}

export async function renderEmailTemplate(input: EmailTemplateRenderInput) {
  const template = await prisma.emailTemplate.findUnique({
    where: { key: input.key },
  });

  if (!template?.isActive) {
    return input.fallback;
  }

  return {
    subject: renderTemplateString(template.subject, input.variables),
    text: renderTemplateString(template.textBody, input.variables),
    html: template.htmlBody
      ? sanitizeEmailHtml(renderTemplateString(template.htmlBody, input.variables))
      : undefined,
  };
}

export function renderTemplateString(
  template: string,
  variables: Record<string, string | number | null | undefined>,
) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) =>
    String(variables[key] ?? ""),
  );
}

export function sanitizeEmailHtml(html: string) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, "")
    .replace(/<object\b[^>]*>[\s\S]*?<\/object>/gi, "")
    .replace(/<embed\b[^>]*\/?>/gi, "")
    .replace(/<form\b[^>]*>[\s\S]*?<\/form>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s+(href|src)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi, "")
    .replace(/\s+(href|src)\s*=\s*javascript:[^\s>]*/gi, "");
}
