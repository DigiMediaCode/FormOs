import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getAppRedirectUrl } from "@/lib/app-url";
import { loginWithOAuthProfile } from "@/lib/auth/oauth-login";
import {
  exchangeGoogleAuthCode,
  getGoogleProfile,
} from "@/lib/auth/oauth-providers/google";
import { readOAuthState } from "@/lib/auth/oauth-state";

const OAUTH_STATE_COOKIE = "formos_google_auth_state";

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
    return redirectToLogin("Google login could not be verified.");
  }

  const statePayload = readOAuthState(state);

  if (!statePayload || statePayload.provider !== "google") {
    return redirectToLogin("Google login could not be verified.");
  }

  try {
    const accessToken = await exchangeGoogleAuthCode(code);
    const profile = await getGoogleProfile(accessToken);
    await loginWithOAuthProfile(profile);
  } catch (error) {
    return redirectToLogin(
      error instanceof Error && error.message.includes("email")
        ? error.message
        : "Google login failed. Please try again.",
    );
  }

  return NextResponse.redirect(
    getAppRedirectUrl(
      "/verify-login?success=We%20sent%20a%20login%20code%20to%20your%20email%20address.",
    ),
    { status: 303 },
  );
}
