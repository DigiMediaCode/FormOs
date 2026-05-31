import "server-only";

import { getAppUrl } from "@/lib/app-url";
import { sendEmail } from "@/lib/email/send-email";

function logNotificationWarning(message: string, details?: Record<string, unknown>) {
  console.warn("[formos:notifications]", message, details ?? {});
}

export async function sendSignupNotification(user: {
  name: string | null;
  email: string;
}) {
  try {
    const dashboardLink = `${getAppUrl()}/dashboard`;
    const greeting = user.name ? `Hi ${user.name},` : "Hi,";

    await sendEmail({
      to: user.email,
      subject: "Welcome to FormOS",
      text: [
        greeting,
        "",
        "Welcome to FormOS. Your account is ready.",
        `Account email: ${user.email}`,
        `Dashboard: ${dashboardLink}`,
      ].join("\n"),
    });
  } catch (error) {
    logNotificationWarning("Signup notification failed safely.", {
      error: error instanceof Error ? error.message : "Unknown notification error",
    });
  }
}

export async function sendLoginNotification(user: { email: string }) {
  try {
    await sendEmail({
      to: user.email,
      subject: "New login to your FormOS account",
      text: [
        `Account email: ${user.email}`,
        `Login time: ${new Date().toISOString()}`,
        "",
        "If this was you, no action is needed. If this was not you, please secure your account.",
      ].join("\n"),
    });
  } catch (error) {
    logNotificationWarning("Login notification failed safely.", {
      error: error instanceof Error ? error.message : "Unknown notification error",
    });
  }
}
