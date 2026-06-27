"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import {
  assertCanCreateClient,
  assertCanCreateBusinessDocument,
  assertCanUseBusinessDocumentType,
} from "@/lib/plans/limits";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMember } from "@/lib/workspaces/access";
import { getPublicWorkspaceBranding } from "@/lib/workspaces/branding";
import {
  documentBasePath,
  getDocumentTemplate,
  type BusinessDocumentType,
} from "@/lib/documents/templates";

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function normalizeDocumentType(value: string): BusinessDocumentType {
  return value === "AGREEMENT" ? "AGREEMENT" : "CONTRACT";
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function readClientInput(formData: FormData) {
  return {
    name: readString(formData, "clientName"),
    email: normalizeEmail(readString(formData, "clientEmail")),
    phone: readString(formData, "clientPhone"),
    companyName: readString(formData, "clientCompanyName"),
    abnOrBusinessId: readString(formData, "clientAbnOrBusinessId"),
    address: readString(formData, "clientAddress"),
  };
}

function hasClientInput(data: ReturnType<typeof readClientInput>) {
  return Boolean(
    data.name ||
      data.email ||
      data.phone ||
      data.companyName ||
      data.abnOrBusinessId ||
      data.address,
  );
}

function validateClientEmail(email: string) {
  if (!email) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function readOptionalDate(formData: FormData, key: string) {
  const value = readString(formData, key);

  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${key} must be a valid date.`);
  }

  return date;
}

function readOptionalMoney(formData: FormData, key: string) {
  const value = readString(formData, key);

  if (!value) {
    return null;
  }

  const amount = Number(value);

  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Total amount must be a valid positive number.");
  }

  return new Prisma.Decimal(value);
}

function snapshotClient(data: {
  id?: string | null;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  abnOrBusinessId: string;
  address: string;
}) {
  return {
    id: data.id ?? null,
    name: data.name || null,
    email: data.email || null,
    phone: data.phone || null,
    companyName: data.companyName || null,
    abnOrBusinessId: data.abnOrBusinessId || null,
    address: data.address || null,
  };
}

function snapshotOwner(
  owner: {
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
    businessProfile: {
      companyName: string | null;
      taxId: string | null;
      taxIdLabel: string | null;
      phone: string | null;
      billingEmail: string | null;
      billingName: string | null;
      addressLine1: string | null;
      addressLine2: string | null;
      city: string | null;
      state: string | null;
      postcode: string | null;
      country: string | null;
    } | null;
  },
  logoUrl: string | null,
) {
  const profile = owner.businessProfile;
  const address = [
    profile?.addressLine1,
    profile?.addressLine2,
    profile?.city,
    profile?.state,
    profile?.postcode,
    profile?.country,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    id: owner.id,
    name: owner.name || [owner.firstName, owner.lastName].filter(Boolean).join(" ") || null,
    email: owner.email,
    phone: profile?.phone || owner.phone || null,
    companyName: profile?.companyName || profile?.billingName || null,
    taxId: profile?.taxId || null,
    taxIdLabel: profile?.taxIdLabel || null,
    billingEmail: profile?.billingEmail || null,
    address: address || null,
    logoUrl,
  };
}

function redirectWith(
  type: BusinessDocumentType,
  messageType: "error" | "success",
  message: string,
  path?: string,
): never {
  redirect(
    `${path ?? `${documentBasePath(type)}/new`}?${messageType}=${encodeURIComponent(
      message,
    )}`,
  );
}

export async function createBusinessDocumentAction(formData: FormData) {
  const context = await requireWorkspaceMember();
  const type = normalizeDocumentType(readString(formData, "type"));
  const basePath = documentBasePath(type);

  try {
    await assertCanCreateBusinessDocument(context.ownerId, type);
  } catch (error) {
    redirectWith(
      type,
      "error",
      error instanceof Error ? error.message : "Documents are not available.",
    );
  }

  const title = readString(formData, "title");
  const scopeOfWork = readString(formData, "scopeOfWork");
  const terms = readString(formData, "terms");
  const clientId = readString(formData, "clientId");
  const sourceSubmissionId = readString(formData, "sourceSubmissionId");
  const templateId = readString(formData, "templateId");
  const template = getDocumentTemplate(templateId);

  if (!title) {
    redirectWith(type, "error", "Document title is required.");
  }

  if (!scopeOfWork) {
    redirectWith(type, "error", "Work scope is required.");
  }

  if (!terms) {
    redirectWith(type, "error", "Terms are required.");
  }

  const [owner, branding] = await Promise.all([
    prisma.user.findUnique({
      where: { id: context.ownerId },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        businessProfile: {
          select: {
            companyName: true,
            taxId: true,
            taxIdLabel: true,
            phone: true,
            billingEmail: true,
            billingName: true,
            addressLine1: true,
            addressLine2: true,
            city: true,
            state: true,
            postcode: true,
            country: true,
          },
        },
      },
    }),
    getPublicWorkspaceBranding(context.ownerId),
  ]);

  if (!owner) {
    notFound();
  }

  const client = clientId
    ? await prisma.client.findFirst({
        where: {
          id: clientId,
          ownerId: context.ownerId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          companyName: true,
          abnOrBusinessId: true,
          address: true,
        },
      })
    : null;

  if (clientId && !client) {
    redirectWith(type, "error", "Client not found.");
  }

  const clientInput = readClientInput(formData);

  if (!validateClientEmail(clientInput.email)) {
    redirectWith(type, "error", "Enter a valid client email address.");
  }

  const clientLookupName = clientInput.name || clientInput.companyName || clientInput.phone;
  const clientDisplayName =
    clientInput.name ||
    clientInput.companyName ||
    clientInput.email ||
    clientInput.phone ||
    clientInput.abnOrBusinessId ||
    clientInput.address ||
    "Client";

  let documentClient = client;

  if (!documentClient && hasClientInput(clientInput)) {
    try {
      const existingClient = await prisma.client.findFirst({
        where: clientInput.email
          ? {
              ownerId: context.ownerId,
              email: {
                equals: clientInput.email,
                mode: "insensitive",
              },
            }
          : clientLookupName
            ? {
                ownerId: context.ownerId,
                name: clientLookupName,
              }
            : {
                id: "__no_existing_client__",
                ownerId: context.ownerId,
              },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          companyName: true,
          abnOrBusinessId: true,
          address: true,
        },
      });

      if (existingClient) {
        documentClient = existingClient;
      } else {
        await assertCanCreateClient(context.ownerId);
        documentClient = await prisma.client.create({
          data: {
            ownerId: context.ownerId,
            workspaceId: context.workspace.id,
            type: clientInput.companyName ? "BUSINESS" : "PERSON",
            name: clientDisplayName,
            email: clientInput.email || null,
            phone: clientInput.phone || null,
            companyName: clientInput.companyName || null,
            abnOrBusinessId: clientInput.abnOrBusinessId || null,
            address: clientInput.address || null,
            metadata: {
              source: "business_document",
              documentType: type,
            } as Prisma.InputJsonValue,
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            companyName: true,
            abnOrBusinessId: true,
            address: true,
          },
        });
      }
    } catch (error) {
      redirectWith(
        type,
        "error",
        error instanceof Error ? error.message : "Unable to create client.",
      );
    }
  }

  const sourceSubmission = sourceSubmissionId
    ? await prisma.formSubmission.findFirst({
        where: {
          id: sourceSubmissionId,
          ownerId: context.ownerId,
        },
        select: {
          id: true,
          formId: true,
          form: {
            select: {
              title: true,
            },
          },
        },
      })
    : null;

  if (sourceSubmissionId && !sourceSubmission) {
    redirectWith(type, "error", "Source submission not found.");
  }

  let documentId = "";

  try {
    const document = await prisma.businessDocument.create({
      data: {
        ownerId: context.ownerId,
        workspaceId: context.workspace.id,
        clientId: documentClient?.id ?? null,
        sourceSubmissionId: sourceSubmission?.id ?? null,
        type,
        status: "DRAFT",
        title,
        documentNumber: `${type === "CONTRACT" ? "CON" : "AGR"}-${Date.now()
          .toString()
          .slice(-8)}`,
        clientSnapshot: snapshotClient({
          id: documentClient?.id ?? null,
          name: clientInput.name || documentClient?.name || "",
          email: clientInput.email || documentClient?.email || "",
          phone: clientInput.phone || documentClient?.phone || "",
          companyName:
            clientInput.companyName || documentClient?.companyName || "",
          abnOrBusinessId:
            clientInput.abnOrBusinessId || documentClient?.abnOrBusinessId || "",
          address: clientInput.address || documentClient?.address || "",
        }) as Prisma.InputJsonValue,
        ownerSnapshot: snapshotOwner(owner, branding?.logoUrl ?? null) as Prisma.InputJsonValue,
        scopeOfWork,
        terms,
        paymentTerms: readString(formData, "paymentTerms") || null,
        startDate: readOptionalDate(formData, "startDate"),
        endDate: readOptionalDate(formData, "endDate"),
        totalAmount: readOptionalMoney(formData, "totalAmount"),
        currency: readString(formData, "currency") || "AUD",
        content: {
          templateId: template?.id ?? null,
          templateTitle: template?.title ?? null,
          source: sourceSubmission
            ? {
                submissionId: sourceSubmission.id,
                formId: sourceSubmission.formId,
                formTitle: sourceSubmission.form.title,
              }
            : null,
        } as Prisma.InputJsonValue,
      },
      select: {
        id: true,
      },
    });
    documentId = document.id;
  } catch (error) {
    redirectWith(
      type,
      "error",
      error instanceof Error ? error.message : "Unable to create document.",
    );
  }

  revalidatePath(basePath);
  revalidatePath("/dashboard/clients");
  redirectWith(type, "success", "Document draft created.", `${basePath}/${documentId}`);
}

export async function updateBusinessDocumentAction(formData: FormData) {
  const context = await requireWorkspaceMember();
  const type = normalizeDocumentType(readString(formData, "type"));
  const documentId = readString(formData, "documentId");
  const basePath = documentBasePath(type);
  const detailPath = `${basePath}/${documentId}`;

  try {
    await assertCanUseBusinessDocumentType(context.ownerId, type);
  } catch (error) {
    redirectWith(
      type,
      "error",
      error instanceof Error ? error.message : "Documents are not available.",
      detailPath,
    );
  }

  const document = await prisma.businessDocument.findFirst({
    where: {
      id: documentId,
      ownerId: context.ownerId,
      type,
    },
    select: {
      id: true,
      finalPdfSentAt: true,
    },
  });

  if (!document) {
    redirectWith(type, "error", "Document not found.", basePath);
  }

  if (document.finalPdfSentAt) {
    redirectWith(
      type,
      "error",
      "This document has already been signed and sent. Create a new version before editing the content.",
      detailPath,
    );
  }

  const title = readString(formData, "title");
  const scopeOfWork = readString(formData, "scopeOfWork");
  const terms = readString(formData, "terms");
  const clientInput = readClientInput(formData);

  if (!title) {
    redirectWith(type, "error", "Document title is required.", detailPath);
  }

  if (!scopeOfWork) {
    redirectWith(type, "error", "Work scope is required.", detailPath);
  }

  if (!terms) {
    redirectWith(type, "error", "Terms are required.", detailPath);
  }

  if (!validateClientEmail(clientInput.email)) {
    redirectWith(type, "error", "Enter a valid client email address.", detailPath);
  }

  try {
    await prisma.businessDocument.update({
      where: { id: document.id },
      data: {
        title,
        clientSnapshot: snapshotClient({
          id: readString(formData, "clientSnapshotId") || null,
          ...clientInput,
        }) as Prisma.InputJsonValue,
        scopeOfWork,
        terms,
        paymentTerms: readString(formData, "paymentTerms") || null,
        startDate: readOptionalDate(formData, "startDate"),
        endDate: readOptionalDate(formData, "endDate"),
        totalAmount: readOptionalMoney(formData, "totalAmount"),
        currency: readString(formData, "currency") || "AUD",
      },
    });
  } catch (error) {
    redirectWith(
      type,
      "error",
      error instanceof Error ? error.message : "Unable to update document.",
      detailPath,
    );
  }

  revalidatePath(basePath);
  revalidatePath(detailPath);
  redirectWith(type, "success", "Document content updated.", detailPath);
}

export async function deleteBusinessDocumentAction(formData: FormData) {
  const context = await requireWorkspaceMember();
  const type = normalizeDocumentType(readString(formData, "type"));
  const documentId = readString(formData, "documentId");
  const basePath = documentBasePath(type);
  const detailPath = `${basePath}/${documentId}`;

  try {
    await assertCanUseBusinessDocumentType(context.ownerId, type);
  } catch (error) {
    redirectWith(
      type,
      "error",
      error instanceof Error ? error.message : "Documents are not available.",
      detailPath,
    );
  }

  const document = await prisma.businessDocument.findFirst({
    where: {
      id: documentId,
      ownerId: context.ownerId,
      type,
    },
    select: {
      id: true,
      sentForSigningAt: true,
      ownerSignedAt: true,
      clientSignedAt: true,
      finalPdfSentAt: true,
    },
  });

  if (!document) {
    redirectWith(type, "error", "Document not found.", basePath);
  }

  if (
    document.sentForSigningAt ||
    document.ownerSignedAt ||
    document.clientSignedAt ||
    document.finalPdfSentAt
  ) {
    redirectWith(
      type,
      "error",
      "This document has signing history and cannot be deleted safely.",
      detailPath,
    );
  }

  try {
    await prisma.businessDocument.delete({
      where: { id: document.id },
    });
  } catch (error) {
    redirectWith(
      type,
      "error",
      error instanceof Error ? error.message : "Unable to delete document.",
      detailPath,
    );
  }

  revalidatePath(basePath);
  revalidatePath("/dashboard/clients");
  redirectWith(type, "success", "Draft document deleted.", basePath);
}
