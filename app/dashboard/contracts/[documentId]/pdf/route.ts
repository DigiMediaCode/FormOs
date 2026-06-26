import { NextRequest } from "next/server";
import { handleBusinessDocumentPdfRequest } from "@/lib/documents/pdf-route";

type ContractPdfRouteProps = {
  params: Promise<{
    documentId: string;
  }>;
};

export async function GET(request: NextRequest, { params }: ContractPdfRouteProps) {
  const { documentId } = await params;

  return handleBusinessDocumentPdfRequest(request, documentId, "CONTRACT");
}
