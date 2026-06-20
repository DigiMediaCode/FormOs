import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, RefreshCw } from "lucide-react";
import {
  resetEmailTemplateAction,
  saveEmailTemplateAction,
} from "@/app/admin/email-notifications/actions";
import {
  EmailTemplateForm,
  formatDate,
} from "@/app/admin/email-notifications/email-template-form";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { EMAIL_TEMPLATE_KEYS, type EmailTemplateKey } from "@/lib/email/templates";
import { prisma } from "@/lib/prisma";

type EditEmailTemplatePageProps = {
  params: Promise<{
    templateId: string;
  }>;
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function EditEmailTemplatePage({
  params,
  searchParams,
}: EditEmailTemplatePageProps) {
  await requireSuperAdmin();
  const { templateId } = await params;
  const { error, success } = await searchParams;
  const template = await prisma.emailTemplate.findUnique({
    where: {
      id: templateId,
    },
  });

  if (!template) {
    notFound();
  }

  const editPath = `/admin/email-notifications/${template.id}`;
  const isSystemTemplate = (EMAIL_TEMPLATE_KEYS as readonly string[]).includes(
    template.key,
  );

  return (
    <main className="px-4 py-6 lg:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Super Admin / Emails / Edit
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-slate-950">
                {template.name}
              </h1>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  template.isActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {template.isActive ? "Active" : "Inactive"}
              </span>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                {isSystemTemplate ? "System" : "Custom"}
              </span>
            </div>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Key: {template.key} - Updated {formatDate(template.updatedAt)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
              href="/admin/email-notifications"
            >
              <ArrowLeft className="size-4" />
              Back to Emails
            </Link>
            {isSystemTemplate ? (
              <form
                action={resetEmailTemplateAction.bind(
                  null,
                  template.key as EmailTemplateKey,
                  editPath,
                )}
              >
                <ConfirmSubmitButton
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
                  confirmMessage="Reset this template to the FormOS default?"
                  pendingText="Resetting..."
                >
                  <RefreshCw className="size-4" />
                  Reset
                </ConfirmSubmitButton>
              </form>
            ) : null}
          </div>
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
                Edit template
              </h2>
              <p className="text-xs leading-5 text-slate-500">
                Changes apply the next time FormOS sends this email.
              </p>
            </div>
          </div>
          <EmailTemplateForm
            action={saveEmailTemplateAction}
            initialValues={template}
            keyLocked
            redirectTo={editPath}
          />
        </section>
      </div>
    </main>
  );
}
