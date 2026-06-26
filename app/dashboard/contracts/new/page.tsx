import { NewBusinessDocumentPage } from "@/components/documents/business-document-pages";

type NewContractPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
    clientId?: string;
    sourceSubmissionId?: string;
    template?: string;
  }>;
};

export default async function NewContractPage({ searchParams }: NewContractPageProps) {
  return <NewBusinessDocumentPage searchParams={await searchParams} type="CONTRACT" />;
}
