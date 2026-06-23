import "server-only";

import { getAppUrl } from "@/lib/app-url";
import { sendEmail } from "@/lib/email/send-email";
import { renderEmailTemplate } from "@/lib/email/templates";

type BillingEmailUser = {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
};

function displayName(user: BillingEmailUser) {
  return user.name || [user.firstName, user.lastName].filter(Boolean).join(" ") || "";
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
}

function logNotificationWarning(message: string, details?: Record<string, unknown>) {
  console.warn("[formos:billing-notifications]", message, details ?? {});
}

export async function sendPaymentFailedNotification(input: {
  user: BillingEmailUser;
  planName: string;
  restoreUntil: Date;
}) {
  try {
    const userName = displayName(input.user);
    const billingLink = `${getAppUrl()}/dashboard/settings/billing`;
    const variables = {
      firstName: input.user.firstName || "",
      lastName: input.user.lastName || "",
      userName,
      userEmail: input.user.email,
      planName: input.planName,
      billingLink,
      restoreUntil: formatDate(input.restoreUntil),
    };
    const email = await renderEmailTemplate({
      key: "payment_failed",
      variables,
      fallback: {
        subject: "Action needed: update your FormOS billing details",
        text: [
          userName ? `Hi ${userName},` : "Hi,",
          "",
          `We could not collect payment for your ${input.planName} plan.`,
          "Your account has been moved to Free plan limits until billing is restored.",
          "",
          `Restore your plan: ${billingLink}`,
          "",
          `Please update your billing details by ${variables.restoreUntil} to continue using paid features.`,
          "Your existing forms and submissions have not been deleted.",
        ].join("\n"),
      },
    });

    await sendEmail({
      to: input.user.email,
      ...email,
    });
  } catch (error) {
    logNotificationWarning("Payment failed email failed safely.", {
      error: error instanceof Error ? error.message : "Unknown notification error",
    });
  }
}
