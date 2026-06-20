import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { createEmailTemplateAction } from "@/app/admin/email-notifications/actions";
import { EmailTemplateForm } from "@/app/admin/email-notifications/email-template-form";
import { requireSuperAdmin } from "@/lib/admin/auth";

type NewEmailTemplatePageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function NewEmailTemplatePage({
  searchParams,
}: NewEmailTemplatePageProps) {
  await requireSuperAdmin();
  const { error, success } = await searchParams;

  return (
    <main className="px-4 py-6 lg:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Super Admin / Emails / Create
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950">
              Create Email Template
            </h1>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Create a reusable email template with plain text and optional safe HTML.
            </p>
          </div>
          <Link
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
            href="/admin/email-notifications"
          >
            <ArrowLeft className="size-4" />
            Back to Emails
          </Link>
        </header>

        {success ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {success}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Mail className="size-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-950">
                Template details
              </h2>
              <p className="text-xs leading-5 text-slate-500">
                Template keys use lowercase letters, numbers, and underscores.
              </p>
            </div>
          </div>
          <EmailTemplateForm
            action={createEmailTemplateAction}
            submitLabel="Create Template"
          />
        </section>
      </div>
    </main>
  );
}
