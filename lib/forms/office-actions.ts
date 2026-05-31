"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isOfficeField, normalizeFormFields, type FormBuilderField } from "@/lib/forms/fields";
import { sendFormCompletedNotification } from "@/lib/notifications/form-notifications";
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
      formSnapshot: true,
      data: true,
      officeCompletedAt: true,
      form: {
        select: {
          title: true,
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

  await prisma.formSubmission.update({
    where: {
      id: submission.id,
    },
    data: {
      officeCompletedAt: completedAt,
      officeCompletedById: user.id,
    },
  });

  await sendFormCompletedNotification({
    formTitle: submission.form.title,
    completedAt,
    formSnapshot: submission.formSnapshot,
    data: submission.data,
  });

  revalidatePath(detailPath);
  redirect(`${detailPath}?success=Office work marked completed.`);
}
