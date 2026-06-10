import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/public/legal-page-layout";
import { getPublishedCmsPage, renderCmsContent } from "@/lib/cms/pages";

export const metadata: Metadata = {
  title: "Privacy Policy | FormOS",
};

function GoogleUserDataDisclosure() {
  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-950">
        Google User Data and Google Drive Integration
      </h2>

      <div className="mt-4 space-y-5">
        <div>
          <h3 className="font-semibold text-slate-900">Google Data We Access</h3>
          <p className="mt-2">
            When a FormOS user connects Google Drive, FormOS may access basic
            Google account information such as the connected Google account email
            address or profile identifier, used to show connection status and
            identify the connected Drive account.
          </p>
          <p className="mt-2">
            FormOS may also access Google Drive folder information selected or
            created by the user for FormOS storage, Google Drive file and folder
            metadata needed to create folders, upload files, organize
            submissions, and display upload status, files uploaded through FormOS
            forms that the form owner chooses to store in their connected Google
            Drive, and generated FormOS documents, such as completed PDFs, when
            saved or sent as part of a form workflow.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-slate-900">How We Use Google User Data</h3>
          <p className="mt-2">
            FormOS uses Google user data only to connect the user&apos;s Google
            Drive account, let the user select or configure a Google Drive
            storage folder, create organized folders for forms and submissions,
            upload respondent files into the connected Drive folder, store
            generated PDFs or documents related to submissions, display
            integration status, upload status, and submission file metadata, and
            troubleshoot Drive upload issues when support is requested.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-slate-900">What We Do Not Do</h3>
          <p className="mt-2">
            FormOS does not sell Google user data, does not use Google user data
            for advertising, and does not use Google user data to train AI
            models. FormOS does not transfer Google user data to third parties
            except as necessary to provide the requested FormOS service, comply
            with law, or protect platform security. FormOS does not expose
            Google Drive OAuth tokens to public form submitters.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-slate-900">Storage and Retention</h3>
          <p className="mt-2">
            Uploaded files are stored in the connected user&apos;s Google Drive
            account. FormOS may store limited metadata such as file name, Google
            Drive file ID, file URL or reference, upload time, form ID,
            submission ID, and upload status. FormOS stores OAuth connection data
            and tokens securely server-side to keep the integration working.
          </p>
          <p className="mt-2">
            Disconnecting Google Drive stops future uploads through FormOS. Files
            already stored in the user&apos;s Google Drive remain under the
            user&apos;s control.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-slate-900">User Control and Revocation</h3>
          <p className="mt-2">
            Users can disconnect Google Drive from FormOS. Users can also revoke
            FormOS access from their Google Account permissions page. After
            revocation, FormOS cannot upload files to that Drive account unless
            the user reconnects it.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-slate-900">Data Protection</h3>
          <p className="mt-2">
            Dashboard and integration pages require authentication. Ownership
            checks protect forms and submissions. OAuth tokens are not exposed to
            public users. FormOS uses reasonable technical and organizational
            safeguards to protect connected storage metadata and integration
            credentials.
          </p>
        </div>
      </div>
    </section>
  );
}

export default async function PrivacyPolicyPage() {
  const cmsPage = await getPublishedCmsPage("privacy-policy");

  if (cmsPage) {
    const html = renderCmsContent(cmsPage.content);
    const hasGoogleDisclosure = cmsPage.content?.includes(
      "Google User Data and Google Drive Integration",
    );

    return (
      <LegalPageLayout
        description={cmsPage.excerpt ?? "How FormOS handles data and privacy."}
        title={cmsPage.title}
      >
        {html ? (
          <div dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <p>This page is being updated.</p>
        )}
        {!hasGoogleDisclosure ? <GoogleUserDataDisclosure /> : null}
      </LegalPageLayout>
    );
  }

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
      <GoogleUserDataDisclosure />
      <section>
        <h2 className="text-lg font-semibold text-slate-950">Email notifications</h2>
        <p className="mt-2">FormOS may send signup, login, submission, and completed PDF notifications using the configured email provider. Emails avoid storage tokens and uploaded file links.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-slate-950">Cookies and sessions</h2>
        <p className="mt-2">FormOS uses cookies for session authentication and account access. Users should protect their login credentials and sign out on shared devices.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-slate-950">Third-party advertising</h2>
        <p className="mt-2">FormOS may display third-party advertising on public pages or free-plan public forms. Ad providers may use cookies or similar technologies subject to their own policies.</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-slate-950">Data retention and contact</h2>
        <p className="mt-2">Data is retained while accounts and forms remain active, unless deleted or changed by the form owner. Contact <a className="font-medium text-blue-700 hover:text-blue-800" href="mailto:staff@mediacode.com.au">staff@mediacode.com.au</a> for privacy questions.</p>
      </section>
    </LegalPageLayout>
  );
}
