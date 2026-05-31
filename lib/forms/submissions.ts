import "server-only";

import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  DISPLAY_ONLY_FIELD_TYPES,
  isOfficeField,
  isPublicField,
  normalizeFormFields,
  type FormBuilderField,
} from "@/lib/forms/fields";
import { sanitizeFormHtml } from "@/lib/forms/sanitize-html";
import { prisma } from "@/lib/prisma";

type SnapshotLike = {
  id?: unknown;
  title?: unknown;
  description?: unknown;
  mode?: unknown;
  version?: unknown;
  fields?: unknown;
  settings?: unknown;
};

export type SubmissionAnswer = {
  fieldId: string;
  label: string;
  type: FormBuilderField["type"];
  value: string;
  imageDataUrl?: string;
  files?: SubmissionFileMetadata[];
};

export type SubmissionFileMetadata = {
  provider: "google_drive";
  driveFileId: string;
  fileName: string;
  mimeType: string;
  size: number;
  webViewLink: string | null;
  webContentLink: string | null;
  uploadedAt: string;
  parentFolderId?: string;
  parentFolderName?: string;
  formFolderId?: string;
  formFolderName?: string;
  submissionFolderId?: string;
  submissionFolderName?: string;
};

export type OfficeFieldAnswer = {
  field: FormBuilderField;
  value: string | boolean;
  supported: boolean;
};

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

function normalizeSnapshot(value: unknown) {
  const snapshot = isRecord(value) ? (value as SnapshotLike) : {};
  return {
    id: typeof snapshot.id === "string" ? snapshot.id : "",
    title: typeof snapshot.title === "string" ? snapshot.title : "Untitled form",
    description:
      typeof snapshot.description === "string" ? snapshot.description : null,
    mode: typeof snapshot.mode === "string" ? snapshot.mode : "",
    version:
      typeof snapshot.version === "number" && Number.isFinite(snapshot.version)
        ? snapshot.version
        : 0,
    fields: normalizeFormFields(snapshot.fields),
    settings: isRecord(snapshot.settings) ? snapshot.settings : null,
  };
}

function isValidImageDataUrl(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.startsWith("data:image/png;base64,") &&
    value.length <= 750_000
  );
}

function formatAnswerValue(
  field: FormBuilderField,
  rawValue: unknown,
  rawSignatureValue: unknown,
  rawFilesValue: unknown,
) {
  if (field.type === "signature" || field.type === "initials") {
    return isValidImageDataUrl(rawSignatureValue)
      ? "Signature provided"
      : "No signature provided";
  }

  if (field.type === "image_upload") {
    const files = normalizeFileMetadataList(rawFilesValue);
    return files.length > 0
      ? `${files.length} file${files.length === 1 ? "" : "s"} uploaded`
      : "No file uploaded";
  }

  if (field.type === "checkbox") {
    return rawValue === true ? "Yes" : "No";
  }

  if (field.type === "select") {
    const value = String(rawValue ?? "");
    return field.options.find((option) => option === value) ?? value;
  }

  if (rawValue === null || rawValue === undefined || rawValue === "") {
    return "No answer";
  }

  return String(rawValue);
}

function normalizeFileMetadata(value: unknown): SubmissionFileMetadata | null {
  if (!isRecord(value)) {
    return null;
  }

  const provider = value.provider;
  const driveFileId = value.driveFileId;
  const fileName = value.fileName;
  const mimeType = value.mimeType;
  const size = value.size;

  if (
    provider !== "google_drive" ||
    typeof driveFileId !== "string" ||
    typeof fileName !== "string" ||
    typeof mimeType !== "string" ||
    typeof size !== "number"
  ) {
    return null;
  }

  return {
    provider,
    driveFileId,
    fileName,
    mimeType,
    size,
    webViewLink:
      typeof value.webViewLink === "string" ? value.webViewLink : null,
    webContentLink:
      typeof value.webContentLink === "string" ? value.webContentLink : null,
    uploadedAt:
      typeof value.uploadedAt === "string" ? value.uploadedAt : "",
    parentFolderId:
      typeof value.parentFolderId === "string" ? value.parentFolderId : undefined,
    parentFolderName:
      typeof value.parentFolderName === "string" ? value.parentFolderName : undefined,
    formFolderId:
      typeof value.formFolderId === "string" ? value.formFolderId : undefined,
    formFolderName:
      typeof value.formFolderName === "string" ? value.formFolderName : undefined,
    submissionFolderId:
      typeof value.submissionFolderId === "string"
        ? value.submissionFolderId
        : undefined,
    submissionFolderName:
      typeof value.submissionFolderName === "string"
        ? value.submissionFolderName
        : undefined,
  };
}

