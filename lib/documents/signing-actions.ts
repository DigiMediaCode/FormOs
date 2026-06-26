"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppUrl } from "@/lib/app-url";
import { documentBasePath, type BusinessDocumentType } from "@/lib/documents/templates";
import {
  escapeHtml,
  generateDocumentSigningToken,
  hashDocumentSigningToken,
  isRecord,
  isValidSignatureDataUrl,
  signingTokenExpiryDate,
  snapshotDisplayName,
  snapshotEmail,
  snapshotString,
} from "@/lib/documents/signing";
import { sendEmail } from "@/lib/email/send-email";
import { assertCanGeneratePdf, assertCanUseBusinessDocumentType } from "@/lib/plans/limits";
import { generateBusinessDocumentPdf } from "@/lib/pdf/business-document";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMember } from "@/lib/workspaces/access";

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function normalizeDocumentType(value: string): BusinessDocumentType {
  return value === "AGREEMENT" ? "AGREEMENT" : "CONTRACT";
}

function redirectToDocument(
  type: BusinessDocumentType,
  documentId: string,
  messageType: "error" | "success",
  message: string,
): never {
  redirect(
    `${documentBasePath(type)}/${documentId}?${messageType}=${encodeURIComponent(message)}`,
  );
}

function signatureJson(current: unknown, key: "ownerSignature" | "clientSignature", value: string) {
  const base = isRecord(current) ? { ...current } : {};
  base[key] = value;
  return base as Prisma.InputJsonValue;
}

async function loadOwnedDocument(documentId: string, type: BusinessDocumentType, ownerId: string) {
  return prisma.businessDocument.findFirst({
    where: {
      id: documentId,
      ownerId,
      type,
    },
    select: {
      id: true,
      ownerId: true,
      type: true,
      title: true,
      documentNumber: true,
      status: true,
      clientSnapshot: true,
      ownerSnapshot: true,
      scopeOfWork: true,
      terms: true,
      paymentTerms: true,
      startDate: true,
      endDate: true,
      totalAmount: true,
      currency: true,
      signatures: true,
      createdAt: true,
      completedAt: true,
      ownerSignedAt: true,
      clientSignedAt: true,
      finalPdfSentAt: true,
      owner: {
        select: {
          email: true,
        },
      },
    },
  });
}

async function finalizeAndEmailSignedPdf(documentId: string) {
  const document = await prisma.businessDocument.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      ownerId: true,
      type: true,
      title: true,
      documentNumber: true,
      status: true,
      clientSnapshot: true,
      ownerSnapshot: true,
      scopeOfWork: true,
      terms: true,
      paymentTerms: true,
      startDate: true,
      endDate: true,
      totalAmount: true,
      currency: true,
      signatures: true,
      createdAt: true,
      completedAt: true,
      ownerSignedAt: true,
      clientSignedAt: true,
      finalPdfSentAt: true,
      owner: {
        select: {
          email: true,
        },
      },
    },
  });

  if (
    !document ||
    !document.ownerSignedAt ||
    !document.clientSignedAt ||
    document.finalPdfSentAt
  ) {
    return;
  }

  await assertCanUseBusinessDocumentType(document.ownerId, document.type as BusinessDocumentType);
  await assertCanGeneratePdf(document.ownerId);

  const completedAt = new Date();
  await prisma.businessDocument.update({
    where: { id: document.id },
    data: {
      status: "SIGNED",
      completedAt: document.completedAt ?? completedAt,
    },
  });

  const pdf = await generateBusinessDocumentPdf({
    ...document,
    status: "SIGNED",
    completedAt: document.completedAt ?? completedAt,
  });

  const ownerEmail = document.owner.email || snapshotEmail(document.ownerSnapshot);
  const clientEmail = snapshotEmail(document.clientSnapshot);
  const clientName = snapshotDisplayName(document.clientSnapshot);
  const ownerName =
    snapshotString(document.ownerSnapshot, "companyName") ||
    snapshotDisplayName(document.ownerSnapshot, "FormOS user");

  const attachment = {
    fileName: pdf.fileName,
    mimeType: pdf.mimeType,
    content: pdf.buffer,
  };

  const subject = `Signed document: ${document.title}`;
  const text = [
    `${document.title} has been signed by both parties.`,
    "",
    `Document number: ${document.documentNumber || document.id}`,
    `Client: ${clientName}`,
    `Business: ${ownerName}`,
    "",
    "The signed PDF is attached.",
  ].join("\n");
  const html = `<p><strong>${escapeHtml(document.title)}</strong> has been signed by both parties.</p><p>The signed PDF is attached.</p>`;

  const [ownerResult, clientResult] = await Promise.all([
    ownerEmail
      ? sendEmail({
          to: ownerEmail,
          subject,
          text,
          html,
          attachments: [attachment],
        })
      : Promise.resolve({ ok: false, provider: "none", error: "Missing owner email." }),
    clientEmail
      ? sendEmail({
          to: clientEmail,
          subject,
          text,
          html,
          attachments: [attachment],
        })
      : Promise.resolve({ ok: false, provider: "none", error: "Missing client email." }),
  ]);

  if (ownerResult.ok && clientResult.ok) {
    await prisma.businessDocument.update({
      where: { id: document.id },
      data: {
        finalPdfSentAt: new Date(),
      },
    });
  }
}

