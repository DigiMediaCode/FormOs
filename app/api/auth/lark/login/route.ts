import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getAppRedirectUrl } from "@/lib/app-url";
import { getLarkLoginUrl } from "@/lib/auth/oauth-providers/lark";
import { createOAuthState } from "@/lib/auth/oauth-state";

const OAUTH_STATE_COOKIE = "formos_lark_auth_state";

function safeSlug(value: string | null) {
  return value && /^[a-z0-9-]+$/.test(value) ? value.toLowerCase() : "";
}

function nextPathFromRequest(request: NextRequest) {
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

export async function GET(request: NextRequest) {
  const state = createOAuthState("lark", nextPathFromRequest(request));
  const authUrl = getLarkLoginUrl(state);

  if (!authUrl) {
    return NextResponse.redirect(
      getAppRedirectUrl("/login?error=Lark%20login%20is%20not%20configured."),
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60,
    path: "/",
  });

  return NextResponse.redirect(authUrl);
}
