import "server-only";

import { getAppUrl } from "@/lib/app-url";
import { getPlatformSettings } from "@/lib/platform/settings";
import { prisma } from "@/lib/prisma";

export const EMAIL_TEMPLATE_KEYS = [
  "signup_welcome",
  "login_verification_code",
  "login_notification",
  "email_verification",
  "password_reset",
  "new_submission_owner",
  "form_completed_submitter",
  "completed_pdf_owner",
  "completed_pdf_submitter",
  "workspace_invite",
  "payment_failed",
  "business_document_signing_request",
  "business_document_signed_pdf",
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

export const SHARED_EMAIL_TEMPLATE_VARIABLES = [
  "siteName",
  "companyName",
  "appUrl",
  "dashboardLink",
  "loginLink",
  "signupLink",
  "pricingLink",
  "contactLink",
  "supportEmail",
  "contactEmail",
  "currentDate",
  "currentTime",
  "currentYear",
  "userName",
  "firstName",
  "lastName",
  "userEmail",
  "emailHeader",
  "emailFooter",
] as const;

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
  login_verification_code: {
    name: "Login verification code",
    description: "Sent when a user signs in and needs to verify the login.",
    subject: "Your FormOS login code",
    textBody:
      "Hi {{userName}},\n\nYour FormOS login code is:\n\n{{loginCode}}\n\nThis code expires in {{expiresInMinutes}} minutes.\nIf you did not try to sign in, you can ignore this email.",
    htmlBody:
      "<p>Hi {{userName}},</p><p>Your FormOS login code is:</p><p style=\"font-size:28px;font-weight:700;letter-spacing:8px;\">{{loginCode}}</p><p>This code expires in {{expiresInMinutes}} minutes.</p><p>If you did not try to sign in, you can ignore this email.</p>",
    variables: ["userName", "userEmail", "loginCode", "expiresInMinutes"],
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
  payment_failed: {
    name: "Payment failed",
    description:
      "Sent when Stripe reports that a paid plan payment could not be collected.",
    subject: "Action needed: update your FormOS billing details",
    textBody:
      "Hi {{userName}},\n\nWe could not collect payment for your {{planName}} plan. Your account has been moved to Free plan limits until billing is restored.\n\nRestore your plan here:\n{{billingLink}}\n\nPlease update your billing details by {{restoreUntil}} to continue using paid features. Your existing forms and submissions have not been deleted.",
    htmlBody:
      "<p>Hi {{userName}},</p><p>We could not collect payment for your <strong>{{planName}}</strong> plan. Your account has been moved to Free plan limits until billing is restored.</p><p><a href=\"{{billingLink}}\">Restore your plan</a></p><p>Please update your billing details by {{restoreUntil}} to continue using paid features. Your existing forms and submissions have not been deleted.</p>",
    variables: ["userName", "userEmail", "planName", "billingLink", "restoreUntil"],
  },
  business_document_signing_request: {
    name: "Document signing request",
    description:
      "Sent to a client when a contract or agreement is sent for digital signing.",
    subject: "Signature requested: {{documentTitle}}",
    textBody:
      "Hi {{clientName}},\n\n{{ownerName}} has sent you a {{documentType}} to review and sign.\n\nDocument: {{documentTitle}}\nDocument number: {{documentNumber}}\n\nOpen and sign:\n{{signingUrl}}\n\nThis link expires on {{expiresAt}}.",
    htmlBody:
      "<p>Hi {{clientName}},</p><p>{{ownerName}} has sent you a {{documentType}} to review and sign.</p><p><strong>Document:</strong> {{documentTitle}}<br><strong>Document number:</strong> {{documentNumber}}</p><p><a href=\"{{signingUrl}}\">Open and sign the document</a></p><p>This link expires on {{expiresAt}}.</p>",
    variables: [
      "documentTitle",
      "documentNumber",
      "documentType",
      "signingUrl",
      "expiresAt",
      "clientName",
      "clientEmail",
      "ownerName",
      "ownerEmail",
    ],
  },
  business_document_signed_pdf: {
    name: "Signed document PDF",
    description:
      "Sent to both parties with the signed PDF after a contract or agreement is signed by both sides.",
    subject: "Signed document: {{documentTitle}}",
    textBody:
      "Hi {{userName}},\n\n{{documentTitle}} has been signed by both parties.\n\nDocument number: {{documentNumber}}\nClient: {{clientName}}\nBusiness: {{ownerName}}\n\nThe signed PDF is attached.",
    htmlBody:
      "<p>Hi {{userName}},</p><p><strong>{{documentTitle}}</strong> has been signed by both parties.</p><p><strong>Document number:</strong> {{documentNumber}}<br><strong>Client:</strong> {{clientName}}<br><strong>Business:</strong> {{ownerName}}</p><p>The signed PDF is attached.</p>",
    variables: [
      "documentTitle",
      "documentNumber",
      "documentType",
      "clientName",
      "clientEmail",
      "ownerName",
      "ownerEmail",
      "recipientRole",
    ],
  },
};

export const ALL_EMAIL_TEMPLATE_VARIABLES = Array.from(
  new Set([
    ...SHARED_EMAIL_TEMPLATE_VARIABLES,
    ...Object.values(DEFAULT_EMAIL_TEMPLATES).flatMap((template) => template.variables),
  ]),
);

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

  const variables = await buildEmailTemplateVariables(input.variables);

  if (!template?.isActive) {
    return {
      subject: renderTemplateString(input.fallback.subject, variables.subject),
      text: renderTemplateString(input.fallback.text, variables.text),
      html: input.fallback.html
        ? sanitizeEmailHtml(renderTemplateString(input.fallback.html, variables.html))
        : undefined,
    };
  }

  return {
    subject: renderTemplateString(template.subject, variables.subject),
    text: renderTemplateString(template.textBody, variables.text),
    html: template.htmlBody
      ? sanitizeEmailHtml(renderTemplateString(template.htmlBody, variables.html))
      : undefined,
  };
}

