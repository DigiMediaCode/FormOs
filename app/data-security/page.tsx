import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/public/legal-page-layout";
import { getPublishedCmsPage, renderCmsContent } from "@/lib/cms/pages";
import { HEALTHCARE_DATA_SECURITY_NOTICE_HTML } from "@/lib/legal/healthcare-notices";

export const metadata: Metadata = {
  title: "Data Security | FormOS",
};

function hasHealthcareNotice(html: string) {
  return html.toLowerCase().includes("healthcare and sensitive information");
}

export default async function DataSecurityPage() {
  const cmsPage = await getPublishedCmsPage("data-security");

  if (cmsPage) {
    const html = renderCmsContent(cmsPage.content);

    return (
      <LegalPageLayout
        description={cmsPage.excerpt ?? "How FormOS approaches data security."}
        title={cmsPage.title}
      >
        {html ? (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <p>This page is being updated.</p>
        )}
        {!hasHealthcareNotice(html) ? (
          <div
            dangerouslySetInnerHTML={{
              __html: renderCmsContent(HEALTHCARE_DATA_SECURITY_NOTICE_HTML),
            }}
          />
        ) : null}
      </LegalPageLayout>
    );
  }

  const healthcareNoticeHtml = renderCmsContent(
    HEALTHCARE_DATA_SECURITY_NOTICE_HTML,
  );

  return (
    <LegalPageLayout
      description="How FormOS approaches submissions, connected storage, and access control."
      title="Data Security"
    >
      <section>
        <h2 className="text-lg font-semibold text-slate-950">Connected storage model</h2>
        <p className="mt-2">FormOS routes public file uploads to the form owner&apos;s connected Google Drive or Dropbox account. Public submitters cannot choose the destination.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-slate-950">Submissions and signatures</h2>
        <p className="mt-2">Submission answers, signatures, initials, office-use fields, and completed status are stored so the form owner can review and finalize each workflow.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-slate-950">Activity timeline</h2>
        <p className="mt-2">Important submission events are recorded for owners, including creation, uploads, signatures, office updates, PDF generation, and email delivery status.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-slate-950">Secure access</h2>
        <p className="mt-2">Dashboard, submission, integration, and admin pages are protected by authentication and ownership checks. Super Admin views do not expose uploaded file links by default.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-slate-950">File exposure</h2>
        <p className="mt-2">FormOS does not create public Dropbox share links and does not expose storage provider tokens. Google Drive and Dropbox access remains server-side.</p>
      </section>
      <div dangerouslySetInnerHTML={{ __html: healthcareNoticeHtml }} />
    </LegalPageLayout>
  );
}
