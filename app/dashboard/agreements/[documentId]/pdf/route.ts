import { NextRequest } from "next/server";
import { handleBusinessDocumentPdfRequest } from "@/lib/documents/pdf-route";

type AgreementPdfRouteProps = {
  params: Promise<{
    documentId: string;
  }>;
};

export async function GET(request: NextRequest, { params }: AgreementPdfRouteProps) {
  const { documentId } = await params;

  return handleBusinessDocumentPdfRequest(request, documentId, "AGREEMENT");
}
