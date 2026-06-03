import "server-only";

import type { NormalizedOAuthProfile } from "@/lib/auth/oauth-login";

const LARK_AUTH_URL = "https://accounts.larksuite.com/open-apis/authen/v1/authorize";
const LARK_TOKEN_URL = "https://open.larksuite.com/open-apis/authen/v2/oauth/token";
const LARK_USER_INFO_URL = "https://open.larksuite.com/open-apis/authen/v1/user_info";

type LarkTokenResponse = {
  code?: number | string;
  msg?: string;
  error?: string;
  error_description?: string;
  access_token?: string;
  data?: {
    access_token?: string;
  };
};

type LarkUserInfoResponse = {
  code?: number | string;
  msg?: string;
  data?: {
    user_id?: string;
    open_id?: string;
    union_id?: string;
    email?: string;
    enterprise_email?: string;
    name?: string;
    en_name?: string;
    avatar_url?: string;
    avatar_thumb?: string;
  };
};

function getLarkSsoConfig() {
  const appId = process.env.LARK_SSO_APP_ID;
  const appSecret = process.env.LARK_SSO_APP_SECRET;
  const redirectUri = process.env.LARK_SSO_REDIRECT_URI;

  if (!appId || !appSecret || !redirectUri) {
    return null;
  }

  return {
    appId,
    appSecret,
    redirectUri,
  };
}

function isSuccessCode(code: number | string | undefined) {
  return code === undefined || code === 0 || code === "0";
}

function splitName(name: string | null) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] ?? null,
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : null,
  };
}

export function getLarkLoginUrl(state: string) {
  const config = getLarkSsoConfig();

  if (!config) {
    return null;
  }

  const params = new URLSearchParams({
    client_id: config.appId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    state,
  });

  return `${LARK_AUTH_URL}?${params.toString()}`;
}

export async function exchangeLarkSsoCode(code: string) {
  const config = getLarkSsoConfig();

  if (!config) {
    throw new Error("Lark login is not configured.");
  }

  const response = await fetch(LARK_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: config.appId,
      client_secret: config.appSecret,
      code,
      redirect_uri: config.redirectUri,
    }),
  });
  const payload = (await response.json()) as LarkTokenResponse;
  const accessToken = payload.data?.access_token ?? payload.access_token;

  if (!response.ok || !isSuccessCode(payload.code) || !accessToken) {
    console.warn("[formos:oauth-lark] Token exchange failed safely.", {
      status: response.status,
      code: payload.code,
      error: payload.error,
      message: payload.error_description || payload.msg,
    });
    throw new Error("Lark login failed.");
  }

  return accessToken;
}

export async function getLarkProfile(
  accessToken: string,
): Promise<NormalizedOAuthProfile> {
  const response = await fetch(LARK_USER_INFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const payload = (await response.json()) as LarkUserInfoResponse;
  const data = payload.data;
  const providerUserId = data?.union_id ?? data?.open_id ?? data?.user_id;
  const email = data?.email ?? data?.enterprise_email;
  const name = data?.name ?? data?.en_name ?? null;
  const nameParts = splitName(name);

  if (!response.ok || !isSuccessCode(payload.code) || !providerUserId || !email) {
    console.warn("[formos:oauth-lark] User info request failed safely.", {
      status: response.status,
      code: payload.code,
      message: payload.msg,
      hasProviderUserId: Boolean(providerUserId),
      hasEmail: Boolean(email),
    });
    throw new Error("We could not access your email. Please use email/password login.");
  }

  return {
    provider: "lark",
    providerUserId,
    email,
    name,
    firstName: nameParts.firstName,
    lastName: nameParts.lastName,
    avatarUrl: data?.avatar_url ?? data?.avatar_thumb ?? null,
  };
}
