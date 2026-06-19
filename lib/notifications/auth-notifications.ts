import "server-only";

import { getAppUrl } from "@/lib/app-url";
import { sendEmail } from "@/lib/email/send-email";
import { renderEmailTemplate } from "@/lib/email/templates";

type EmailUserIdentity = {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
};

function logNotificationWarning(message: string, details?: Record<string, unknown>) {
  console.warn("[formos:notifications]", message, details ?? {});
}

function displayName(user: EmailUserIdentity) {
  return user.name || [user.firstName, user.lastName].filter(Boolean).join(" ") || "";
}

export async function sendSignupNotification(user: EmailUserIdentity) {
  try {
    const dashboardLink = `${getAppUrl()}/dashboard`;
    const userName = displayName(user);
    const variables = {
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      userName,
      userEmail: user.email,
      dashboardLink,
    };
    const email = await renderEmailTemplate({
      key: "signup_welcome",
      variables,
      fallback: {
        subject: "Welcome to FormOS",
        text: [
          userName ? `Hi ${userName},` : "Hi,",
          "",
          "Welcome to FormOS. Your account is ready.",
          `Account email: ${user.email}`,
          `Dashboard: ${dashboardLink}`,
        ].join("\n"),
      },
    });

    await sendEmail({
      to: user.email,
      ...email,
    });
  } catch (error) {
    logNotificationWarning("Signup notification failed safely.", {
      error: error instanceof Error ? error.message : "Unknown notification error",
    });
  }
}

export async function sendLoginNotification(user: EmailUserIdentity) {
  try {
    const userName = displayName(user);
    const variables = {
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      userName,
      userEmail: user.email,
      loginTime: new Date().toISOString(),
    };
    const email = await renderEmailTemplate({
      key: "login_notification",
      variables,
      fallback: {
        subject: "New login to your FormOS account",
        text: [
          `Account email: ${user.email}`,
          `Login time: ${variables.loginTime}`,
          "",
          "If this was you, no action is needed. If this was not you, please secure your account.",
        ].join("\n"),
      },
    });

    await sendEmail({
      to: user.email,
      ...email,
    });
  } catch (error) {
    logNotificationWarning("Login notification failed safely.", {
      error: error instanceof Error ? error.message : "Unknown notification error",
    });
  }
}

export async function sendLoginVerificationCode(input: {
  user: EmailUserIdentity;
  code: string;
  expiresInMinutes: number;
}) {
  try {
    const userName = displayName(input.user);
    const variables = {
      firstName: input.user.firstName || "",
      lastName: input.user.lastName || "",
      userName,
      userEmail: input.user.email,
      loginCode: input.code,
      expiresInMinutes: String(input.expiresInMinutes),
    };
    const email = await renderEmailTemplate({
      key: "login_verification_code",
      variables,
      fallback: {
        subject: "Your FormOS login code",
        text: [
          userName ? `Hi ${userName},` : "Hi,",
          "",
          "Your FormOS login code is:",
          "",
          input.code,
          "",
          `This code expires in ${input.expiresInMinutes} minutes.`,
          "If you did not try to sign in, you can ignore this email.",
        ].join("\n"),
        html: [
          `<p>${userName ? `Hi ${userName},` : "Hi,"}</p>`,
          "<p>Your FormOS login code is:</p>",
          `<p style="font-size:28px;font-weight:700;letter-spacing:8px;">${input.code}</p>`,
          `<p>This code expires in ${input.expiresInMinutes} minutes.</p>`,
          "<p>If you did not try to sign in, you can ignore this email.</p>",
        ].join(""),
      },
    });

    await sendEmail({
      to: input.user.email,
      ...email,
    });

    return true;
  } catch (error) {
    logNotificationWarning("Login verification code email failed safely.", {
      error: error instanceof Error ? error.message : "Unknown notification error",
    });

    return false;
  }
}
