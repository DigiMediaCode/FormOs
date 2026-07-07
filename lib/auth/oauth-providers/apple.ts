import "server-only";

import { createPrivateKey, sign as cryptoSign } from "crypto";
import type { NormalizedOAuthProfile } from "@/lib/auth/oauth-login";

const APPLE_AUTH_URL = "https://appleid.apple.com/auth/authorize";
const APPLE_TOKEN_URL = "https://appleid.apple.com/auth/token";
const APPLE_AUDIENCE = "https://appleid.apple.com";
// Apple client secrets can live up to 6 months; we mint a short-lived one per request.
const CLIENT_SECRET_TTL_SECONDS = 5 * 60;

type AppleTokenResponse = {
  id_token?: string;
  error?: string;
};

type AppleIdTokenClaims = {
  sub?: string;
  email?: string;
  email_verified?: boolean | string;
};

type AppleUserPayload = {
  name?: {
    firstName?: string;
    lastName?: string;
  };
};

function getAppleAuthConfig() {
  const clientId = process.env.APPLE_AUTH_CLIENT_ID;
  const teamId = process.env.APPLE_AUTH_TEAM_ID;
  const keyId = process.env.APPLE_AUTH_KEY_ID;
  const privateKey = process.env.APPLE_AUTH_PRIVATE_KEY;
  const redirectUri = process.env.APPLE_AUTH_REDIRECT_URI;

  if (!clientId || !teamId || !keyId || !privateKey || !redirectUri) {
    return null;
  }

  return {
    clientId,
    teamId,
    keyId,
    // Support single-line env values where newlines are escaped as \n.
    privateKey: privateKey.replace(/\\n/g, "\n"),
    redirectUri,
  };
}

export function isAppleAuthConfigured() {
  return getAppleAuthConfig() !== null;
}

function base64Url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

/**
 * Apple's "client secret" is an ES256-signed JWT rather than a static string.
 * We sign it with the account's .p8 private key on each token exchange.
 */
function createAppleClientSecret(
  config: NonNullable<ReturnType<typeof getAppleAuthConfig>>,
) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "ES256", kid: config.keyId, typ: "JWT" };
  const payload = {
    iss: config.teamId,
    iat: now,
    exp: now + CLIENT_SECRET_TTL_SECONDS,
    aud: APPLE_AUDIENCE,
    sub: config.clientId,
  };
  const signingInput = `${base64Url(JSON.stringify(header))}.${base64Url(
    JSON.stringify(payload),
  )}`;
  const signature = cryptoSign("sha256", Buffer.from(signingInput), {
    key: createPrivateKey(config.privateKey),
    // JOSE ES256 uses raw R||S, not DER.
    dsaEncoding: "ieee-p1363",
  });

  return `${signingInput}.${base64Url(signature)}`;
}

export function getAppleLoginUrl(state: string) {
  const config = getAppleAuthConfig();

  if (!config) {
    return null;
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "name email",
    // Requesting name/email forces Apple to POST the result back to us.
    response_mode: "form_post",
    state,
  });

  return `${APPLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeAppleAuthCode(code: string) {
  const config = getAppleAuthConfig();

  if (!config) {
    throw new Error("Apple login is not configured.");
  }

  const response = await fetch(APPLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: createAppleClientSecret(config),
      code,
      grant_type: "authorization_code",
      redirect_uri: config.redirectUri,
    }),
  });
  const payload = (await response.json()) as AppleTokenResponse;

  if (!response.ok || !payload.id_token) {
    console.warn("[formos:oauth-apple] Token exchange failed safely.", {
      status: response.status,
      error: payload.error,
    });
    throw new Error("Apple login failed.");
  }

  return payload.id_token;
}

function decodeIdTokenClaims(idToken: string): AppleIdTokenClaims | null {
  const segments = idToken.split(".");

  if (segments.length < 2 || !segments[1]) {
    return null;
  }

  try {
    return JSON.parse(
      Buffer.from(segments[1], "base64url").toString("utf8"),
    ) as AppleIdTokenClaims;
  } catch {
    return null;
  }
}

/**
 * Builds a profile from Apple's id_token. The token comes directly from Apple's
 * token endpoint over a server-side TLS request, so we trust its claims. Apple
 * only sends the user's name once, in the `user` field of the first callback.
 */
export function getAppleProfile(
  idToken: string,
  appleUserPayload?: string | null,
): NormalizedOAuthProfile {
  const claims = decodeIdTokenClaims(idToken);

  if (!claims?.sub || !claims.email) {
    console.warn("[formos:oauth-apple] id_token missing identity claims.", {
      hasProviderUserId: Boolean(claims?.sub),
      hasEmail: Boolean(claims?.email),
    });
    throw new Error(
      "We could not access your email. Please use email/password login.",
    );
  }

  let firstName: string | null = null;
  let lastName: string | null = null;

  if (appleUserPayload) {
    try {
      const parsed = JSON.parse(appleUserPayload) as AppleUserPayload;
      firstName = parsed.name?.firstName ?? null;
      lastName = parsed.name?.lastName ?? null;
    } catch {
      // Name is best-effort; identity comes from the id_token.
    }
  }

  const name = [firstName, lastName].filter(Boolean).join(" ") || null;

  return {
    provider: "apple",
    providerUserId: claims.sub,
    email: claims.email,
    name,
    firstName,
    lastName,
    avatarUrl: null,
  };
}
