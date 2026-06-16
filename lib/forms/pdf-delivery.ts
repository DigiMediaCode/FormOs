import "server-only";

import { Prisma } from "@prisma/client";
import { isOfficeField, normalizeFormFields } from "@/lib/forms/fields";

export const PDF_DELIVERY_MODES = [
  "MANUAL",
  "AFTER_SUBMISSION",
  "AFTER_FINALIZATION",
] as const;

export type PdfDeliveryMode = (typeof PDF_DELIVERY_MODES)[number];

export const PDF_DELIVERY_MODE_LABELS: Record<PdfDeliveryMode, string> = {
  MANUAL: "Manual only",
  AFTER_SUBMISSION: "After public submission",
  AFTER_FINALIZATION: "After office finalization",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isPdfDeliveryMode(value: unknown): value is PdfDeliveryMode {
  return (
    typeof value === "string" &&
    PDF_DELIVERY_MODES.includes(value as PdfDeliveryMode)
  );
}

export function formHasOfficeFields(fields: unknown) {
  return normalizeFormFields(fields).some(isOfficeField);
}

export function normalizePdfDeliveryMode(
  settings: unknown,
  hasOfficeFields = false,
): PdfDeliveryMode {
  if (isRecord(settings) && isPdfDeliveryMode(settings.pdfDeliveryMode)) {
    return settings.pdfDeliveryMode;
  }

  return hasOfficeFields ? "AFTER_FINALIZATION" : "MANUAL";
}

export function mergePdfDeliveryMode(
  settings: unknown,
  mode: PdfDeliveryMode,
): Prisma.InputJsonValue {
  const existing = isRecord(settings) ? settings : {};

  return {
    ...existing,
    pdfDeliveryMode: mode,
  } as Prisma.InputJsonValue;
}
