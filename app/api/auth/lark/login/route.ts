import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAppRedirectUrl } from "@/lib/app-url";
import { getLarkLoginUrl } from "@/lib/auth/oauth-providers/lark";
import { createOAuthState } from "@/lib/auth/oauth-state";

const OAUTH_STATE_COOKIE = "formos_lark_auth_state";

export async function GET() {
  const state = createOAuthState("lark");
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
