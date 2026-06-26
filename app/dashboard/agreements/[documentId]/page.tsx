import { BusinessDocumentDetailPage } from "@/components/documents/business-document-pages";

type AgreementDetailPageProps = {
  params: Promise<{
    documentId: string;
  }>;
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function AgreementDetailPage({
  params,
  searchParams,
}: AgreementDetailPageProps) {
  const { documentId } = await params;

  return (
    <BusinessDocumentDetailPage
      documentId={documentId}
      searchParams={await searchParams}
      type="AGREEMENT"
    />
  );
}