async function buildEmailTemplateVariables(
  variables: Record<string, string | number | null | undefined>,
) {
  const appUrl = getAppUrl();
  const settings = await getPlatformSettings();
  const now = new Date();
  const emptyVariables = Object.fromEntries(
    ALL_EMAIL_TEMPLATE_VARIABLES.map((variable) => [variable, ""]),
  );
  const firstName = String(variables.firstName ?? "").trim();
  const lastName = String(variables.lastName ?? "").trim();
  const userEmail = String(variables.userEmail ?? "").trim();
  const userName =
    String(variables.userName ?? "").trim() ||
    [firstName, lastName].filter(Boolean).join(" ") ||
    (userEmail ? userEmail.split("@")[0] : "");

  const baseVariables = {
    ...emptyVariables,
    siteName: settings.siteName || "FormOS",
    companyName: settings.companyName || "",
    appUrl,
    dashboardLink: `${appUrl}/dashboard`,
    loginLink: `${appUrl}/login`,
    signupLink: `${appUrl}/signup`,
    pricingLink: `${appUrl}/pricing`,
    contactLink: new URL(settings.contactUrl || "/contact", `${appUrl}/`).toString(),
    supportEmail: settings.supportEmail || settings.contactEmail || "info@formos.com.au",
    contactEmail: settings.contactEmail || settings.supportEmail || "info@formos.com.au",
    currentDate: now.toISOString().slice(0, 10),
    currentTime: now.toISOString(),
    currentYear: String(now.getFullYear()),
    ...variables,
    firstName,
    lastName,
    userEmail,
    userName,
  };
  const emailHeaderText = renderTemplateString(
    settings.emailHeaderText,
    baseVariables,
  );
  const emailFooterText = renderTemplateString(
    settings.emailFooterText,
    baseVariables,
  );
  const emailHeaderHtml = settings.emailHeaderHtml
    ? sanitizeEmailHtml(renderTemplateString(settings.emailHeaderHtml, baseVariables))
    : textToEmailHtml(emailHeaderText);
  const emailFooterHtml = settings.emailFooterHtml
    ? sanitizeEmailHtml(renderTemplateString(settings.emailFooterHtml, baseVariables))
    : textToEmailHtml(emailFooterText);

  return {
    subject: {
      ...baseVariables,
      emailHeader: "",
      emailFooter: "",
    },
    text: {
      ...baseVariables,
      emailHeader: emailHeaderText,
      emailFooter: emailFooterText,
    },
    html: {
      ...baseVariables,
      emailHeader: emailHeaderHtml,
      emailFooter: emailFooterHtml,
    },
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function textToEmailHtml(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  return `<p>${escapeHtml(trimmed).replace(/\r?\n/g, "<br>")}</p>`;
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
