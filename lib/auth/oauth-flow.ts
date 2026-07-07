import "server-only";

import type { NextRequest } from "next/server";
import type { OAuthLoginProvider } from "@/lib/auth/oauth-state";

function safeSlug(value: string | null) {
  return value && /^[a-z0-9-]+$/.test(value) ? value.toLowerCase() : "";
}

/**
 * Resolves where to send a user after a successful social login, preserving
 * plan/template intent captured on the login/signup entry point.
 */
export function oauthNextPathFromRequest(request: NextRequest) {
  const plan = safeSlug(request.nextUrl.searchParams.get("plan"));
  const template = safeSlug(request.nextUrl.searchParams.get("template"));

  if (plan && plan !== "free") {
    return `/api/billing/start-trial?plan=${encodeURIComponent(plan)}&interval=monthly`;
  }

  if (template) {
    return `/dashboard?template=${encodeURIComponent(template)}`;
  }

  return "/dashboard";
}

export function oauthStateCookieName(provider: OAuthLoginProvider) {
  return `formos_${provider}_auth_state`;
}
