"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isOfficeField, normalizeFormFields, type FormBuilderField } from "@/lib/forms/fields";
import { createSubmissionEvent } from "@/lib/forms/submission-events";
import { sendCompletedSubmissionPdfNotifications } from "@/lib/notifications/form-notifications";
import { generateCompletedSubmissionPdf } from "@/lib/pdf/completed-submission";
import { assertCanGeneratePdf } from "@/lib/plans/limits";
import { prisma } from "@/lib/prisma";

const OFFICE_SUPPORTED_FIELD_TYPES = [
  "text",
  "textarea",
  "date",
  "phone",
  "email",
  "address",
  "number",
  "currency",
  "select",
  "checkbox",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

function readOfficeValue(field: FormBuilderField, formData: FormData) {
  if (field.type === "checkbox") {
    return formData.get(field.id) === "on";
  }

  return String(formData.get(field.id) ?? "").trim();
}

function normalizeExistingOfficeData(value: unknown) {
  return isRecord(value) ? value : {};
}

function logOfficeWarning(message: string, details?: Record<string, unknown>) {
  console.warn("[formos:office]", message, details ?? {});
}

export async function saveOfficeFields(
  formId: string,
  submissionId: string,
  formData: FormData,
) {
  const user = await requireCurrentUser();
  const submission = await prisma.formSubmission.findFirst({
    where: {
      id: submissionId,
      formId,
      ownerId: user.id,
    },
    select: {
      id: true,
      formSnapshot: true,
      officeData: true,
    },
  });

  if (!submission) {
    notFound();
  }

  const snapshot = isRecord(submission.formSnapshot) ? submission.formSnapshot : {};
  const fields = normalizeFormFields(snapshot.fields);
  const nextOfficeData: Record<string, string | boolean> = {};

  for (const field of fields.filter(isOfficeField)) {
    if (!OFFICE_SUPPORTED_FIELD_TYPES.includes(field.type)) {
      continue;
    }

    nextOfficeData[field.id] = readOfficeValue(field, formData);
  }

  await prisma.formSubmission.update({
    where: {
      id: submission.id,
    },
    data: {
      officeData: {
        ...normalizeExistingOfficeData(submission.officeData),
        ...nextOfficeData,
      } as Prisma.InputJsonValue,
    },
  });

  await createSubmissionEvent({
    submissionId: submission.id,
    formId,
    ownerId: user.id,
    type: "office_fields_saved",
    message: "Office fields saved",
  });

  const detailPath = `/dashboard/forms/${formId}/submissions/${submissionId}`;

  revalidatePath(detailPath);
  redirect(`${detailPath}?success=Office fields saved.`);
}

export async function markOfficeCompleted(formId: string, submissionId: string) {
  const user = await requireCurrentUser();
  const submission = await prisma.formSubmission.findFirst({
    where: {
      id: submissionId,
      formId,
      ownerId: user.id,
    },
    select: {
      id: true,
      formVersion: true,
      formSnapshot: true,
      data: true,
      files: true,
      signatures: true,
      officeData: true,
      officeCompletedAt: true,
      createdAt: true,
      form: {
        select: {
          title: true,
          owner: {
            select: {
              email: true,
            },
          },
        },
      },
    },
  });

  if (!submission) {
    notFound();
  }

  const detailPath = `/dashboard/forms/${formId}/submissions/${submissionId}`;

  if (submission.officeCompletedAt) {
    redirect(`${detailPath}?success=Office work is already marked completed.`);
  }

  try {
    await assertCanGeneratePdf(user.id);
  } catch (error) {
    redirect(
      `${detailPath}?error=${encodeURIComponent(
        error instanceof Error
          ? error.message
          : "Completed PDF generation is not included in your current plan.",
      )}`,
    );
  }

  const completedAt = new Date();

  const completedSubmission = await prisma.formSubmission.update({
    where: {
      id: submission.id,
    },
    data: {
      officeCompletedAt: completedAt,
      officeCompletedById: user.id,
    },
    select: {
      id: true,
      formVersion: true,
      formSnapshot: true,
      data: true,
      files: true,
      signatures: true,
      officeData: true,
      createdAt: true,
      officeCompletedAt: true,
    },
  });

  await createSubmissionEvent({
    submissionId: completedSubmission.id,
    formId,
    ownerId: user.id,
    type: "submission_finalized",
    message: "Submission finalized",
  });

  try {
    const pdf = await generateCompletedSubmissionPdf({
      formTitle: submission.form.title,
      submissionId: completedSubmission.id,
      formVersion: completedSubmission.formVersion,
      formSnapshot: completedSubmission.formSnapshot,
      data: completedSubmission.data,
      officeData: completedSubmission.officeData,
      signatures: completedSubmission.signatures,
      files: completedSubmission.files,
      submittedAt: completedSubmission.createdAt,
      completedAt: completedSubmission.officeCompletedAt,
    });

    await createSubmissionEvent({
      submissionId: completedSubmission.id,
      formId,
      ownerId: user.id,
      type: "pdf_generated",
      message: "Completed PDF generated",
    });

    const emailResult = await sendCompletedSubmissionPdfNotifications({
      ownerEmail: submission.form.owner.email,
      formTitle: submission.form.title,
      submissionId: completedSubmission.id,
      completedAt,
      formSnapshot: completedSubmission.formSnapshot,
      data: completedSubmission.data,
      pdf: {
        fileName: pdf.fileName,
        mimeType: pdf.mimeType,
        content: pdf.buffer,
      },
    });

    if (emailResult.ownerEmailSent) {
      await createSubmissionEvent({
        submissionId: completedSubmission.id,
        formId,
        ownerId: user.id,
        type: "pdf_emailed_to_owner",
        message: "Completed PDF emailed to owner",
      });
    }

    if (emailResult.ownerEmailFailed) {
      await createSubmissionEvent({
        submissionId: completedSubmission.id,
        formId,
        ownerId: user.id,
        type: "pdf_email_failed",
        message: "Completed PDF email failed",
        metadata: {
          recipientType: "owner",
        },
      });
    }

    if (emailResult.submitterEmailSent) {
      await createSubmissionEvent({
        submissionId: completedSubmission.id,
        formId,
        ownerId: user.id,
        type: "pdf_emailed_to_submitter",
        message: "Completed PDF emailed to submitter",
      });
    }

    if (emailResult.submitterEmailFailed) {
      await createSubmissionEvent({
        submissionId: completedSubmission.id,
        formId,
        ownerId: user.id,
        type: "pdf_email_failed",
        message: "Completed PDF email failed",
        metadata: {
          recipientType: "submitter",
        },
      });
    }
  } catch (error) {
    await createSubmissionEvent({
      submissionId: completedSubmission.id,
      formId,
      ownerId: user.id,
      type: "pdf_email_failed",
      message: "Completed PDF email failed",
      metadata: {
        recipientType: "all",
        errorLabel: "pdf_generation_or_email",
      },
    });

    logOfficeWarning("Completed PDF generation or email failed safely.", {
      formId,
      submissionId,
      error: error instanceof Error ? error.message : "Unknown PDF/email error",
    });
  }

  revalidatePath(detailPath);
  redirect(`${detailPath}?success=Office work marked completed.`);
}
