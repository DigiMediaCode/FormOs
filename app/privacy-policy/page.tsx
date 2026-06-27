import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/public/legal-page-layout";
import { getPublishedCmsPage, renderCmsContent } from "@/lib/cms/pages";
import {
  PRIVACY_POLICY_EXCERPT,
  PRIVACY_POLICY_HTML,
} from "@/lib/legal/privacy-policy";
import { HEALTHCARE_PRIVACY_NOTICE_HTML } from "@/lib/legal/healthcare-notices";

export const metadata: Metadata = {
  title: "Privacy Policy | FormOS",
};

function hasHealthcareNotice(html: string) {
  return html.toLowerCase().includes("healthcare and sensitive information");
}

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
        {!hasHealthcareNotice(html) ? (
          <div
            dangerouslySetInnerHTML={{
              __html: renderCmsContent(HEALTHCARE_PRIVACY_NOTICE_HTML),
            }}
          />
        ) : null}
      </LegalPageLayout>
    );
  }

  const fallbackHtml = renderCmsContent(PRIVACY_POLICY_HTML);
  const healthcareNoticeHtml = renderCmsContent(HEALTHCARE_PRIVACY_NOTICE_HTML);

  return (
    <LegalPageLayout
      description={PRIVACY_POLICY_EXCERPT}
      title="Privacy Policy"
    >
      <div dangerouslySetInnerHTML={{ __html: fallbackHtml }} />
      <div dangerouslySetInnerHTML={{ __html: healthcareNoticeHtml }} />
    </LegalPageLayout>
  );
}
