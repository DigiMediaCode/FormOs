import "server-only";

import type { SendEmailInput, SendEmailResult } from "@/lib/email/send-email";
import { getLarkMailUserAccessToken } from "@/lib/integrations/lark-mail/client";

const LARK_BASE_URL = "https://open.larksuite.com/open-apis";

type LarkSendResponse = {
  code?: number;
  msg?: string;
};

function logLarkWarning(message: string, details?: Record<string, unknown>) {
  console.warn("[formos:lark-email]", message, details ?? {});
}

function getLarkConfig() {
  const senderEmail = process.env.LARK_SENDER_EMAIL;
  const userAccessToken = process.env.LARK_USER_ACCESS_TOKEN;

  if (!senderEmail) {
    return null;
  }

  return {
    senderEmail,
    userAccessToken,
  };
}

function mailAddress(email: string) {
  return {
    mail_address: email,
  };
}

function attachmentFor(input: NonNullable<SendEmailInput["attachments"]>[number]) {
  return {
    body: input.content.toString("base64url"),
    filename: input.fileName,
    is_inline: false,
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

  const accessToken =
    config.userAccessToken || (await getLarkMailUserAccessToken());

  if (!accessToken) {
    logLarkWarning(
      "Lark Mail sender is not connected. Connect Lark Mail in Settings / Integrations.",
      {
        senderEmail: config.senderEmail,
      },
    );
    return {
      ok: false,
      provider: "lark",
      error: "Lark Mail sender is not connected.",
    };
  }

  const response = await fetch(
    `${LARK_BASE_URL}/mail/v1/user_mailboxes/${encodeURIComponent(config.senderEmail)}/messages/send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        subject: input.subject,
        to: [mailAddress(input.to)],
        head_from: mailAddress(config.senderEmail),
        body_plain_text: input.text,
        body_html: input.html,
        attachments: input.attachments?.map(attachmentFor),
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
