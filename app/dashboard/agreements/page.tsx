import { BusinessDocumentListPage } from "@/components/documents/business-document-pages";

type AgreementsPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function AgreementsPage({ searchParams }: AgreementsPageProps) {
  return <BusinessDocumentListPage searchParams={await searchParams} type="AGREEMENT" />;
}
