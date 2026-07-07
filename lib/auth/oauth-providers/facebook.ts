import "server-only";

import type { NormalizedOAuthProfile } from "@/lib/auth/oauth-login";

const FACEBOOK_VERSION = "v19.0";
const FACEBOOK_AUTH_URL = `https://www.facebook.com/${FACEBOOK_VERSION}/dialog/oauth`;
const FACEBOOK_TOKEN_URL = `https://graph.facebook.com/${FACEBOOK_VERSION}/oauth/access_token`;
const FACEBOOK_PROFILE_URL = `https://graph.facebook.com/${FACEBOOK_VERSION}/me`;

type FacebookTokenResponse = {
  access_token?: string;
  error?: { message?: string; type?: string; code?: number };
};

type FacebookProfileResponse = {
  id?: string;
  email?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  picture?: { data?: { url?: string } };
  error?: { message?: string };
};

function getFacebookAuthConfig() {
  const clientId = process.env.FACEBOOK_AUTH_CLIENT_ID;
  const clientSecret = process.env.FACEBOOK_AUTH_CLIENT_SECRET;
  const redirectUri = process.env.FACEBOOK_AUTH_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return null;
  }

  return { clientId, clientSecret, redirectUri };
}

export function isFacebookAuthConfigured() {
  return getFacebookAuthConfig() !== null;
}

export function getFacebookLoginUrl(state: string) {
  const config = getFacebookAuthConfig();

  if (!config) {
    return null;
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "email public_profile",
    state,
  });

  return `${FACEBOOK_AUTH_URL}?${params.toString()}`;
}

export async function exchangeFacebookAuthCode(code: string) {
  const config = getFacebookAuthConfig();

  if (!config) {
    throw new Error("Facebook login is not configured.");
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: config.redirectUri,
  });
  const response = await fetch(`${FACEBOOK_TOKEN_URL}?${params.toString()}`);
  const payload = (await response.json()) as FacebookTokenResponse;

  if (!response.ok || !payload.access_token) {
    console.warn("[formos:oauth-facebook] Token exchange failed safely.", {
      status: response.status,
      error: payload.error?.type,
      message: payload.error?.message,
    });
    throw new Error("Facebook login failed.");
  }

  return payload.access_token;
}

export async function getFacebookProfile(
  accessToken: string,
): Promise<NormalizedOAuthProfile> {
  const params = new URLSearchParams({
    fields: "id,name,email,first_name,last_name,picture",
    access_token: accessToken,
  });
  const response = await fetch(`${FACEBOOK_PROFILE_URL}?${params.toString()}`);
  const profile = (await response.json()) as FacebookProfileResponse;

  if (!response.ok || !profile.id || !profile.email) {
    console.warn("[formos:oauth-facebook] Profile request failed safely.", {
      status: response.status,
      hasProviderUserId: Boolean(profile.id),
      hasEmail: Boolean(profile.email),
    });
    throw new Error(
      "We could not access your email. Please make sure you share your email with Facebook, or use email/password login.",
    );
  }

  return {
    provider: "facebook",
    providerUserId: profile.id,
    email: profile.email,
    name: profile.name ?? null,
    firstName: profile.first_name ?? null,
    lastName: profile.last_name ?? null,
    avatarUrl: profile.picture?.data?.url ?? null,
  };
}
