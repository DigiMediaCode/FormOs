import { FormStatus } from "@prisma/client";
import Link from "next/link";
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
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
              Dashboard
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950">Forms</h1>
          </div>

          {canManageForms ? (
            <Link
              className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
              href="/dashboard/forms/new"
            >
              Create Form
            </Link>
          ) : null}
        </header>

        {canManageForms ? (
        <section className="rounded-md border border-slate-200 bg-white p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
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
              className="rounded-md border border-teal-700 bg-white px-4 py-2.5 text-sm font-medium text-teal-800 transition hover:bg-teal-50"
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
                      className="h-full w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm font-medium text-slate-900 transition hover:border-teal-200 hover:bg-teal-50"
                      pendingText="Creating..."
                      showStatus={false}
                    >
                      <span className="block text-xs font-medium text-teal-700">
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
                    className="block h-full rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm font-medium text-slate-900 transition hover:border-blue-200 hover:bg-blue-50"
                    href={
                      templateAccess.formLimitReached
                        ? "/dashboard/settings/billing"
                        : "/dashboard/settings/billing"
                    }
                  >
                    <span className="block text-xs font-medium text-teal-700">
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
          <section className="rounded-xl border border-dashed border-blue-200 bg-blue-50 p-8">
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
          <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
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
                      <dl className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <dt className="font-medium text-slate-950">Mode</dt>
                          <dd>{form.mode}</dd>
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
                            <Link className="text-teal-700 hover:text-teal-800" href={publicPath}>
                              {publicPath}
                            </Link>
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      <Link
                        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
                        href={`/dashboard/forms/${form.id}`}
                      >
                        Manage
                      </Link>

                      {canManageForms ? (
                      <form action={isPublished ? unpublishForm.bind(null, form.id) : publishForm.bind(null, form.id)}>
                        <SubmitButton
                          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isArchived}
                          pendingText={isPublished ? "Unpublishing form..." : "Publishing form..."}
                          showStatus={false}
                        >
                          {isPublished ? "Unpublish" : "Publish"}
                        </SubmitButton>
                      </form>
                      ) : null}

                      {canManageForms ? (
                      <form action={archiveForm.bind(null, form.id)}>
                        <SubmitButton
                          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isArchived}
                          pendingText="Archiving form..."
                          showStatus={false}
                        >
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
