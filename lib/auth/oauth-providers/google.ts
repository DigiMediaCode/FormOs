import "server-only";

import type { NormalizedOAuthProfile } from "@/lib/auth/oauth-login";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USER_INFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfoResponse = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
};

function getGoogleAuthConfig() {
  const clientId = process.env.GOOGLE_AUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_AUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_AUTH_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return null;
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
  };
}

export function getGoogleLoginUrl(state: string) {
  const config = getGoogleAuthConfig();

  if (!config) {
    return null;
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeGoogleAuthCode(code: string) {
  const config = getGoogleAuthConfig();

  if (!config) {
    throw new Error("Google login is not configured.");
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: config.redirectUri,
    }),
  });
  const payload = (await response.json()) as GoogleTokenResponse;

  if (!response.ok || !payload.access_token) {
    console.warn("[formos:oauth-google] Token exchange failed safely.", {
      status: response.status,
      error: payload.error,
      message: payload.error_description,
    });
    throw new Error("Google login failed.");
  }

  return payload.access_token;
}

export async function getGoogleProfile(
  accessToken: string,
): Promise<NormalizedOAuthProfile> {
  const response = await fetch(GOOGLE_USER_INFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const profile = (await response.json()) as GoogleUserInfoResponse;

  if (!response.ok || !profile.sub || !profile.email) {
    console.warn("[formos:oauth-google] User info request failed safely.", {
      status: response.status,
      hasProviderUserId: Boolean(profile.sub),
      hasEmail: Boolean(profile.email),
    });
    throw new Error("We could not access your email. Please use email/password login.");
  }

  return {
    provider: "google",
    providerUserId: profile.sub,
    email: profile.email,
    name: profile.name ?? null,
    firstName: profile.given_name ?? null,
    lastName: profile.family_name ?? null,
    avatarUrl: profile.picture ?? null,
  };
}