export async function sendBusinessDocumentForSigningAction(formData: FormData) {
  const context = await requireWorkspaceMember();
  const documentId = readString(formData, "documentId");
  const type = normalizeDocumentType(readString(formData, "type"));

  try {
    await assertCanUseBusinessDocumentType(context.ownerId, type);
    await assertCanGeneratePdf(context.ownerId);
  } catch (error) {
    redirectToDocument(
      type,
      documentId,
      "error",
      error instanceof Error ? error.message : "Signing is not available.",
    );
  }

  const document = await loadOwnedDocument(documentId, type, context.ownerId);

  if (!document) {
    redirectToDocument(type, documentId, "error", "Document not found.");
  }

  const clientEmail = snapshotEmail(document.clientSnapshot);

  if (!clientEmail) {
    redirectToDocument(
      type,
      document.id,
      "error",
      "Add a client email before sending this document for signing.",
    );
  }

  const token = generateDocumentSigningToken();
  const signingUrl = `${getAppUrl()}/sign/${token}`;
  const expiresAt = signingTokenExpiryDate();

  await prisma.businessDocument.update({
    where: { id: document.id },
    data: {
      signingTokenHash: hashDocumentSigningToken(token),
      signingTokenExpiresAt: expiresAt,
      sentForSigningAt: new Date(),
      status: "SENT",
    },
  });

  const clientName = snapshotDisplayName(document.clientSnapshot);
  const ownerName =
    snapshotString(document.ownerSnapshot, "companyName") ||
    snapshotDisplayName(document.ownerSnapshot, "FormOS user");

  const result = await sendEmail({
    to: clientEmail,
    subject: `Signature requested: ${document.title}`,
    text: [
      `Hi ${clientName},`,
      "",
      `${ownerName} has sent you a ${type.toLowerCase()} to review and sign.`,
      "",
      `Open and sign: ${signingUrl}`,
      "",
      `This link expires on ${expiresAt.toISOString()}.`,
    ].join("\n"),
    html: [
      `<p>Hi ${escapeHtml(clientName)},</p>`,
      `<p>${escapeHtml(ownerName)} has sent you a ${escapeHtml(type.toLowerCase())} to review and sign.</p>`,
      `<p><a href="${escapeHtml(signingUrl)}">Open and sign the document</a></p>`,
      `<p>This link expires on ${escapeHtml(expiresAt.toISOString())}.</p>`,
    ].join(""),
  });

  revalidatePath(documentBasePath(type));
  revalidatePath(`${documentBasePath(type)}/${document.id}`);

  if (!result.ok) {
    redirectToDocument(
      type,
      document.id,
      "error",
      "Signing link was created, but the email could not be sent. Please try again.",
    );
  }

  redirectToDocument(type, document.id, "success", "Signing request sent to the client.");
}

