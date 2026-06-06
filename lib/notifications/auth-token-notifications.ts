import "server-only";

import { getAppUrl } from "@/lib/app-url";
import { sendEmail } from "@/lib/email/send-email";
import { renderEmailTemplate } from "@/lib/email/templates";

function logAuthEmailWarning(message: string, details?: Record<string, unknown>) {
  console.warn("[formos:auth-email]", message, details ?? {});
}

export async function sendEmailVerificationEmail(input: {
  email: string;
  name?: string | null;
  rawToken: string;
}) {
  try {
    const verifyLink = `${getAppUrl()}/verify-email?token=${encodeURIComponent(input.rawToken)}`;
    const email = await renderEmailTemplate({
      key: "email_verification",
      variables: {
        userName: input.name || "",
        userEmail: input.email,
        verificationLink: verifyLink,
      },
      fallback: {
        subject: "Verify your FormOS email address",
        text: [
          input.name ? `Hi ${input.name},` : "Hi,",
          "",
          "Please verify your FormOS email address using the link below.",
          verifyLink,
          "",
          "This link expires in 24 hours.",
          "If you did not create a FormOS account, you can ignore this email.",
        ].join("\n"),
      },
    });

    await sendEmail({
      to: input.email,
      ...email,
    });
  } catch (error) {
    logAuthEmailWarning("Verification email failed safely.", {
      error: error instanceof Error ? error.message : "Unknown email error",
    });
  }
}

export async function sendPasswordResetEmail(input: {
  email: string;
  rawToken: string;
}) {
  try {
    const resetLink = `${getAppUrl()}/reset-password?token=${encodeURIComponent(input.rawToken)}`;
    const email = await renderEmailTemplate({
      key: "password_reset",
      variables: {
        userEmail: input.email,
        resetLink,
      },
      fallback: {
        subject: "Reset your FormOS password",
        text: [
          "A password reset was requested for your FormOS account.",
          "",
          "Reset your password using the link below:",
          resetLink,
          "",
          "This link expires in 1 hour.",
          "If you did not request this, you can ignore this email.",
        ].join("\n"),
      },
    });

    await sendEmail({
      to: input.email,
      ...email,
    });
  } catch (error) {
    logAuthEmailWarning("Password reset email failed safely.", {
      error: error instanceof Error ? error.message : "Unknown email error",
    });
  }
}
