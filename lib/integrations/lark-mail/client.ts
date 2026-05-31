import "server-only";

import { IntegrationProvider, Prisma } from "@prisma/client";
import {
  decryptIntegrationToken,
  encryptIntegrationToken,
} from "@/lib/integrations/tokens";
import { prisma } from "@/lib/prisma";

const LARK_AUTH_URL = "https://accounts.larksuite.com/open-apis/authen/v1/authorize";
const LARK_TOKEN_URL = "https://open.larksuite.com/open-apis/authen/v2/oauth/token";
export const LARK_MAIL_SCOPE = "offline_access mail:user_mailbox.message:send";

type LarkOAuthResponse = {
  code?: number | string;
  msg?: string;
  error?: string;
  error_description?: string;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  refresh_token_expires_in?: number;
  scope?: string;
  token_type?: string;
  data?: {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    refresh_token_expires_in?: number;
    scope?: string;
    token_type?: string;
  };
};

type NormalizedLarkToken = {
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number | null;
  refreshTokenExpiresIn: number | null;
  scope: string | null;
  tokenType: string | null;
};

function logLarkMailWarning(message: string, details?: Record<string, unknown>) {
  console.warn("[formos:lark-mail]", message, details ?? {});
}

function getLarkOAuthConfig() {
  const appId = process.env.LARK_APP_ID;
  const appSecret = process.env.LARK_APP_SECRET;
  const redirectUri = process.env.LARK_REDIRECT_URI;
  const senderEmail = process.env.LARK_SENDER_EMAIL;

  if (!appId || !appSecret || !redirectUri || !senderEmail) {
    return null;
  }

  return {
    appId,
    appSecret,
    redirectUri,
    senderEmail,
  };
}

function isSuccessCode(code: number | string | undefined) {
  return code === undefined || code === 0 || code === "0";
}

function normalizeLarkToken(response: LarkOAuthResponse): NormalizedLarkToken | null {
  const data = response.data ?? response;
  const accessToken = data.access_token;

  if (!isSuccessCode(response.code) || !accessToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken: data.refresh_token ?? null,
    expiresIn: typeof data.expires_in === "number" ? data.expires_in : null,
    refreshTokenExpiresIn:
      typeof data.refresh_token_expires_in === "number"
        ? data.refresh_token_expires_in
        : null,
    scope: data.scope ?? null,
    tokenType: data.token_type ?? null,
  };
}

async function requestLarkToken(
  body: Record<string, string>,
): Promise<NormalizedLarkToken> {
  const response = await fetch(LARK_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  });
  const tokenResponse = (await response.json()) as LarkOAuthResponse;
  const token = normalizeLarkToken(tokenResponse);

  if (!response.ok || !token) {
    logLarkMailWarning("Lark OAuth token request failed.", {
      status: response.status,
      code: tokenResponse.code,
      error: tokenResponse.error,
      message: tokenResponse.error_description || tokenResponse.msg,
      grantType: body.grant_type,
    });
    throw new Error("Unable to connect Lark Mail.");
  }

  return token;
}

function getExpiresAt(expiresIn: number | null) {
  return expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;
}

function normalizeMetadata(value: unknown) {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value
    : {};
}

export function getLarkMailAuthUrl(state: string) {
  const config = getLarkOAuthConfig();

  if (!config) {
    return null;
  }

  const params = new URLSearchParams({
    client_id: config.appId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: LARK_MAIL_SCOPE,
    state,
  });

  return `${LARK_AUTH_URL}?${params.toString()}`;
}

export async function exchangeLarkMailCode(code: string) {
  const config = getLarkOAuthConfig();

  if (!config) {
    throw new Error("Lark Mail OAuth is not configured.");
  }

  return requestLarkToken({
    grant_type: "authorization_code",
    client_id: config.appId,
    client_secret: config.appSecret,
    code,
    redirect_uri: config.redirectUri,
  });
}

async function refreshLarkMailToken(refreshToken: string) {
  const config = getLarkOAuthConfig();

  if (!config) {
    throw new Error("Lark Mail OAuth is not configured.");
  }

  return requestLarkToken({
    grant_type: "refresh_token",
    client_id: config.appId,
    client_secret: config.appSecret,
    refresh_token: refreshToken,
  });
}

