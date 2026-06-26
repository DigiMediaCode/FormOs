"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import {
  assertCanConvertSubmissionToClient,
  assertCanCreateClient,
} from "@/lib/plans/limits";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMember } from "@/lib/workspaces/access";

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function normalizeClientType(value: string) {
  return value === "BUSINESS" ? "BUSINESS" : "PERSON";
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function clientDetailPath(
  clientId: string,
  messageType?: "error" | "success",
  message?: string,
) {
  if (!messageType || !message) {
    return `/dashboard/clients/${clientId}`;
  }

  return `/dashboard/clients/${clientId}?${messageType}=${encodeURIComponent(message)}`;
}

function validateClientFields(data: {
  name: string;
  email: string;
  phone: string;
  companyName: string;
}) {
  if (!data.name && !data.companyName && !data.email && !data.phone) {
    throw new Error("Add at least a client name, company, email, or phone.");
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    throw new Error("Enter a valid client email address.");
  }
}

async function findExistingClient(ownerId: string, email: string) {
  if (!email) {
    return null;
  }

  return prisma.client.findFirst({
    where: {
      ownerId,
      email: {
        equals: email,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
    },
  });
}

export async function createManualClientAction(formData: FormData) {
  const context = await requireWorkspaceMember();

  try {
    await assertCanCreateClient(context.ownerId);
  } catch (error) {
    redirect(
      `/dashboard/clients?error=${encodeURIComponent(
        error instanceof Error ? error.message : "Clients are not available.",
      )}`,
    );
  }

  const email = normalizeEmail(readString(formData, "email"));
  const data = {
    type: normalizeClientType(readString(formData, "type")),
    name: readString(formData, "name"),
    email,
    phone: readString(formData, "phone"),
    companyName: readString(formData, "companyName"),
    abnOrBusinessId: readString(formData, "abnOrBusinessId"),
    address: readString(formData, "address"),
    notes: readString(formData, "notes"),
  };

  try {
    validateClientFields(data);
  } catch (error) {
    redirect(
      `/dashboard/clients/new?error=${encodeURIComponent(
        error instanceof Error ? error.message : "Unable to create client.",
      )}`,
    );
  }

  const existingClient = await findExistingClient(context.ownerId, email);

  if (existingClient) {
    redirect(
      clientDetailPath(
        existingClient.id,
        "success",
        "A client with this email already exists.",
      ),
    );
  }

  let clientId = "";

  try {
    const client = await prisma.client.create({
      data: {
        ownerId: context.ownerId,
        workspaceId: context.workspace.id,
        type: data.type,
        name: data.name || data.companyName || data.email || data.phone,
        email: data.email || null,
        phone: data.phone || null,
        companyName: data.companyName || null,
        abnOrBusinessId: data.abnOrBusinessId || null,
        address: data.address || null,
        notes: data.notes || null,
        metadata: {
          source: "manual",
        } as Prisma.InputJsonValue,
      },
      select: {
        id: true,
      },
    });
    clientId = client.id;
  } catch (error) {
    redirect(
      `/dashboard/clients/new?error=${encodeURIComponent(
        error instanceof Error ? error.message : "Unable to create client.",
      )}`,
    );
  }

  revalidatePath("/dashboard/clients");
  redirect(clientDetailPath(clientId, "success", "Client created."));
}

export async function convertSubmissionToClientAction(
  formId: string,
  submissionId: string,
  formData: FormData,
) {
  const context = await requireWorkspaceMember();

  try {
    await assertCanConvertSubmissionToClient(context.ownerId);
  } catch (error) {
    redirect(
      `/dashboard/forms/${formId}/submissions/${submissionId}?error=${encodeURIComponent(
        error instanceof Error
          ? error.message
          : "Client conversion is not available.",
      )}`,
    );
  }

  const submission = await prisma.formSubmission.findFirst({
    where: {
      id: submissionId,
      formId,
      ownerId: context.ownerId,
    },
    select: {
      id: true,
      formId: true,
      formVersion: true,
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

  const existingSourceClient = await prisma.client.findFirst({
    where: {
      ownerId: context.ownerId,
      sourceSubmissionId: submission.id,
    },
    select: {
      id: true,
    },
  });

  if (existingSourceClient) {
    redirect(
      clientDetailPath(
        existingSourceClient.id,
        "success",
        "This submission is already linked to a client.",
      ),
    );
  }

  const email = normalizeEmail(readString(formData, "email"));
  const data = {
    type: normalizeClientType(readString(formData, "type")),
    name: readString(formData, "name"),
    email,
    phone: readString(formData, "phone"),
    companyName: readString(formData, "companyName"),
    abnOrBusinessId: readString(formData, "abnOrBusinessId"),
    address: readString(formData, "address"),
    notes: readString(formData, "notes"),
  };

  try {
    validateClientFields(data);
  } catch (error) {
    redirect(
      `/dashboard/forms/${formId}/submissions/${submissionId}?error=${encodeURIComponent(
        error instanceof Error
          ? error.message
          : "Unable to convert submission to client.",
      )}`,
    );
  }

  const existingClient = await findExistingClient(context.ownerId, email);

  if (existingClient) {
    redirect(
      clientDetailPath(
        existingClient.id,
        "success",
        "A client with this email already exists.",
      ),
    );
  }

  let clientId = "";

  try {
    const client = await prisma.client.create({
      data: {
        ownerId: context.ownerId,
        workspaceId: context.workspace.id,
        sourceSubmissionId: submission.id,
        type: data.type,
        name: data.name || data.companyName || data.email || data.phone,
        email: data.email || null,
        phone: data.phone || null,
        companyName: data.companyName || null,
        abnOrBusinessId: data.abnOrBusinessId || null,
        address: data.address || null,
        notes: data.notes || null,
        metadata: {
          source: "submission_conversion",
          formId: submission.formId,
          formTitle: submission.form.title,
          formVersion: submission.formVersion,
        } as Prisma.InputJsonValue,
      },
      select: {
        id: true,
      },
    });
    clientId = client.id;
  } catch (error) {
    redirect(
      `/dashboard/forms/${formId}/submissions/${submissionId}?error=${encodeURIComponent(
        error instanceof Error
          ? error.message
          : "Unable to convert submission to client.",
      )}`,
    );
  }

  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/forms/${formId}/submissions/${submissionId}`);
  redirect(clientDetailPath(clientId, "success", "Submission converted to client."));
}
