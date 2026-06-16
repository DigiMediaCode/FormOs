import { FormStatus } from "@prisma/client";
import Link from "next/link";
import {
  Archive,
  ClipboardList,
  Eye,
  FilePenLine,
  FileText,
  Globe2,
  Plus,
  QrCode,
} from "lucide-react";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  archiveForm,
  getUserForms,
  publishForm,
  unpublishForm,
} from "@/lib/forms/actions";
import { createWorkflowTemplate } from "@/lib/forms/templates/create-template-form";
import { getTemplateAccessStatus } from "@/lib/forms/templates/template-access";
import { WORKFLOW_TEMPLATES } from "@/lib/forms/templates/vertical-workflow-templates";
import { getUserPlanAccess } from "@/lib/plans/limits";
import { prisma } from "@/lib/prisma";
import {
  canManageWorkspaceForms,
  requireWorkspaceMember,
} from "@/lib/workspaces/access";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function StatusBadge({ status }: { status: FormStatus }) {
  const classes = {
    DRAFT: "border-amber-200 bg-amber-50 text-amber-800",
    PUBLISHED: "border-emerald-200 bg-emerald-50 text-emerald-800",
    ARCHIVED: "border-slate-200 bg-slate-100 text-slate-700",
  }[status];

  return (
    <span className={`rounded-md border px-2 py-1 text-xs font-medium ${classes}`}>
      {status}
    </span>
  );
}

