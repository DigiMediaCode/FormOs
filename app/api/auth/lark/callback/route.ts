import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getAppRedirectUrl } from "@/lib/app-url";
import { loginWithOAuthProfile } from "@/lib/auth/oauth-login";
import {
  exchangeLarkSsoCode,
  getLarkProfile,
} from "@/lib/auth/oauth-providers/lark";
import { readOAuthState } from "@/lib/auth/oauth-state";

const OAUTH_STATE_COOKIE = "formos_lark_auth_state";

function redirectToLogin(message: string) {
  return NextResponse.redirect(
    getAppRedirectUrl(`/login?error=${encodeURIComponent(message)}`),
    { status: 303 },
  );
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;

  cookieStore.delete(OAUTH_STATE_COOKIE);

  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectToLogin("Lark login could not be verified.");
  }

  const statePayload = readOAuthState(state);

  if (!statePayload || statePayload.provider !== "lark") {
    return redirectToLogin("Lark login could not be verified.");
  }

  try {
    const accessToken = await exchangeLarkSsoCode(code);
    const profile = await getLarkProfile(accessToken);
    await loginWithOAuthProfile(profile);
  } catch (error) {
    return redirectToLogin(
      error instanceof Error && error.message.includes("email")
        ? error.message
        : "Lark login failed. Please try again.",
    );
  }

  return NextResponse.redirect(getAppRedirectUrl("/dashboard"), { status: 303 });
}
