import "server-only";

import type { NormalizedOAuthProfile } from "@/lib/auth/oauth-login";

// Multi-tenant "common" authority accepts work, school, and personal accounts.
const MICROSOFT_AUTHORITY = "https://login.microsoftonline.com/common/oauth2/v2.0";
const MICROSOFT_USERINFO_URL = "https://graph.microsoft.com/oidc/userinfo";

type MicrosoftTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type MicrosoftUserInfoResponse = {
  sub?: string;
  email?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
};

function getMicrosoftAuthConfig() {
  const clientId = process.env.MICROSOFT_AUTH_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_AUTH_CLIENT_SECRET;
  const redirectUri = process.env.MICROSOFT_AUTH_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return null;
  }

  return { clientId, clientSecret, redirectUri };
}

export function isMicrosoftAuthConfigured() {
  return getMicrosoftAuthConfig() !== null;
}

export function getMicrosoftLoginUrl(state: string) {
  const config = getMicrosoftAuthConfig();

  if (!config) {
    return null;
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    response_mode: "query",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  return `${MICROSOFT_AUTHORITY}/authorize?${params.toString()}`;
}

export async function exchangeMicrosoftAuthCode(code: string) {
  const config = getMicrosoftAuthConfig();

  if (!config) {
    throw new Error("Microsoft login is not configured.");
  }

  const response = await fetch(`${MICROSOFT_AUTHORITY}/token`, {
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
  const payload = (await response.json()) as MicrosoftTokenResponse;

  if (!response.ok || !payload.access_token) {
    console.warn("[formos:oauth-microsoft] Token exchange failed safely.", {
      status: response.status,
      error: payload.error,
      message: payload.error_description,
    });
    throw new Error("Microsoft login failed.");
  }

  return payload.access_token;
}

export async function getMicrosoftProfile(
  accessToken: string,
): Promise<NormalizedOAuthProfile> {
  const response = await fetch(MICROSOFT_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const profile = (await response.json()) as MicrosoftUserInfoResponse;

  if (!response.ok || !profile.sub || !profile.email) {
    console.warn("[formos:oauth-microsoft] User info request failed safely.", {
      status: response.status,
      hasProviderUserId: Boolean(profile.sub),
      hasEmail: Boolean(profile.email),
    });
    throw new Error(
      "We could not access your email. Please use email/password login.",
    );
  }

  return {
    provider: "microsoft",
    providerUserId: profile.sub,
    email: profile.email,
    name: profile.name ?? null,
    firstName: profile.given_name ?? null,
    lastName: profile.family_name ?? null,
    avatarUrl: profile.picture ?? null,
  };
}