export default async function FormsPage() {
  const context = await requireWorkspaceMember();
  const canManageForms = canManageWorkspaceForms(context);
  const [forms, access, activePlans] = await Promise.all([
    getUserForms(),
    getUserPlanAccess(context.ownerId),
    prisma.subscriptionPlan.findMany({
      where: { isActive: true, isPublic: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true, sortOrder: true, limits: true },
    }),
  ]);

  const templateCards = WORKFLOW_TEMPLATES.map((template) => ({
    template,
    access: getTemplateAccessStatus({
      access,
      activePlans,
      template,
    }),
  }));

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
              Workspace
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Forms
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Manage workflow forms, submissions, QR sharing, and public links.
            </p>
          </div>

          {canManageForms ? (
            <Link
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:mt-0"
              href="/dashboard/forms/new"
            >
              <Plus className="h-4 w-4" />
              Create Form
            </Link>
          ) : null}
        </header>

        {canManageForms ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                Workflow templates
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">
                Start with a complete business workflow
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                Choose from rental, trades, service booking, and event workflows
                with signatures, uploads, conditional fields, and office processing.
              </p>
            </div>
            <Link
              className="rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:border-blue-200 hover:bg-blue-50"
              href="/dashboard/forms/new"
            >
              View all templates
            </Link>
          </div>
          <div className="mt-4 grid gap-2 lg:grid-cols-5">
            {templateCards.map(({ access: templateAccess, template }) => (
              <div key={template.slug}>
                {templateAccess.canCreate ? (
                  <form action={createWorkflowTemplate} className="h-full">
                    <input name="templateSlug" type="hidden" value={template.slug} />
                    <SubmitButton
                      className="h-full w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm font-semibold text-slate-900 transition hover:border-blue-200 hover:bg-blue-50"
                      pendingText="Creating..."
                      showStatus={false}
                    >
                      <span className="block text-xs font-semibold text-blue-700">
                        {template.category}
                      </span>
                      <span className="mt-1 block">{template.title}</span>
                      <span className="mt-2 block text-[11px] font-normal text-slate-500">
                        {templateAccess.ctaLabel}
                      </span>
                    </SubmitButton>
                  </form>
                ) : (
                  <Link
                    className="block h-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm font-semibold text-slate-900 transition hover:border-blue-200 hover:bg-blue-50"
                    href={
                      templateAccess.formLimitReached
                        ? "/dashboard/settings/billing"
                        : "/dashboard/settings/billing"
                    }
                  >
                    <span className="block text-xs font-semibold text-blue-700">
                      {template.category}
                    </span>
                    <span className="mt-1 block">{template.title}</span>
                    <span className="mt-2 block text-[11px] font-normal text-slate-500">
                      {templateAccess.minimumPlanName
                        ? `Requires ${templateAccess.minimumPlanName}`
                        : templateAccess.ctaLabel}
                    </span>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
        ) : null}

        {forms.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-blue-200 bg-blue-50 p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">
              Start with a workflow, not a blank page.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
              Templates help you launch a complete process with customer intake,
              uploads, signatures, Office Use Only fields, and PDF-ready
              structure already in place.
            </p>
            {canManageForms ? (
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  className="inline-flex rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                  href="/dashboard/forms/new"
                >
                  Browse templates
                </Link>
                <Link
                  className="inline-flex rounded-md border border-blue-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-blue-50"
                  href="/dashboard/forms/new#blank-form"
                >
                  Create blank form
                </Link>
              </div>
            ) : null}
          </section>
        ) : (
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-sm font-semibold text-slate-950">
                {forms.length} {forms.length === 1 ? "workflow" : "workflows"}
              </p>
            </div>
            <div className="grid gap-0">
              {forms.map((form) => {
                const isPublished = form.status === FormStatus.PUBLISHED;
                const isArchived = form.status === FormStatus.ARCHIVED;
                const publicPath = `/f/${form.id}`;

                return (
                  <article
                    className="grid gap-5 border-b border-slate-200 p-5 last:border-b-0 lg:grid-cols-[1fr_auto]"
                    key={form.id}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-lg font-semibold text-slate-950">
                          {form.title}
                        </h2>
                        <StatusBadge status={form.status} />
                      </div>
                      <dl className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-5">
                        <div>
                          <dt className="font-medium text-slate-950">Mode</dt>
                          <dd>{form.mode}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-slate-950">Submissions</dt>
                          <dd>{form._count.submissions}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-slate-950">Created</dt>
                          <dd>{formatDate(form.createdAt)}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-slate-950">Updated</dt>
                          <dd>{formatDate(form.updatedAt)}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-slate-950">Public link</dt>
                          <dd>
                            <Link className="text-blue-700 hover:text-blue-800" href={publicPath}>
                              {publicPath}
                            </Link>
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      <Link
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                        href={`/dashboard/forms/${form.id}`}
                      >
                        <Eye className="h-4 w-4" />
                        Manage
                      </Link>
                      <Link
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                        href={`/dashboard/forms/${form.id}/builder`}
                      >
                        <FilePenLine className="h-4 w-4" />
                        Builder
                      </Link>
                      <Link
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                        href={`/dashboard/forms/${form.id}/submissions`}
                      >
                        <ClipboardList className="h-4 w-4" />
                        Submissions
                      </Link>
                      <Link
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                        href={publicPath}
                      >
                        <Globe2 className="h-4 w-4" />
                        Public
                      </Link>
                      <Link
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                        href={`/dashboard/forms/${form.id}`}
                      >
                        <QrCode className="h-4 w-4" />
                        QR
                      </Link>

                      {canManageForms ? (
                      <form action={isPublished ? unpublishForm.bind(null, form.id) : publishForm.bind(null, form.id)}>
                        <SubmitButton
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isArchived}
                          pendingText={isPublished ? "Unpublishing form..." : "Publishing form..."}
                          showStatus={false}
                        >
                          <FileText className="h-4 w-4" />
                          {isPublished ? "Unpublish" : "Publish"}
                        </SubmitButton>
                      </form>
                      ) : null}

                      {canManageForms ? (
                      <form action={archiveForm.bind(null, form.id)}>
                        <SubmitButton
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isArchived}
                          pendingText="Archiving form..."
                          showStatus={false}
                        >
                          <Archive className="h-4 w-4" />
                          Archive
                        </SubmitButton>
                      </form>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
