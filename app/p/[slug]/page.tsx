import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LegalPageLayout } from "@/components/public/legal-page-layout";
import { getPublishedCmsPage, renderCmsContent } from "@/lib/cms/pages";

type CmsPublicPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: CmsPublicPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedCmsPage(slug);

  if (!page) {
    return {
      title: "Page unavailable | FormOS",
    };
  }

  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || page.excerpt || undefined,
  };
}

export default async function CmsPublicPage({ params }: CmsPublicPageProps) {
  const { slug } = await params;
  const page = await getPublishedCmsPage(slug);

  if (!page) {
    notFound();
  }

  const html = renderCmsContent(page.content);

  return (
    <LegalPageLayout
      description={page.excerpt ?? "Public FormOS page."}
      title={page.title}
    >
      {html ? (
        <div
          className="cms-content space-y-5"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <p>This page is being updated.</p>
      )}
    </LegalPageLayout>
  );
}
