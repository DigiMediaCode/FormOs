import "server-only";

import { createHash, randomBytes } from "crypto";

export const DOCUMENT_SIGNING_TOKEN_DAYS = 30;

export function generateDocumentSigningToken() {
  return randomBytes(32).toString("base64url");
}

export function hashDocumentSigningToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function signingTokenExpiryDate() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + DOCUMENT_SIGNING_TOKEN_DAYS);
  return expiresAt;
}

export function isValidSignatureDataUrl(value: string) {
  return (
    value.startsWith("data:image/png;base64,") &&
    value.length <= 2_000_000
  );
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function snapshotString(snapshot: unknown, key: string) {
  if (!isRecord(snapshot)) {
    return "";
  }

  const value = snapshot[key];
  return typeof value === "string" ? value.trim() : "";
}

export function snapshotDisplayName(snapshot: unknown, fallback = "Customer") {
  return (
    snapshotString(snapshot, "name") ||
    snapshotString(snapshot, "companyName") ||
    snapshotString(snapshot, "email") ||
    fallback
  );
}

export function snapshotEmail(snapshot: unknown) {
  return snapshotString(snapshot, "email");
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
