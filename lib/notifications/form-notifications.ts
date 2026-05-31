import "server-only";

import { getAppUrl } from "@/lib/app-url";
import { sendEmail } from "@/lib/email/send-email";
import { normalizeFormFields } from "@/lib/forms/fields";
import { extractSubmitterEmail } from "@/lib/notifications/email-detection";

function logNotificationWarning(message: string, details?: Record<string, unknown>) {
  console.warn("[formos:notifications]", message, details ?? {});
}

export async function sendNewSubmissionNotification(input: {
  ownerEmail: string;
  formId: string;
  submissionId: string;
  formTitle: string;
  submittedAt: Date;
}) {
  try {
    const submissionLink = `${getAppUrl()}/dashboard/forms/${input.formId}/submissions/${input.submissionId}`;

    await sendEmail({
      to: input.ownerEmail,
      subject: `New submission received: ${input.formTitle}`,
      text: [
        `Form: ${input.formTitle}`,
        `Submitted: ${input.submittedAt.toISOString()}`,
        `Review submission: ${submissionLink}`,
        "",
        "Log in to FormOS to review the submission and complete any office-use fields.",
      ].join("\n"),
    });
  } catch (error) {
    logNotificationWarning("New submission notification failed safely.", {
      formId: input.formId,
      submissionId: input.submissionId,
      error: error instanceof Error ? error.message : "Unknown notification error",
    });
  }
}

export async function sendFormCompletedNotification(input: {
  formTitle: string;
  completedAt: Date;
  formSnapshot: unknown;
  data: unknown;
}) {
  try {
    const snapshot =
      typeof input.formSnapshot === "object" && input.formSnapshot !== null
        ? (input.formSnapshot as { fields?: unknown })
        : {};
    const fields = normalizeFormFields(snapshot.fields);
    const submitterEmail = extractSubmitterEmail(fields, input.data);

    if (!submitterEmail) {
      logNotificationWarning("Completed notification skipped because submitter email was not found.");
      return;
    }

    await sendEmail({
      to: submitterEmail,
      subject: `Your form has been completed: ${input.formTitle}`,
      text: [
        `Form: ${input.formTitle}`,
        `Completed: ${input.completedAt.toISOString()}`,
        "",
        "The form owner has completed processing your submission.",
      ].join("\n"),
    });
  } catch (error) {
    logNotificationWarning("Completed notification failed safely.", {
      error: error instanceof Error ? error.message : "Unknown notification error",
    });
  }
}
