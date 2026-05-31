"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isOfficeField, normalizeFormFields, type FormBuilderField } from "@/lib/forms/fields";
import { sendCompletedSubmissionPdfNotifications } from "@/lib/notifications/form-notifications";
import { generateCompletedSubmissionPdf } from "@/lib/pdf/completed-submission";
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

    await sendCompletedSubmissionPdfNotifications({
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
  } catch (error) {
    logOfficeWarning("Completed PDF generation or email failed safely.", {
      formId,
      submissionId,
      error: error instanceof Error ? error.message : "Unknown PDF/email error",
    });
  }

  revalidatePath(detailPath);
  redirect(`${detailPath}?success=Office work marked completed.`);
}
