import type { Metadata } from "next";
import { createSupportRequestAction } from "@/app/contact/actions";
import { SupportRequestForm } from "@/app/contact/support-request-form";
import { LegalPageLayout } from "@/components/public/legal-page-layout";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPublishedCmsPage, renderCmsContent } from "@/lib/cms/pages";

export const metadata: Metadata = {
  title: "Contact | FormOS",
};

type ContactPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

function userDisplayName(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  if (!user) {
    return "";
  }

  return (
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.name ||
    ""
  );
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const [cmsPage, user, messages] = await Promise.all([
    getPublishedCmsPage("contact"),
    getCurrentUser(),
    searchParams,
  ]);
  const form = (
    <>
      {messages.success ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {messages.success}
        </p>
      ) : null}
      {messages.error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {messages.error}
        </p>
      ) : null}
      <SupportRequestForm
        action={createSupportRequestAction}
        defaultEmail={user?.email ?? ""}
        defaultName={userDisplayName(user)}
      />
    </>
  );

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
        {form}
      </LegalPageLayout>
    );
  }

  return (
    <LegalPageLayout
      description="Need help with FormOS? Contact the support team."
      title="Contact"
    >
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Support</h2>
        <p className="mt-2">
          For account, form, integration, or submission workflow questions,
          send us a support request below.
        </p>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">What to include</h2>
        <p className="mt-2">Please include your account email, a short description of the issue, and any relevant form or submission context. Do not send passwords or OAuth tokens.</p>
      </section>
      {form}
    </LegalPageLayout>
  );
}
