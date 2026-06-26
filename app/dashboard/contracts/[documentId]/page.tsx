import { BusinessDocumentDetailPage } from "@/components/documents/business-document-pages";

type ContractDetailPageProps = {
  params: Promise<{
    documentId: string;
  }>;
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function ContractDetailPage({
  params,
  searchParams,
}: ContractDetailPageProps) {
  const { documentId } = await params;

  return (
    <BusinessDocumentDetailPage
      documentId={documentId}
      searchParams={await searchParams}
      type="CONTRACT"
    />
  );
}