function normalizeFileMetadataList(value: unknown): SubmissionFileMetadata[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeFileMetadata)
    .filter((file): file is SubmissionFileMetadata => file !== null);
}

export function buildSubmissionAnswers(
  fields: FormBuilderField[],
  data: unknown,
  signatures: unknown = {},
  files: unknown = {},
): SubmissionAnswer[] {
  const submittedData = isRecord(data) ? data : {};
  const submittedSignatures = isRecord(signatures) ? signatures : {};
  const submittedFiles = isRecord(files) ? files : {};

  return fields
    .filter((field) => isPublicField(field) && !DISPLAY_ONLY_FIELD_TYPES.includes(field.type))
    .map((field) => {
      const rawSignature = submittedSignatures[field.id];
      const imageDataUrl = isValidImageDataUrl(rawSignature)
        ? rawSignature
        : undefined;
      const fileMetadata = normalizeFileMetadataList(submittedFiles[field.id]);

      return {
        fieldId: field.id,
        label: field.label || field.content || field.id,
        type: field.type,
        value: formatAnswerValue(
          field,
          submittedData[field.id],
          rawSignature,
          submittedFiles[field.id],
        ),
        imageDataUrl,
        files: fileMetadata.length > 0 ? fileMetadata : undefined,
      };
    });
}

export function buildSubmissionContext(fields: FormBuilderField[]) {
  return fields
    .filter((field) => isPublicField(field) && DISPLAY_ONLY_FIELD_TYPES.includes(field.type))
    .map((field) => ({
      id: field.id,
      type: field.type,
      label: field.label,
      content:
        field.type === "html"
          ? sanitizeFormHtml(field.content)
          : field.content || field.label,
    }));
}

export function normalizeOfficeData(data: unknown) {
  return isRecord(data) ? data : {};
}

export function buildOfficeFieldAnswers(
  fields: FormBuilderField[],
  officeData: unknown,
): OfficeFieldAnswer[] {
  const savedOfficeData = normalizeOfficeData(officeData);

  return fields
    .filter(isOfficeField)
    .map((field) => ({
      field,
      value:
        field.type === "checkbox"
          ? savedOfficeData[field.id] === true
          : String(savedOfficeData[field.id] ?? ""),
      supported: OFFICE_SUPPORTED_FIELD_TYPES.includes(field.type),
    }));
}

export function buildSubmissionPreview(fields: FormBuilderField[], data: unknown) {
  const answers = buildSubmissionAnswers(fields, data)
    .filter((answer) => answer.value !== "No answer" && answer.value !== "Not supported yet")
    .slice(0, 3);

  if (answers.length === 0) {
    return "No submitted answers";
  }

  return answers.map((answer) => `${answer.label}: ${answer.value}`).join(" | ");
}

export async function getFormSubmissions(formId: string) {
  const user = await requireCurrentUser();
  const form = await prisma.form.findFirst({
    where: {
      id: formId,
      ownerId: user.id,
    },
    select: {
      id: true,
      title: true,
      status: true,
    },
  });

  if (!form) {
    notFound();
  }

  const submissions = await prisma.formSubmission.findMany({
    where: {
      formId,
      ownerId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      formVersion: true,
      formSnapshot: true,
      data: true,
      signatures: true,
      files: true,
      officeData: true,
      officeCompletedAt: true,
      officeCompletedById: true,
      status: true,
      createdAt: true,
    },
  });

  return {
    form,
    submissions: submissions.map((submission) => {
      const snapshot = normalizeSnapshot(submission.formSnapshot);
      return {
        ...submission,
        snapshot,
        preview: buildSubmissionPreview(snapshot.fields, submission.data),
      };
    }),
  };
}

export async function getFormSubmissionById(formId: string, submissionId: string) {
  const user = await requireCurrentUser();
  const form = await prisma.form.findFirst({
    where: {
      id: formId,
      ownerId: user.id,
    },
    select: {
      id: true,
      title: true,
      status: true,
    },
  });

  if (!form) {
    notFound();
  }

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
      signatures: true,
      files: true,
      officeData: true,
      officeCompletedAt: true,
      officeCompletedById: true,
      status: true,
      metadata: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!submission) {
    notFound();
  }

  const snapshot = normalizeSnapshot(submission.formSnapshot);

  return {
    form,
    submission: {
      ...submission,
      snapshot,
      answers: buildSubmissionAnswers(
        snapshot.fields,
        submission.data,
        submission.signatures,
        submission.files,
      ),
      context: buildSubmissionContext(snapshot.fields),
      officeFields: buildOfficeFieldAnswers(snapshot.fields, submission.officeData),
      metadata: isRecord(submission.metadata) ? submission.metadata : {},
    },
  };
}
