import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { generateBusinessDocumentPdf } from "@/lib/pdf/business-document";
import {
  assertCanGeneratePdf,
  assertCanUseBusinessDocumentType,
} from "@/lib/plans/limits";
import { prisma } from "@/lib/prisma";
import { type BusinessDocumentType } from "@/lib/documents/templates";
import { getWorkspaceContextForCurrentUser } from "@/lib/workspaces/access";

export async function handleBusinessDocumentPdfRequest(
  request: NextRequest,
  documentId: string,
  type: BusinessDocumentType,
) {
  const context = await getWorkspaceContextForCurrentUser();

  if (!context) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    await assertCanUseBusinessDocumentType(context.ownerId, type);
    await assertCanGeneratePdf(context.ownerId);
  } catch (error) {
    return new NextResponse(
      error instanceof Error ? error.message : "Documents are not available.",
      { status: 403 },
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
    },
  });

  if (!document) {
    return new NextResponse("Not found", { status: 404 });
  }

  const pdf = await generateBusinessDocumentPdf(document);

  return new NextResponse(pdf.buffer, {
    headers: {
      "Content-Type": pdf.mimeType,
      "Content-Disposition": `attachment; filename="${pdf.fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
