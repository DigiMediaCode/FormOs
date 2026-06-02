import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/public/legal-page-layout";

export const metadata: Metadata = {
  title: "Contact | FormOS",
};

export default function ContactPage() {
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
