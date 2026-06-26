import { NewBusinessDocumentPage } from "@/components/documents/business-document-pages";

type NewAgreementPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
    clientId?: string;
    sourceSubmissionId?: string;
    template?: string;
  }>;
};

export default async function NewAgreementPage({ searchParams }: NewAgreementPageProps) {
  return <NewBusinessDocumentPage searchParams={await searchParams} type="AGREEMENT" />;
}
