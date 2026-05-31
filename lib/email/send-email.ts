import "server-only";

import { sendLarkEmail } from "@/lib/email/providers/lark";

export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type SendEmailResult = {
  ok: boolean;
  provider: string;
  error?: string;
};

function logEmailWarning(message: string, details?: Record<string, unknown>) {
  console.warn("[formos:email]", message, details ?? {});
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const provider = process.env.EMAIL_PROVIDER || "lark";

  if (provider !== "lark") {
    logEmailWarning("Email provider is not supported.", { provider });
    return {
      ok: false,
      provider,
      error: "Unsupported email provider.",
    };
  }

  try {
    return await sendLarkEmail(input);
  } catch (error) {
    logEmailWarning("Email send failed safely.", {
      provider,
      error: error instanceof Error ? error.message : "Unknown email error",
    });
    return {
      ok: false,
      provider,
      error: "Email send failed.",
    };
  }
}
