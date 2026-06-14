"use server";

import { FormStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { isOfficeField, validateFormFields } from "@/lib/forms/fields";
import {
  assertCanUseConditionalLogic,
  assertCanUseFieldTypes,
  assertCanUseOfficeFields,
} from "@/lib/plans/limits";
import { prisma } from "@/lib/prisma";

const ADMIN_FORMS_PATH = "/admin/forms";

function redirectWith(type: "success" | "error", message: string): never {
  redirect(`${ADMIN_FORMS_PATH}?${type}=${encodeURIComponent(message)}`);
}

function redirectTo(path: string, type: "success" | "error", message: string): never {
  redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}

export async function archiveAdminFormAction(formId: string) {
  await requireSuperAdmin();

  await prisma.form.update({
    where: { id: formId },
    data: { status: FormStatus.ARCHIVED },
  });

  revalidatePath(ADMIN_FORMS_PATH);
  revalidatePath(`/admin/forms/${formId}`);
  redirectWith("success", "Form archived.");
}

export async function deleteAdminFormAction(formId: string) {
  await requireSuperAdmin();

  const form = await prisma.form.findUnique({
    where: { id: formId },
    select: {
      id: true,
      _count: {
        select: { submissions: true },
      },
    },
  });

  if (!form) {
    redirectWith("error", "Form not found.");
  }

  if (form._count.submissions > 0) {
    redirectWith(
      "error",
      "This form has submissions and cannot be deleted safely. Archive it instead.",
    );
  }

  await prisma.form.delete({
    where: { id: form.id },
  });

  revalidatePath(ADMIN_FORMS_PATH);
  redirectWith("success", "Form deleted.");
}

export async function updateAdminFormFieldsAction(
  formId: string,
  formData: FormData,
) {
  await requireSuperAdmin();

  const errorPath = `/admin/forms/${formId}/builder`;
  const fieldsJson = String(formData.get("fields") ?? "");

  let parsedFields: unknown;

  try {
    parsedFields = JSON.parse(fieldsJson);
  } catch {
    redirectTo(errorPath, "error", "Unable to save fields. Please review the schema.");
  }

  const validation = validateFormFields(parsedFields);

  if (validation.error || !validation.fields) {
    redirectTo(errorPath, "error", validation.error ?? "Unable to save fields.");
  }

  const existingForm = await prisma.form.findUnique({
    where: { id: formId },
    select: {
      id: true,
      ownerId: true,
    },
  });

  if (!existingForm) {
    redirectTo(errorPath, "error", "Form not found.");
  }

  try {
    await assertCanUseFieldTypes(existingForm.ownerId, validation.fields);
    await assertCanUseConditionalLogic(existingForm.ownerId, validation.fields);
  } catch (error) {
    redirectTo(
      errorPath,
      "error",
      error instanceof Error
        ? error.message
        : "The owner's current plan does not allow one or more field settings.",
    );
  }

  if (validation.fields.some(isOfficeField)) {
    try {
      await assertCanUseOfficeFields(existingForm.ownerId);
    } catch (error) {
      redirectTo(
        errorPath,
        "error",
        error instanceof Error
          ? error.message
          : "Office Use Only fields are not included in the owner's current plan.",
      );
    }
  }

  await prisma.form.update({
    where: { id: existingForm.id },
    data: {
      fields: validation.fields as unknown as Prisma.InputJsonValue,
      version: {
        increment: 1,
      },
    },
  });

  // TODO: Add admin support audit events when a dedicated admin audit helper exists.
  revalidatePath(ADMIN_FORMS_PATH);
  revalidatePath(`/admin/forms/${formId}`);
  revalidatePath(errorPath);
  redirectTo(errorPath, "success", "Fields saved by Super Admin support.");
}
