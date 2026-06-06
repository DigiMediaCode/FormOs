import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/public/legal-page-layout";
import { getPublishedCmsPage, renderCmsContent } from "@/lib/cms/pages";

export const metadata: Metadata = {
  title: "Contact | FormOS",
};

export default async function ContactPage() {
  const cmsPage = await getPublishedCmsPage("contact");

  if (cmsPage) {
    const html = renderCmsContent(cmsPage.content);

    return (
      <LegalPageLayout
        description={cmsPage.excerpt ?? "Need help with FormOS? Contact the support team."}
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
      description="Need help with FormOS? Contact the support team."
      title="Contact"
    >
      <section>
        <h2 className="text-lg font-semibold text-slate-950">Support</h2>
        <p className="mt-2">
          For account, form, integration, or submission workflow questions,
          contact support at{" "}
          <a className="font-medium text-blue-600 hover:text-blue-700" href="mailto:support@example.com">
            support@example.com
          </a>
          .
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-slate-950">What to include</h2>
        <p className="mt-2">Please include your account email, a short description of the issue, and any relevant form or submission context. Do not send passwords or OAuth tokens.</p>
      </section>
    </LegalPageLayout>
  );
}
