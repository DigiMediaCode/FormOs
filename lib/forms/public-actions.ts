"use server";

import { FormStatus, Prisma } from "@prisma/client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DISPLAY_ONLY_FIELD_TYPES, normalizeFormFields, type FormBuilderField } from "@/lib/forms/fields";
import {
  ensureDriveFolder,
  ensureFormOSRootFolder,
  getGoogleDriveClientForUser,
  hasGoogleDriveIntegration,
  uploadFileToDrive,
  type GoogleDriveFileMetadata,
} from "@/lib/integrations/google-drive/client";
import { prisma } from "@/lib/prisma";

const SIGNATURE_FIELD_TYPES = ["signature", "initials"];
const UPLOAD_FIELD_TYPES = ["image_upload"];
const MAX_SIGNATURE_DATA_URL_LENGTH = 750_000;
const MAX_UPLOAD_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_UPLOAD_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
const SUPPORTED_INPUT_FIELD_TYPES = [
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

const DEFAULT_SUCCESS_MESSAGE = "Thank you. Your response has been submitted.";

type PublicFormSettings = {
  submitButtonText?: string;
  successMessage?: string;
};

type PublicFormSnapshot = {
  id: string;
  title: string;
  description: string | null;
  mode: string;
  version: number;
  fields: FormBuilderField[];
  settings: PublicFormSettings | null;
};

type PublicFormView = PublicFormSnapshot & {
  uploadsAvailable: boolean;
};

type UploadRequest = {
  fieldId: string;
  label: string;
  file: File;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeSettings(settings: unknown): PublicFormSettings | null {
  if (!isRecord(settings)) {
    return null;
  }

  return {
    submitButtonText:
      typeof settings.submitButtonText === "string" ? settings.submitButtonText : undefined,
    successMessage:
      typeof settings.successMessage === "string" ? settings.successMessage : undefined,
  };
}

function buildSnapshot(form: {
  id: string;
  title: string;
  description: string | null;
  mode: string;
  version: number;
  fields: unknown;
  settings: unknown;
}): PublicFormSnapshot {
  return {
    id: form.id,
    title: form.title,
    description: form.description,
    mode: form.mode,
    version: form.version,
    fields: normalizeFormFields(form.fields),
    settings: normalizeSettings(form.settings),
  };
}

function successMessageFor(settings: PublicFormSettings | null) {
  return settings?.successMessage?.trim() || DEFAULT_SUCCESS_MESSAGE;
}

function errorRedirect(formId: string, message: string): never {
  redirect(`/f/${formId}?error=${encodeURIComponent(message)}`);
}

function isInputField(field: FormBuilderField) {
  return SUPPORTED_INPUT_FIELD_TYPES.includes(field.type);
}

function isIgnoredForSubmission(field: FormBuilderField) {
  return DISPLAY_ONLY_FIELD_TYPES.includes(field.type);
}

function isSignatureField(field: FormBuilderField) {
  return SIGNATURE_FIELD_TYPES.includes(field.type);
}

function isUploadField(field: FormBuilderField) {
  return UPLOAD_FIELD_TYPES.includes(field.type);
}

function isImageDataUrl(value: string) {
  return (
    value.startsWith("data:image/png;base64,") &&
    value.length <= MAX_SIGNATURE_DATA_URL_LENGTH
  );
}

function readSubmissionValue(field: FormBuilderField, formData: FormData) {
  if (field.type === "checkbox") {
    return formData.get(field.id) === "on";
  }

  return String(formData.get(field.id) ?? "").trim();
}

function getIpAddress(headerStore: Headers) {
  const forwardedFor = headerStore.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }

  return headerStore.get("x-real-ip");
}

function isSubmittedFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

function validateUploadFile(field: FormBuilderField, file: File) {
  if (!ALLOWED_UPLOAD_MIME_TYPES.includes(file.type)) {
    return `${field.label || "Uploaded file"} must be a JPG, PNG, WebP, or PDF file.`;
  }

  if (file.size > MAX_UPLOAD_FILE_SIZE) {
    return `${field.label || "Uploaded file"} must be 10MB or smaller.`;
  }

  return null;
}

function logUploadDiagnostic(message: string, details?: Record<string, unknown>) {
  console.info("[formos:upload]", message, details ?? {});
}

function logUploadError(message: string, details?: Record<string, unknown>) {
  console.error("[formos:upload]", message, details ?? {});
}

export async function getPublishedFormForPublicView(formId: string) {
  const form = await prisma.form.findUnique({
    where: {
      id: formId,
    },
    select: {
      id: true,
      title: true,
      description: true,
      mode: true,
      version: true,
      status: true,
      fields: true,
      settings: true,
      ownerId: true,
    },
  });

  if (!form || form.status !== FormStatus.PUBLISHED) {
    return null;
  }

  const snapshot = buildSnapshot(form);

  return {
    ...snapshot,
    uploadsAvailable: await hasGoogleDriveIntegration(form.ownerId),
  } satisfies PublicFormView;
}

export async function submitPublicForm(formId: string, formData: FormData) {
  const form = await prisma.form.findUnique({
    where: {
      id: formId,
    },
    select: {
      id: true,
      ownerId: true,
      title: true,
      description: true,
      mode: true,
      version: true,
      status: true,
      fields: true,
      settings: true,
    },
  });

  if (!form || form.status !== FormStatus.PUBLISHED) {
    errorRedirect(formId, "This form is not available.");
  }

  const formSnapshot = buildSnapshot(form);
  const submittedData: Record<string, string | boolean> = {};
  const submittedSignatures: Record<string, string> = {};
  const uploadRequests: UploadRequest[] = [];
  const uploadsAvailable = await hasGoogleDriveIntegration(form.ownerId);

  logUploadDiagnostic("Public form upload availability checked.", {
    formId: form.id,
    uploadFieldsEnabled: uploadsAvailable,
  });

  for (const field of formSnapshot.fields) {
    if (isSignatureField(field)) {
      const value = String(formData.get(field.id) ?? "").trim();

      if (field.required && !value) {
        errorRedirect(form.id, `${field.label || "Signature"} is required.`);
      }

      if (value) {
        if (!isImageDataUrl(value)) {
          errorRedirect(form.id, `${field.label || "Signature"} is invalid.`);
        }

        submittedSignatures[field.id] = value;
      }

      continue;
    }

    if (isUploadField(field)) {
      const value = formData.get(field.id);
      const hasFile = isSubmittedFile(value);

      if (!uploadsAvailable && field.required) {
        errorRedirect(
          form.id,
          `${field.label || "File upload"} is required, but uploads are unavailable for this form.`,
        );
      }

      if (!hasFile) {
        if (field.required) {
          errorRedirect(form.id, `${field.label || "File upload"} is required.`);
        }

        continue;
      }

      if (!uploadsAvailable) {
        errorRedirect(
          form.id,
          `${field.label || "File upload"} cannot be uploaded because Google Drive is not connected.`,
        );
      }

      const validationError = validateUploadFile(field, value);

      if (validationError) {
        logUploadDiagnostic("Rejected invalid upload before Google Drive request.", {
          fieldId: field.id,
          fieldLabel: field.label || "Uploaded file",
          fileName: value.name,
          mimeType: value.type,
          size: value.size,
          reason: validationError,
        });
        errorRedirect(form.id, validationError);
      }

      logUploadDiagnostic("Accepted upload for Google Drive transfer.", {
        fieldId: field.id,
        fieldLabel: field.label || "Uploaded file",
        fileName: value.name,
        mimeType: value.type,
        size: value.size,
      });

      uploadRequests.push({
        fieldId: field.id,
        label: field.label || "Uploaded file",
        file: value,
      });

      continue;
    }

    if (isIgnoredForSubmission(field)) {
      continue;
    }

    if (!isInputField(field)) {
      continue;
    }

    const value = readSubmissionValue(field, formData);

    if (field.required) {
      if (field.type === "checkbox" && value !== true) {
        errorRedirect(form.id, `${field.label || "A required field"} is required.`);
      }

      if (field.type !== "checkbox" && value === "") {
        errorRedirect(form.id, `${field.label || "A required field"} is required.`);
      }
    }

    submittedData[field.id] = value;
  }

  const headerStore = await headers();
  const successMessage = successMessageFor(formSnapshot.settings);

  const submission = await prisma.formSubmission.create({
    data: {
      formId: form.id,
      ownerId: form.ownerId,
      formVersion: form.version,
      formSnapshot: formSnapshot as unknown as Prisma.InputJsonValue,
      data: submittedData,
      signatures: submittedSignatures,
      metadata: {
        userAgent: headerStore.get("user-agent"),
        ipAddress: getIpAddress(headerStore),
        submittedAt: new Date().toISOString(),
      },
    },
  });

  if (uploadRequests.length > 0) {
    const driveClient = await getGoogleDriveClientForUser(form.ownerId);

    if (!driveClient) {
      await prisma.formSubmission.delete({
        where: {
          id: submission.id,
        },
      });
      errorRedirect(
        form.id,
        "Uploads are unavailable because Google Drive is not connected.",
      );
    }

    try {
      logUploadDiagnostic("Preparing Google Drive folders for submission uploads.", {
        formId: form.id,
        submissionId: submission.id,
        uploadCount: uploadRequests.length,
      });

      const rootFolderId = await ensureFormOSRootFolder(driveClient);
      const formFolderId = await ensureDriveFolder(
        driveClient,
        form.title,
        rootFolderId,
      );
      const submissionFolderId = await ensureDriveFolder(
        driveClient,
        `submission-${submission.id}`,
        formFolderId,
      );
      const uploadedFiles: Record<string, GoogleDriveFileMetadata[]> = {};

      logUploadDiagnostic("Google Drive upload folders ready.", {
        formId: form.id,
        submissionId: submission.id,
        rootFolderId,
        formFolderId,
        submissionFolderId,
      });

      for (const uploadRequest of uploadRequests) {
        logUploadDiagnostic("Starting Google Drive file upload.", {
          formId: form.id,
          submissionId: submission.id,
          fieldId: uploadRequest.fieldId,
          fieldLabel: uploadRequest.label,
          fileName: uploadRequest.file.name,
          mimeType: uploadRequest.file.type,
          size: uploadRequest.file.size,
          targetFolderId: submissionFolderId,
        });

        const uploadedFile = await uploadFileToDrive(driveClient, {
          file: uploadRequest.file,
          fileName: uploadRequest.file.name,
          mimeType: uploadRequest.file.type,
          parentFolderId: submissionFolderId,
        });

        uploadedFiles[uploadRequest.fieldId] = [
          ...(uploadedFiles[uploadRequest.fieldId] ?? []),
          uploadedFile,
        ];
      }

      await prisma.formSubmission.update({
        where: {
          id: submission.id,
        },
        data: {
          files: uploadedFiles as unknown as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      logUploadError("Google Drive upload failed; deleting partial submission.", {
        formId: form.id,
        submissionId: submission.id,
        uploadCount: uploadRequests.length,
        errorMessage: error instanceof Error ? error.message : "Unknown upload error",
      });
      await prisma.formSubmission.delete({
        where: {
          id: submission.id,
        },
      });
      errorRedirect(
        form.id,
        "File upload failed. Please contact the form owner.",
      );
    }
  }

  redirect(`/f/${form.id}?success=${encodeURIComponent(successMessage)}`);
}
