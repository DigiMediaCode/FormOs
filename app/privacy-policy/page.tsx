import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/public/legal-page-layout";

export const metadata: Metadata = {
  title: "Privacy Policy | FormOS",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      description="How FormOS handles account data, submissions, uploads, and integrations."
      title="Privacy Policy"
    >
      <section>
        <h2 className="text-lg font-semibold text-slate-950">Account data</h2>
        <p className="mt-2">FormOS stores account details such as name, email address, password hashes, settings, and integration status so users can access and manage forms.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-slate-950">Form submissions</h2>
        <p className="mt-2">Form owners control the forms they create. Public submissions may include answers, signatures, initials, office-use data, and submission metadata needed to operate the workflow.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-slate-950">Uploaded files</h2>
        <p className="mt-2">Uploaded files are routed to the form owner&apos;s connected Google Drive or Dropbox account. FormOS stores file metadata needed to display submission records, but does not permanently store uploaded file binaries on its server.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-slate-950">Email notifications</h2>
        <p className="mt-2">FormOS may send signup, login, submission, and completed PDF notifications using the configured email provider. Emails avoid storage tokens and uploaded file links.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-slate-950">Cookies and sessions</h2>
        <p className="mt-2">FormOS uses cookies for session authentication and account access. Users should protect their login credentials and sign out on shared devices.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-slate-950">Data retention and contact</h2>
        <p className="mt-2">Data is retained while accounts and forms remain active, unless deleted or changed by the form owner. Contact support@example.com for privacy questions.</p>
      </section>
    </LegalPageLayout>
  );
}
