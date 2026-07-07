import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/public/legal-page-layout";
import { getPublishedCmsPage, renderCmsContent } from "@/lib/cms/pages";
import {
  DATA_DELETION_EXCERPT,
  DATA_DELETION_HTML,
} from "@/lib/legal/data-deletion";

export const metadata: Metadata = {
  title: "Data Deletion Request | FormOS",
  description: DATA_DELETION_EXCERPT,
};

export default async function DataDeletionPage() {
  const cmsPage = await getPublishedCmsPage("data-deletion");

  if (cmsPage) {
    const html = renderCmsContent(cmsPage.content);

    return (
      <LegalPageLayout
        description={cmsPage.excerpt ?? DATA_DELETION_EXCERPT}
        title={cmsPage.title}
      >
        {html ? (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <p>This page is being updated.</p>
        )}
      </LegalPageLayout>
    );
  }

  return (
    <LegalPageLayout
      description={DATA_DELETION_EXCERPT}
      title="Data Deletion Request"
    >
      <div dangerouslySetInnerHTML={{ __html: renderCmsContent(DATA_DELETION_HTML) }} />
    </LegalPageLayout>
  );
}
