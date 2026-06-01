import "server-only";

import { getAppUrl } from "@/lib/app-url";
import { sendEmail } from "@/lib/email/send-email";
import { normalizeFormFields } from "@/lib/forms/fields";
import { extractSubmitterEmail } from "@/lib/notifications/email-detection";
import type { SendEmailAttachment } from "@/lib/email/send-email";

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

export async function sendCompletedSubmissionPdfNotifications(input: {
  ownerEmail: string;
  formTitle: string;
  submissionId: string;
  completedAt: Date;
  formSnapshot: unknown;
  data: unknown;
  pdf: SendEmailAttachment;
}) {
  const result = {
    ownerEmailSent: false,
    ownerEmailFailed: false,
    submitterEmailSent: false,
    submitterEmailFailed: false,
    submitterEmailSkipped: false,
  };

  try {
    await sendEmail({
      to: input.ownerEmail,
      subject: `Completed submission: ${input.formTitle}`,
      text: [
        "Your completed submission PDF is attached.",
        "",
        `Form: ${input.formTitle}`,
        `Completed: ${input.completedAt.toISOString()}`,
        `Submission ID: ${input.submissionId}`,
      ].join("\n"),
      attachments: [input.pdf],
    });
    result.ownerEmailSent = true;
  } catch (error) {
    result.ownerEmailFailed = true;
    logNotificationWarning("Completed PDF owner email failed safely.", {
      submissionId: input.submissionId,
      error: error instanceof Error ? error.message : "Unknown notification error",
    });
  }

  try {
    const snapshot =
      typeof input.formSnapshot === "object" && input.formSnapshot !== null
        ? (input.formSnapshot as { fields?: unknown })
        : {};
    const fields = normalizeFormFields(snapshot.fields);
    const submitterEmail = extractSubmitterEmail(fields, input.data);

    if (!submitterEmail) {
      result.submitterEmailSkipped = true;
      logNotificationWarning("Completed PDF submitter email skipped because submitter email was not found.", {
        submissionId: input.submissionId,
      });
      return result;
    }

    await sendEmail({
      to: submitterEmail,
      subject: `Your completed form: ${input.formTitle}`,
      text: [
        "Your completed form is attached as a PDF.",
        "",
        `Form: ${input.formTitle}`,
        `Completed: ${input.completedAt.toISOString()}`,
      ].join("\n"),
      attachments: [input.pdf],
    });
    result.submitterEmailSent = true;
  } catch (error) {
    result.submitterEmailFailed = true;
    logNotificationWarning("Completed PDF submitter email failed safely.", {
      submissionId: input.submissionId,
      error: error instanceof Error ? error.message : "Unknown notification error",
    });
  }

  return result;
}