export async function signBusinessDocumentAsOwnerAction(formData: FormData) {
  const context = await requireWorkspaceMember();
  const documentId = readString(formData, "documentId");
  const type = normalizeDocumentType(readString(formData, "type"));
  const signature = readString(formData, "ownerSignature");

  if (!isValidSignatureDataUrl(signature)) {
    redirectToDocument(type, documentId, "error", "Draw your signature before saving.");
  }

  try {
    await assertCanUseBusinessDocumentType(context.ownerId, type);
    await assertCanGeneratePdf(context.ownerId);
  } catch (error) {
    redirectToDocument(
      type,
      documentId,
      "error",
      error instanceof Error ? error.message : "Signing is not available.",
    );
  }

  const document = await loadOwnedDocument(documentId, type, context.ownerId);

  if (!document) {
    redirectToDocument(type, documentId, "error", "Document not found.");
  }

  await prisma.businessDocument.update({
    where: { id: document.id },
    data: {
      signatures: signatureJson(document.signatures, "ownerSignature", signature),
      ownerSignedAt: new Date(),
      status: document.clientSignedAt ? "SIGNED" : "OWNER_SIGNED",
      completedAt: document.clientSignedAt ? new Date() : document.completedAt,
    },
  });

  try {
    await finalizeAndEmailSignedPdf(document.id);
  } catch {
    // Signing should not be lost if email/PDF delivery fails.
  }

  revalidatePath(`${documentBasePath(type)}/${document.id}`);
  redirectToDocument(type, document.id, "success", "Business signature saved.");
}

export async function signBusinessDocumentAsClientAction(formData: FormData) {
  const token = readString(formData, "token");
  const signature = readString(formData, "clientSignature");

  if (!token) {
    redirect("/sign/error?error=Signing token is missing.");
  }

  if (!isValidSignatureDataUrl(signature)) {
    redirect(`/sign/${encodeURIComponent(token)}?error=${encodeURIComponent("Draw your signature before submitting.")}`);
  }

  const document = await prisma.businessDocument.findUnique({
    where: {
      signingTokenHash: hashDocumentSigningToken(token),
    },
    select: {
      id: true,
      ownerId: true,
      type: true,
      signatures: true,
      signingTokenExpiresAt: true,
      ownerSignedAt: true,
      clientSignedAt: true,
      completedAt: true,
    },
  });

  if (!document || !document.signingTokenExpiresAt) {
    redirect(`/sign/${encodeURIComponent(token)}?error=${encodeURIComponent("This signing link is invalid.")}`);
  }

  if (document.signingTokenExpiresAt.getTime() < Date.now()) {
    redirect(`/sign/${encodeURIComponent(token)}?error=${encodeURIComponent("This signing link has expired. Please contact the sender.")}`);
  }

  const type = normalizeDocumentType(document.type);

  try {
    await assertCanUseBusinessDocumentType(document.ownerId, type);
    await assertCanGeneratePdf(document.ownerId);
  } catch (error) {
    redirect(`/sign/${encodeURIComponent(token)}?error=${encodeURIComponent(error instanceof Error ? error.message : "Signing is not available.")}`);
  }

  await prisma.businessDocument.update({
    where: { id: document.id },
    data: {
      signatures: signatureJson(document.signatures, "clientSignature", signature),
      clientSignedAt: new Date(),
      status: document.ownerSignedAt ? "SIGNED" : "CLIENT_SIGNED",
      completedAt: document.ownerSignedAt ? new Date() : document.completedAt,
    },
  });

  try {
    await finalizeAndEmailSignedPdf(document.id);
  } catch {
    // Client signing should still complete if PDF email delivery needs retry.
  }

  revalidatePath(`${documentBasePath(type)}/${document.id}`);
  redirect(`/sign/${encodeURIComponent(token)}?success=${encodeURIComponent("Thank you. Your signature has been saved.")}`);
}
