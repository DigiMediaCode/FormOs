import "server-only";

import type { PlatformSettings } from "@/lib/platform/settings";

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export const TURNSTILE_RESPONSE_FIELD = "cf-turnstile-response";

type TurnstileConfigInput = Pick<
  PlatformSettings,
  "turnstileEnabled" | "turnstileSiteKey" | "turnstileSecretKey"
>;

/**
 * Turnstile is only treated as active when it is enabled AND both keys are set.
 * This avoids a half-configured state where the widget renders without a secret
 * (or the server enforces verification with no widget shown to the visitor).
 */
export function isTurnstileConfigured(settings: TurnstileConfigInput) {
  return (
    settings.turnstileEnabled &&
    settings.turnstileSiteKey.trim().length > 0 &&
    settings.turnstileSecretKey.trim().length > 0
  );
}

/**
 * Verifies a Turnstile token against Cloudflare's siteverify endpoint.
 *
 * Fails open on network/transport errors so a Cloudflare outage never blocks
 * legitimate submissions; only an explicit `success: false` (bad/expired/forged
 * token) blocks the submission.
 */
export async function verifyTurnstileToken({
  secret,
  token,
  remoteIp,
}: {
  secret: string;
  token: string;
  remoteIp?: string | null;
}): Promise<boolean> {
  if (!secret || !token) {
    return false;
  }

  try {
    const body = new URLSearchParams();
    body.set("secret", secret);
    body.set("response", token);

    if (remoteIp && remoteIp !== "unknown") {
      body.set("remoteip", remoteIp);
    }

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });

    if (!response.ok) {
      console.warn("[formos:turnstile] Non-OK siteverify response; failing open.", {
        status: response.status,
      });
      return true;
    }

    const data = (await response.json()) as {
      success?: boolean;
      "error-codes"?: string[];
    };

    if (data.success !== true) {
      console.info("[formos:turnstile] Token rejected.", {
        errorCodes: data["error-codes"] ?? [],
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error("[formos:turnstile] Verification request failed; failing open.", {
      message: error instanceof Error ? error.message : "unknown error",
    });
    return true;
  }
}
