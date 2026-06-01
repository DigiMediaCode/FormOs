import "server-only";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

type SubmissionEventInput = {
  submissionId: string;
  formId: string;
  ownerId: string;
  type: string;
  message?: string;
  metadata?: Record<string, unknown> | null;
};

const SENSITIVE_METADATA_KEYS = [
  "accessToken",
  "refreshToken",
  "token",
  "secret",
  "password",
  "webViewLink",
  "webContentLink",
  "link",
  "url",
  "path",
  "fileContents",
  "content",
  "answers",
  "data",
  "signature",
];

function isSensitiveKey(key: string) {
  const normalized = key.toLowerCase();
  return SENSITIVE_METADATA_KEYS.some((sensitiveKey) =>
    normalized.includes(sensitiveKey.toLowerCase()),
  );
}

function sanitizeMetadata(metadata?: Record<string, unknown> | null) {
  if (!metadata) {
    return undefined;
  }

  const safeMetadata: Record<string, string | number | boolean | null> = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (isSensitiveKey(key)) {
      continue;
    }

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null
    ) {
      safeMetadata[key] = value;
    }
  }

  return Object.keys(safeMetadata).length > 0 ? safeMetadata : undefined;
}

function logEventWarning(message: string, details?: Record<string, unknown>) {
  console.warn("[formos:submission-events]", message, details ?? {});
}

export async function createSubmissionEvent(input: SubmissionEventInput) {
  try {
    const metadata = sanitizeMetadata(input.metadata);

    await prisma.submissionEvent.create({
      data: {
        submissionId: input.submissionId,
        formId: input.formId,
        ownerId: input.ownerId,
        type: input.type,
        message: input.message,
        metadata: metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    logEventWarning("Submission event logging failed safely.", {
      submissionId: input.submissionId,
      formId: input.formId,
      type: input.type,
      error: error instanceof Error ? error.message : "Unknown event error",
    });
  }
}

export async function getSubmissionEvents(formId: string, submissionId: string) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return prisma.submissionEvent.findMany({
    where: {
      formId,
      submissionId,
      ownerId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      type: true,
      message: true,
      metadata: true,
      createdAt: true,
    },
  });
}
