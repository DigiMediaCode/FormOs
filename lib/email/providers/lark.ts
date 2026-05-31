import "server-only";

import type { SendEmailInput, SendEmailResult } from "@/lib/email/send-email";

const LARK_BASE_URL = "https://open.larksuite.com/open-apis";

type TenantTokenResponse = {
  code?: number;
  msg?: string;
  tenant_access_token?: string;
  expire?: number;
};

type LarkSendResponse = {
  code?: number;
  msg?: string;
};

let cachedTenantToken: {
  token: string;
  expiresAt: number;
} | null = null;

function logLarkWarning(message: string, details?: Record<string, unknown>) {
  console.warn("[formos:lark-email]", message, details ?? {});
}

function getLarkConfig() {
  const appId = process.env.LARK_APP_ID;
  const appSecret = process.env.LARK_APP_SECRET;
  const senderEmail = process.env.LARK_SENDER_EMAIL;

  if (!appId || !appSecret || !senderEmail) {
    return null;
  }

  return {
    appId,
    appSecret,
    senderEmail,
  };
}

async function getTenantAccessToken(config: {
  appId: string;
  appSecret: string;
}) {
  if (cachedTenantToken && cachedTenantToken.expiresAt > Date.now() + 60_000) {
    return cachedTenantToken.token;
  }

  const response = await fetch(`${LARK_BASE_URL}/auth/v3/tenant_access_token/internal`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      app_id: config.appId,
      app_secret: config.appSecret,
    }),
  });
  const body = (await response.json()) as TenantTokenResponse;

  if (!response.ok || body.code !== 0 || !body.tenant_access_token) {
    logLarkWarning("Unable to get Lark tenant token.", {
      status: response.status,
      code: body.code,
      message: body.msg,
    });
    return null;
  }

  cachedTenantToken = {
    token: body.tenant_access_token,
    expiresAt: Date.now() + Math.max((body.expire ?? 3600) - 120, 60) * 1000,
  };

  return cachedTenantToken.token;
}

function mailAddress(email: string) {
  return {
    email,
  };
}

export async function sendLarkEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const config = getLarkConfig();

  if (!config) {
    logLarkWarning("Lark email is not configured.");
    return {
      ok: false,
      provider: "lark",
      error: "Lark email is not configured.",
    };
  }

  const tenantToken = await getTenantAccessToken(config);

  if (!tenantToken) {
    return {
      ok: false,
      provider: "lark",
      error: "Unable to get Lark tenant token.",
    };
  }

  const response = await fetch(
    `${LARK_BASE_URL}/mail/v1/user_mailboxes/${encodeURIComponent(config.senderEmail)}/messages/send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tenantToken}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        subject: input.subject,
        to: [mailAddress(input.to)],
        head_from: mailAddress(config.senderEmail),
        body_plain_text: input.text,
        body_html: input.html,
      }),
    },
  );
  const body = (await response.json()) as LarkSendResponse;

  if (!response.ok || body.code !== 0) {
    logLarkWarning("Lark email API returned an error.", {
      status: response.status,
      code: body.code,
      message: body.msg,
      recipient: input.to,
    });
    return {
      ok: false,
      provider: "lark",
      error: body.msg || "Lark email API returned an error.",
    };
  }

  return {
    ok: true,
    provider: "lark",
  };
}
