"use server";

import { FormMode, FormStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { isOfficeField, validateFormFields } from "@/lib/forms/fields";
import {
  assertCanCreateForm,
  assertCanUseConditionalLogic,
  assertCanUseFieldTypes,
  assertCanUseOfficeFields,
} from "@/lib/plans/limits";
import { prisma } from "@/lib/prisma";
import {
  requireWorkspaceAdminOrOwner,
  requireWorkspaceMember,
} from "@/lib/workspaces/access";

const DEFAULT_FORM_SETTINGS = {
  submitButtonText: "Submit",
  successMessage: "Thank you. Your response has been submitted.",
};

const VALID_FORM_MODES = new Set<string>(Object.values(FormMode));

function normalizeTitle(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function normalizeDescription(value: FormDataEntryValue | null) {
  const description = String(value ?? "").trim();
  return description.length > 0 ? description : null;
}

function parseFormMode(value: FormDataEntryValue | null) {
  const mode = String(value ?? FormMode.STANDARD);

  if (!VALID_FORM_MODES.has(mode)) {
    return null;
  }

  return mode as FormMode;
}

function errorRedirect(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function slugify(title: string) {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "form";
}

export async function generateUniqueSlug(ownerId: string, title: string) {
  const baseSlug = slugify(title);
  let slug = baseSlug;
  let suffix = 2;

  while (
    await prisma.form.findUnique({
      where: {
        ownerId_slug: {
          ownerId,
          slug,
        },
      },
      select: { id: true },
    })
  ) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

export async function getUserForms() {
  const context = await requireWorkspaceMember();

  return prisma.form.findMany({
    where: {
      ownerId: context.ownerId,
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      ownerId: true,
      title: true,
      slug: true,
      mode: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getUserFormById(formId: string) {
  const context = await requireWorkspaceMember();

  const form = await prisma.form.findFirst({
    where: {
      id: formId,
      ownerId: context.ownerId,
    },
    select: {
      id: true,
      ownerId: true,
      title: true,
      slug: true,
      description: true,
      mode: true,
      status: true,
      version: true,
      fields: true,
      settings: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!form) {
    notFound();
  }

  return form;
}

export async function createForm(formData: FormData) {
  const context = await requireWorkspaceAdminOrOwner();
  const title = normalizeTitle(formData.get("title"));
  const description = normalizeDescription(formData.get("description"));
  const mode = parseFormMode(formData.get("mode"));

  if (!title) {
    errorRedirect("/dashboard/forms/new", "Title is required.");
  }

  if (!mode) {
    errorRedirect("/dashboard/forms/new", "Choose a valid form mode.");
  }

  try {
    await assertCanCreateForm(context.ownerId);
  } catch (error) {
    errorRedirect(
      "/dashboard/forms/new",
      error instanceof Error ? error.message : "Unable to create form.",
    );
  }

  const form = await prisma.form.create({
    data: {
      ownerId: context.ownerId,
      title,
      slug: await generateUniqueSlug(context.ownerId, title),
      description,
      mode,
      fields: [],
      settings: DEFAULT_FORM_SETTINGS,
    },
    select: {
      id: true,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/forms");
  redirect(`/dashboard/forms/${form.id}`);
}

export async function updateForm(formId: string, formData: FormData) {
  const context = await requireWorkspaceAdminOrOwner();
  const title = normalizeTitle(formData.get("title"));
  const description = normalizeDescription(formData.get("description"));
  const mode = parseFormMode(formData.get("mode"));
  const errorPath = `/dashboard/forms/${formId}`;

  if (!title) {
    errorRedirect(errorPath, "Title is required.");
  }

  if (!mode) {
    errorRedirect(errorPath, "Choose a valid form mode.");
  }

  const existingForm = await prisma.form.findFirst({
    where: {
      id: formId,
      ownerId: context.ownerId,
    },
    select: {
      id: true,
    },
  });

  if (!existingForm) {
    notFound();
  }

  await prisma.form.update({
    where: {
      id: existingForm.id,
    },
    data: {
      title,
      description,
      mode,
    },
  });

  revalidatePath("/dashboard/forms");
  revalidatePath(errorPath);
  redirect(`${errorPath}?success=Form updated.`);
}

async function updateFormStatus(formId: string, status: FormStatus) {
  const context = await requireWorkspaceAdminOrOwner();
  const existingForm = await prisma.form.findFirst({
    where: {
      id: formId,
      ownerId: context.ownerId,
    },
    select: {
      id: true,
    },
  });

  if (!existingForm) {
    notFound();
  }

  await prisma.form.update({
    where: {
      id: existingForm.id,
    },
    data: {
      status,
    },
  });

  revalidatePath("/dashboard/forms");
  revalidatePath(`/dashboard/forms/${formId}`);
}

export async function publishForm(formId: string) {
  await updateFormStatus(formId, FormStatus.PUBLISHED);
}

export async function unpublishForm(formId: string) {
  await updateFormStatus(formId, FormStatus.DRAFT);
}

export async function archiveForm(formId: string) {
  await updateFormStatus(formId, FormStatus.ARCHIVED);
}

export async function updateFormFields(formId: string, formData: FormData) {
  const context = await requireWorkspaceAdminOrOwner();
  const errorPath = `/dashboard/forms/${formId}/builder`;
  const fieldsJson = String(formData.get("fields") ?? "");

  let parsedFields: unknown;

  try {
    parsedFields = JSON.parse(fieldsJson);
  } catch {
    errorRedirect(errorPath, "Unable to save fields. Please review the schema.");
  }

  const validation = validateFormFields(parsedFields);

  if (validation.error || !validation.fields) {
    errorRedirect(errorPath, validation.error ?? "Unable to save fields.");
  }

  try {
    await assertCanUseFieldTypes(context.ownerId, validation.fields);
    await assertCanUseConditionalLogic(context.ownerId, validation.fields);
  } catch (error) {
    errorRedirect(
      errorPath,
      error instanceof Error
        ? error.message
        : "Your current plan does not allow one or more field settings.",
    );
  }

  if (validation.fields.some(isOfficeField)) {
    try {
      await assertCanUseOfficeFields(context.ownerId);
    } catch (error) {
      errorRedirect(
        errorPath,
        error instanceof Error
          ? error.message
          : "Office Use Only fields are not included in your current plan.",
      );
    }
  }

  const existingForm = await prisma.form.findFirst({
    where: {
      id: formId,
      ownerId: context.ownerId,
    },
    select: {
      id: true,
    },
  });

  if (!existingForm) {
    notFound();
  }

  await prisma.form.update({
    where: {
      id: existingForm.id,
    },
    data: {
      fields: validation.fields as unknown as Prisma.InputJsonValue,
      version: {
        increment: 1,
      },
    },
  });

  revalidatePath("/dashboard/forms");
  revalidatePath(`/dashboard/forms/${formId}`);
  revalidatePath(errorPath);
  redirect(`${errorPath}?success=Fields saved.`);
}
