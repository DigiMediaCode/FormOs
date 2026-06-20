import "server-only";

import { Prisma } from "@prisma/client";

const SUBMISSION_NOTIFICATION_EMAIL_KEY = "submissionNotificationEmail";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

export function parseSubmissionNotificationEmail(value: unknown) {
  const email = String(value ?? "").trim().toLowerCase();

  if (!email) {
    return {
      email: null,
      error: null,
    };
  }

  if (!isValidEmail(email)) {
    return {
      email: null,
      error: "Enter a valid submission notification email address.",
    };
  }

  return {
    email,
    error: null,
  };
}

export function getSubmissionNotificationEmail(settings: unknown) {
  if (!isRecord(settings)) {
    return null;
  }

  const value = settings[SUBMISSION_NOTIFICATION_EMAIL_KEY];

  if (typeof value !== "string") {
    return null;
  }

  const parsed = parseSubmissionNotificationEmail(value);

  return parsed.error ? null : parsed.email;
}

export function mergeSubmissionNotificationEmail(
  settings: unknown,
  email: string | null,
): Prisma.InputJsonValue {
  const next = isRecord(settings) ? { ...settings } : {};

  if (email) {
    next[SUBMISSION_NOTIFICATION_EMAIL_KEY] = email;
  } else {
    delete next[SUBMISSION_NOTIFICATION_EMAIL_KEY];
  }

  return next as Prisma.InputJsonValue;
}

export function resolveSubmissionNotificationEmail(input: {
  settings: unknown;
  ownerEmail: string;
  allowCustomSubmissionNotifications: boolean;
}) {
  if (!input.allowCustomSubmissionNotifications) {
    return input.ownerEmail;
  }

  return getSubmissionNotificationEmail(input.settings) ?? input.ownerEmail;
}
