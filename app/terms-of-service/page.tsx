import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/public/legal-page-layout";
import { getPublishedCmsPage, renderCmsContent } from "@/lib/cms/pages";

export const metadata: Metadata = {
  title: "Terms of Service | FormOS",
};

export default async function TermsOfServicePage() {
  const cmsPage = await getPublishedCmsPage("terms-of-service");

  if (cmsPage) {
    const html = renderCmsContent(cmsPage.content);

    return (
      <LegalPageLayout
        description={cmsPage.excerpt ?? "The terms that apply when using FormOS."}
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
      description="The terms that apply when using FormOS to create forms and signed workflows."
      title="Terms of Service"
    >
      <section>
        <h2 className="text-lg font-semibold text-slate-950">User responsibilities</h2>
        <p className="mt-2">Users are responsible for maintaining accurate account information, protecting login credentials, and using FormOS in compliance with applicable laws.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-slate-950">Form owner responsibility</h2>
        <p className="mt-2">Form owners are responsible for the wording, legal suitability, and use of forms, templates, agreement clauses, uploaded content, and public collection workflows.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-slate-950">No legal advice</h2>
        <p className="mt-2">FormOS provides software tools and templates, but does not provide legal advice. Users should review legal wording with a qualified professional before use.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-slate-950">Acceptable use</h2>
        <p className="mt-2">Users must not upload unlawful content, abuse integrations, attempt unauthorized access, or use FormOS to collect data they are not permitted to collect.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-slate-950">Limitation of liability</h2>
        <p className="mt-2">FormOS is provided as a workflow tool. To the maximum extent permitted by law, liability is limited for indirect losses, misuse, or content provided by users.</p>
      </section>
    </LegalPageLayout>
  );
}
