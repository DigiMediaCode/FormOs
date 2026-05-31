import "server-only";

import { isPublicField, type FormBuilderField } from "@/lib/forms/fields";

const EMAIL_LABELS = ["your email", "contact email", "e-mail", "email"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanEmail(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const email = value.trim().toLowerCase();
  return EMAIL_PATTERN.test(email) ? email : null;
}

export function extractSubmitterEmail(
  fields: FormBuilderField[],
  data: unknown,
) {
  const submittedData = isRecord(data) ? data : {};
  const publicFields = fields.filter(isPublicField);
  const emailField = publicFields.find((field) => field.type === "email");
  const emailValue = emailField ? cleanEmail(submittedData[emailField.id]) : null;

  if (emailValue) {
    return emailValue;
  }

  for (const label of EMAIL_LABELS) {
    const field = publicFields.find(
      (candidate) =>
        candidate.type === "text" &&
        candidate.label.toLowerCase().includes(label),
    );
    const fallbackEmail = field ? cleanEmail(submittedData[field.id]) : null;

    if (fallbackEmail) {
      return fallbackEmail;
    }
  }

  return null;
}
