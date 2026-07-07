import "server-only";

import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { getAppRedirectUrl } from "@/lib/app-url";
import {
  loginWithOAuthProfile,
  type NormalizedOAuthProfile,
} from "@/lib/auth/oauth-login";
import {
  oauthNextPathFromRequest,
  oauthStateCookieName,
} from "@/lib/auth/oauth-flow";
import {
  createOAuthState,
  readOAuthState,
  type OAuthLoginProvider,
} from "@/lib/auth/oauth-state";

const STATE_COOKIE_MAX_AGE_SECONDS = 10 * 60;
const LOGIN_SUCCESS_REDIRECT =
  "/verify-login?success=We%20sent%20a%20login%20code%20to%20your%20email%20address.";

function redirectToLogin(message: string) {
  return NextResponse.redirect(
    getAppRedirectUrl(`/login?error=${encodeURIComponent(message)}`),
    { status: 303 },
  );
}

/**
 * Shared entry point for a social-login route: signs OAuth state, stores it in a
 * short-lived cookie, and redirects to the provider. `sameSite: "none"` is used
 * for Apple, whose callback is a cross-site POST that a lax cookie would drop.
 */
export async function beginOAuthLogin(
  request: NextRequest,
  {
    provider,
    providerLabel,
    buildAuthUrl,
    sameSite = "lax",
  }: {
    provider: OAuthLoginProvider;
    providerLabel: string;
    buildAuthUrl: (state: string) => string | null;
    sameSite?: "lax" | "none";
  },
) {
  const state = createOAuthState(provider, oauthNextPathFromRequest(request));
  const authUrl = buildAuthUrl(state);

  if (!authUrl) {
    return NextResponse.redirect(
      getAppRedirectUrl(
        `/login?error=${encodeURIComponent(`${providerLabel} login is not configured.`)}`,
      ),
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(oauthStateCookieName(provider), state, {
    httpOnly: true,
    sameSite,
    secure: sameSite === "none" ? true : process.env.NODE_ENV === "production",
    maxAge: STATE_COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });

  return NextResponse.redirect(authUrl);
}

/**
 * Shared handler for a social-login callback: verifies the state cookie, exchanges
 * the code, loads the profile, and starts login verification.
 */
export async function completeOAuthCallback({
  provider,
  providerLabel,
  code,
  state,
  appleUserPayload,
  exchange,
  getProfile,
}: {
  provider: OAuthLoginProvider;
  providerLabel: string;
  code: string | null;
  state: string | null;
  appleUserPayload?: string | null;
  exchange: (code: string) => Promise<string>;
  getProfile: (
    token: string,
    appleUserPayload?: string | null,
  ) => Promise<NormalizedOAuthProfile> | NormalizedOAuthProfile;
}) {
  const cookieStore = await cookies();
  const cookieName = oauthStateCookieName(provider);
  const expectedState = cookieStore.get(cookieName)?.value;

  cookieStore.delete(cookieName);

  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectToLogin(`${providerLabel} login could not be verified.`);
  }

  const statePayload = readOAuthState(state);

  if (!statePayload || statePayload.provider !== provider) {
    return redirectToLogin(`${providerLabel} login could not be verified.`);
  }

  try {
    const token = await exchange(code);
    const profile = await getProfile(token, appleUserPayload);
    await loginWithOAuthProfile(profile, statePayload.nextPath);
  } catch (error) {
    return redirectToLogin(
      error instanceof Error && error.message.includes("email")
        ? error.message
        : `${providerLabel} login failed. Please try again.`,
    );
  }

  return NextResponse.redirect(getAppRedirectUrl(LOGIN_SUCCESS_REDIRECT), {
    status: 303,
  });
}
