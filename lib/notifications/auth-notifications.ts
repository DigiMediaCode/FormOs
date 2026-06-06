import "server-only";

import { getAppUrl } from "@/lib/app-url";
import { sendEmail } from "@/lib/email/send-email";
import { renderEmailTemplate } from "@/lib/email/templates";

function logNotificationWarning(message: string, details?: Record<string, unknown>) {
  console.warn("[formos:notifications]", message, details ?? {});
}

export async function sendSignupNotification(user: {
  name: string | null;
  email: string;
}) {
  try {
    const dashboardLink = `${getAppUrl()}/dashboard`;
    const variables = {
      userName: user.name || "",
      userEmail: user.email,
      dashboardLink,
    };
    const email = await renderEmailTemplate({
      key: "signup_welcome",
      variables,
      fallback: {
        subject: "Welcome to FormOS",
        text: [
          user.name ? `Hi ${user.name},` : "Hi,",
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

export async function sendLoginNotification(user: { email: string }) {
  try {
    const variables = {
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
