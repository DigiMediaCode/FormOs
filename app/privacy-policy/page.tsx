import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/public/legal-page-layout";
import { getPublishedCmsPage, renderCmsContent } from "@/lib/cms/pages";
import {
  PRIVACY_POLICY_EXCERPT,
  PRIVACY_POLICY_HTML,
} from "@/lib/legal/privacy-policy";

export const metadata: Metadata = {
  title: "Privacy Policy | FormOS",
};

export default async function PrivacyPolicyPage() {
  const cmsPage = await getPublishedCmsPage("privacy-policy");

  if (cmsPage) {
    const html = renderCmsContent(cmsPage.content);

    return (
      <LegalPageLayout
        description={cmsPage.excerpt ?? PRIVACY_POLICY_EXCERPT}
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

  const fallbackHtml = renderCmsContent(PRIVACY_POLICY_HTML);

  return (
    <LegalPageLayout
      description={PRIVACY_POLICY_EXCERPT}
      title="Privacy Policy"
    >
      <div dangerouslySetInnerHTML={{ __html: fallbackHtml }} />
    </LegalPageLayout>
  );
}
