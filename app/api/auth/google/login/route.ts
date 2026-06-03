import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAppRedirectUrl } from "@/lib/app-url";
import { getGoogleLoginUrl } from "@/lib/auth/oauth-providers/google";
import { createOAuthState } from "@/lib/auth/oauth-state";

const OAUTH_STATE_COOKIE = "formos_google_auth_state";

export async function GET() {
  const state = createOAuthState("google");
  const authUrl = getGoogleLoginUrl(state);

  if (!authUrl) {
    return NextResponse.redirect(
      getAppRedirectUrl("/login?error=Google%20login%20is%20not%20configured."),
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