export async function saveLarkMailIntegration(
  userId: string,
  token: NormalizedLarkToken,
) {
  const config = getLarkOAuthConfig();

  if (!config) {
    throw new Error("Lark Mail OAuth is not configured.");
  }

  const expiresAt = getExpiresAt(token.expiresIn);
  const metadata = {
    senderEmail: config.senderEmail,
    tokenType: token.tokenType,
    refreshTokenExpiresAt: token.refreshTokenExpiresIn
      ? new Date(Date.now() + token.refreshTokenExpiresIn * 1000).toISOString()
      : null,
    connectedAt: new Date().toISOString(),
  };

  return prisma.userIntegration.upsert({
    where: {
      userId_provider: {
        userId,
        provider: IntegrationProvider.LARK_MAIL,
      },
    },
    create: {
      userId,
      provider: IntegrationProvider.LARK_MAIL,
      accessToken: encryptIntegrationToken(token.accessToken),
      refreshToken: token.refreshToken
        ? encryptIntegrationToken(token.refreshToken)
        : null,
      expiresAt,
      scope: token.scope ?? undefined,
      metadata,
    },
    update: {
      accessToken: encryptIntegrationToken(token.accessToken),
      refreshToken: token.refreshToken
        ? encryptIntegrationToken(token.refreshToken)
        : undefined,
      expiresAt,
      scope: token.scope ?? undefined,
      metadata,
    },
  });
}

export async function getLarkMailIntegrationStatus(userId: string) {
  const integration = await prisma.userIntegration.findUnique({
    where: {
      userId_provider: {
        userId,
        provider: IntegrationProvider.LARK_MAIL,
      },
    },
    select: {
      scope: true,
      expiresAt: true,
      createdAt: true,
      updatedAt: true,
      metadata: true,
    },
  });

  if (!integration) {
    return {
      connected: false,
      senderEmail: process.env.LARK_SENDER_EMAIL ?? null,
      scope: null,
      expiresAt: null,
      connectedAt: null,
      updatedAt: null,
    };
  }

  const metadata = normalizeMetadata(integration.metadata) as {
    senderEmail?: unknown;
    connectedAt?: unknown;
  };

  return {
    connected: true,
    senderEmail:
      typeof metadata.senderEmail === "string"
        ? metadata.senderEmail
        : process.env.LARK_SENDER_EMAIL ?? null,
    scope: integration.scope,
    expiresAt: integration.expiresAt,
    connectedAt:
      typeof metadata.connectedAt === "string"
        ? new Date(metadata.connectedAt)
        : integration.createdAt,
    updatedAt: integration.updatedAt,
  };
}

export async function getLarkMailUserAccessToken() {
  const integration = await prisma.userIntegration.findFirst({
    where: {
      provider: IntegrationProvider.LARK_MAIL,
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      userId: true,
      accessToken: true,
      refreshToken: true,
      expiresAt: true,
      metadata: true,
    },
  });

  if (!integration) {
    logLarkMailWarning("Lark Mail sender is not connected.");
    return null;
  }

  const accessToken = decryptIntegrationToken(integration.accessToken);
  const refreshToken = integration.refreshToken
    ? decryptIntegrationToken(integration.refreshToken)
    : null;
  const shouldRefresh =
    integration.expiresAt !== null &&
    integration.expiresAt.getTime() <= Date.now() + 60_000;

  if (!shouldRefresh) {
    return accessToken;
  }

  if (!refreshToken) {
    logLarkMailWarning("Lark Mail sender token is expired and has no refresh token.", {
      hasRefreshToken: false,
    });
    return null;
  }

  try {
    const refreshed = await refreshLarkMailToken(refreshToken);
    const metadata = normalizeMetadata(integration.metadata);
    const expiresAt = getExpiresAt(refreshed.expiresIn);

    await prisma.userIntegration.update({
      where: {
        userId_provider: {
          userId: integration.userId,
          provider: IntegrationProvider.LARK_MAIL,
        },
      },
      data: {
        accessToken: encryptIntegrationToken(refreshed.accessToken),
        refreshToken: refreshed.refreshToken
          ? encryptIntegrationToken(refreshed.refreshToken)
          : undefined,
        expiresAt,
        scope: refreshed.scope ?? undefined,
        metadata: {
          ...metadata,
          tokenType: refreshed.tokenType,
          refreshTokenExpiresAt: refreshed.refreshTokenExpiresIn
            ? new Date(
                Date.now() + refreshed.refreshTokenExpiresIn * 1000,
              ).toISOString()
            : (metadata as { refreshTokenExpiresAt?: unknown }).refreshTokenExpiresAt ?? null,
          refreshedAt: new Date().toISOString(),
        } as Prisma.InputJsonValue,
      },
    });

    return refreshed.accessToken;
  } catch {
    logLarkMailWarning("Lark Mail sender token refresh failed.");
    return null;
  }
}

export async function disconnectLarkMail(userId: string) {
  await prisma.userIntegration.deleteMany({
    where: {
      userId,
      provider: IntegrationProvider.LARK_MAIL,
    },
  });
}
