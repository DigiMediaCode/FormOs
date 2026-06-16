import { FormStatus } from "@prisma/client";
import Link from "next/link";
import {
  Archive,
  ClipboardList,
  Eye,
  FilePenLine,
  FileText,
  Globe2,
  Share2,
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

function smallActionClass(kind: "primary" | "secondary" | "muted" = "secondary") {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

  if (kind === "primary") {
    return `${base} bg-blue-600 text-white shadow-sm shadow-blue-950/15 hover:bg-blue-700`;
  }

  if (kind === "muted") {
    return `${base} border border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white hover:text-slate-900`;
  }

  return `${base} border border-slate-200 bg-white text-slate-800 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800`;
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
    <main className="min-h-screen px-4 py-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
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
              className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-950/20 transition hover:bg-blue-700 sm:mt-0"
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
              className="rounded-2xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:border-blue-200 hover:bg-blue-50"
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
          <section className="rounded-3xl border border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-white p-8 shadow-sm">
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
                  className="inline-flex rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                  href="/dashboard/forms/new"
                >
                  Browse templates
                </Link>
                <Link
                  className="inline-flex rounded-2xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-blue-50"
                  href="/dashboard/forms/new#blank-form"
                >
                  Create blank form
                </Link>
              </div>
            ) : null}
          </section>
        ) : (
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-slate-950">
                {forms.length} {forms.length === 1 ? "workflow" : "workflows"}
              </p>
              <p className="text-xs text-slate-500">
                Manage forms, submissions, sharing, and publishing from one place.
              </p>
            </div>
            <div className="grid gap-0 divide-y divide-slate-200">
              {forms.map((form) => {
                const isPublished = form.status === FormStatus.PUBLISHED;
                const isArchived = form.status === FormStatus.ARCHIVED;
                const publicPath = `/f/${form.id}`;

                return (
                  <article
                    className="grid gap-4 p-4 hover:bg-slate-50/60 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start"
                    key={form.id}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="min-w-0 text-base font-semibold text-slate-950">
                          {form.title}
                        </h2>
                        <StatusBadge status={form.status} />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1">
                          {form.mode}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1">
                          {form._count.submissions} submissions
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1">
                          Updated {formatDate(form.updatedAt)}
                        </span>
                        <Link
                          className="min-w-0 max-w-full truncate rounded-full bg-blue-50 px-2.5 py-1 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                          href={publicPath}
                        >
                          {publicPath}
                        </Link>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 lg:min-w-[36rem]">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <Link
                        className={smallActionClass("primary")}
                        href={`/dashboard/forms/${form.id}`}
                      >
                        <Eye className="h-4 w-4" />
                        Manage
                      </Link>
                      <Link
                        className={smallActionClass()}
                        href={`/dashboard/forms/${form.id}/builder`}
                      >
                        <FilePenLine className="h-4 w-4" />
                        Builder
                      </Link>
                      <Link
                        className={smallActionClass()}
                        href={`/dashboard/forms/${form.id}/submissions`}
                      >
                        <ClipboardList className="h-4 w-4" />
                        Submissions
                      </Link>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                      <Link
                        className={smallActionClass("muted")}
                        href={publicPath}
                      >
                        <Globe2 className="h-4 w-4" />
                        Public
                      </Link>
                      <Link
                        className={smallActionClass("muted")}
                        href={`/dashboard/forms/${form.id}#qr-code`}
                      >
                        <QrCode className="h-4 w-4" />
                        QR
                      </Link>
                      <Link
                        className={smallActionClass("muted")}
                        href={`/dashboard/forms/${form.id}#embed-form`}
                      >
                        <Share2 className="h-4 w-4" />
                        Embed
                      </Link>

                      {canManageForms ? (
                      <form action={isPublished ? unpublishForm.bind(null, form.id) : publishForm.bind(null, form.id)}>
                        <SubmitButton
                          className={`w-full ${smallActionClass("muted")}`}
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
                          className={`w-full ${smallActionClass("muted")}`}
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
