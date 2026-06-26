import { BusinessDocumentListPage } from "@/components/documents/business-document-pages";

type ContractsPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function ContractsPage({ searchParams }: ContractsPageProps) {
  return <BusinessDocumentListPage searchParams={await searchParams} type="CONTRACT" />;
}
