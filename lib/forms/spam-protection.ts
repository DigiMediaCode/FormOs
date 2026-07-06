import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { getPlatformSettings } from "@/lib/platform/settings";
import {
  isTurnstileConfigured,
  TURNSTILE_RESPONSE_FIELD,
  verifyTurnstileToken,
} from "@/lib/security/turnstile";

/**
 * Invisible anti-spam protections applied to every public/embedded submission.
 *
 * Layer 1 — Honeypot: a hidden field real users never see. Bots that fill every
 *   input trip it, and we silently drop the submission (the bot "succeeds").
 * Layer 2 — Time-trap: a signed token stamped when the form is rendered. Bots
 *   that POST instantly (or replay a forged/expired token) are blocked.
 * Layer 3 — Cloudflare Turnstile: enforced only when configured by Super Admin.
 */

export const SPAM_HONEYPOT_FIELD = "formos_hp";
export const SPAM_TIMESTAMP_FIELD = "formos_ts";
export { TURNSTILE_RESPONSE_FIELD };

// Humans take at least a moment to read and fill a form; sub-second submissions
// are almost always automated.
const MIN_SUBMIT_MS = 1500;
// Rendered tokens stay valid for a generous window so a slow-to-fill visitor is
// never blocked. Beyond this we ask them to reload.
const MAX_TOKEN_AGE_MS = 6 * 60 * 60 * 1000;

type TimestampPayload = {
  f: string;
  t: number;
};

function getAuthSecret() {
  if (process.env.AUTH_SECRET) {
    return process.env.AUTH_SECRET;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is required in production.");
  }

  return "formos-development-auth-secret";
}

function sign(value: string) {
  return createHmac("sha256", getAuthSecret()).update(value).digest("base64url");
}

/**
 * Creates a tamper-proof token capturing the form id and render time. Rendered
 * as a hidden field so it works without JavaScript.
 */
export function createFormTimestampToken(formId: string) {
  const encodedPayload = Buffer.from(
    JSON.stringify({ f: formId, t: Date.now() } satisfies TimestampPayload),
    "utf8",
  ).toString("base64url");

  return `${encodedPayload}.${sign(encodedPayload)}`;
}

function verifyFormTimestampToken(
  token: string,
  formId: string,
): { valid: boolean; ageMs: number } {
  const invalid = { valid: false, ageMs: 0 };
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return invalid;
  }

  const expectedSignature = sign(encodedPayload);
  const signatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedSignatureBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
  ) {
    return invalid;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as TimestampPayload;

    if (payload.f !== formId || typeof payload.t !== "number") {
      return invalid;
    }

    return { valid: true, ageMs: Date.now() - payload.t };
  } catch {
    return invalid;
  }
}

export type SubmissionGateDecision =
  | { action: "pass" }
  | { action: "silent_drop"; reason: string }
  | { action: "reject"; message: string };

/**
 * Runs all anti-spam layers for a public/embedded submission. The caller acts on
 * the decision: `pass` continues, `silent_drop` returns a fake success without
 * storing anything, and `reject` shows the visitor an actionable message.
 */
export async function assessPublicSubmission({
  formId,
  formData,
  ipAddress,
}: {
  formId: string;
  formData: FormData;
  ipAddress?: string | null;
}): Promise<SubmissionGateDecision> {
  // Layer 1 — honeypot.
  const honeypotValue = String(formData.get(SPAM_HONEYPOT_FIELD) ?? "").trim();

  if (honeypotValue.length > 0) {
    return { action: "silent_drop", reason: "honeypot_filled" };
  }

  // Layer 2 — time-trap.
  const token = String(formData.get(SPAM_TIMESTAMP_FIELD) ?? "");
  const timestamp = verifyFormTimestampToken(token, formId);

  if (!timestamp.valid) {
    return {
      action: "reject",
      message:
        "We could not verify your form session. Please reload the page and try again.",
    };
  }

  if (timestamp.ageMs < MIN_SUBMIT_MS) {
    return { action: "silent_drop", reason: "submitted_too_fast" };
  }

  if (timestamp.ageMs > MAX_TOKEN_AGE_MS) {
    return {
      action: "reject",
      message:
        "This form has been open for too long. Please reload the page and try again.",
    };
  }

  // Layer 3 — Cloudflare Turnstile (only when fully configured by Super Admin).
  const settings = await getPlatformSettings();

  if (isTurnstileConfigured(settings)) {
    const turnstileToken = String(formData.get(TURNSTILE_RESPONSE_FIELD) ?? "");

    if (!turnstileToken) {
      return {
        action: "reject",
        message: "Please complete the verification challenge and try again.",
      };
    }

    const verified = await verifyTurnstileToken({
      secret: settings.turnstileSecretKey,
      token: turnstileToken,
      remoteIp: ipAddress,
    });

    if (!verified) {
      return {
        action: "reject",
        message:
          "Verification failed. Please complete the challenge and try again.",
      };
    }
  }

  return { action: "pass" };
}
