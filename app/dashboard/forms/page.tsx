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
    "group relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

  if (kind === "primary") {
    return `${base} bg-blue-600 text-white shadow-sm shadow-blue-950/15 hover:bg-blue-700`;
  }

  if (kind === "muted") {
    return `${base} border border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white hover:text-slate-900`;
  }

  return `${base} border border-slate-200 bg-white text-slate-800 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800`;
}

function TooltipLabel({ label }: { label: string }) {
  return (
    <>
      <span className="sr-only">{label}</span>
      <span className="pointer-events-none absolute -top-9 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-950 px-2.5 py-1 text-xs font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-visible:opacity-100">
        {label}
      </span>
    </>
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
    <main className="min-h-screen px-4 py-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex sm:items-center sm:justify-between sm:rounded-3xl sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
              Workspace
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:mt-2 sm:text-3xl">
              Forms
            </h1>
            <p className="mt-1 text-sm text-slate-600 sm:mt-2">
              Manage workflow forms, submissions, QR sharing, and public links.
            </p>
          </div>

          {canManageForms ? (
            <Link
              className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-950/20 transition hover:bg-blue-700 sm:mt-0"
              href="/dashboard/forms/new"
            >
              <Plus className="h-4 w-4" />
              Create Form
            </Link>
          ) : null}
        </header>

        {canManageForms ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                Workflow templates
              </p>
              <h2 className="mt-1 text-base font-semibold text-slate-950 sm:text-lg">
                Start with a complete business workflow
              </h2>
              <p className="mt-1 hidden text-sm leading-6 text-slate-700 sm:block">
                Choose from rental, trades, service booking, and event workflows
                with signatures, uploads, conditional fields, and office processing.
              </p>
            </div>
            <Link
              className="w-fit rounded-2xl border border-blue-100 bg-white px-3 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-200 hover:bg-blue-50 sm:px-4 sm:py-2.5"
              href="/dashboard/forms/new"
            >
              View all templates
            </Link>
          </div>
          <div className="mt-3 flex snap-x gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:grid lg:grid-cols-5 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden">
            {templateCards.map(({ access: templateAccess, template }) => (
              <div className="min-w-[70%] snap-start lg:min-w-0" key={template.slug}>
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
            <div className="flex flex-col gap-1 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
              <p className="text-sm font-semibold text-slate-950">
                {forms.length} {forms.length === 1 ? "workflow" : "workflows"}
              </p>
              <p className="hidden text-xs text-slate-500 sm:block">
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
                    className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 p-3 hover:bg-slate-50/60 lg:p-4"
                    key={form.id}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          className="min-w-0 truncate text-base font-semibold text-slate-950 transition hover:text-blue-700"
                          href={`/dashboard/forms/${form.id}`}
                        >
                          {form.title}
                        </Link>
                        <StatusBadge status={form.status} />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-slate-600 sm:gap-2">
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
                          className="hidden min-w-0 max-w-full truncate rounded-full bg-blue-50 px-2.5 py-1 text-blue-700 hover:bg-blue-100 hover:text-blue-800 sm:inline"
                          href={publicPath}
                        >
                          {publicPath}
                        </Link>
                      </div>
                    </div>

                    <div className="flex items-start justify-end gap-2 lg:hidden">
                      <Link
                        aria-label="Submissions"
                        className={smallActionClass("primary")}
                        href={`/dashboard/forms/${form.id}/submissions`}
                        title="Submissions"
                      >
                        <ClipboardList className="h-4 w-4" />
                        <TooltipLabel label="Submissions" />
                      </Link>
                    </div>

                    <div className="hidden flex-col gap-2 lg:flex lg:min-w-[22rem]">
                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <Link
                          aria-label="Manage"
                          className={smallActionClass("primary")}
                          href={`/dashboard/forms/${form.id}`}
                          title="Manage"
                        >
                          <Eye className="h-4 w-4" />
                          <TooltipLabel label="Manage" />
                        </Link>
                        <Link
                          aria-label="Builder"
                          className={smallActionClass()}
                          href={`/dashboard/forms/${form.id}/builder`}
                          title="Builder"
                        >
                          <FilePenLine className="h-4 w-4" />
                          <TooltipLabel label="Builder" />
                        </Link>
                        <Link
                          aria-label="Submissions"
                          className={smallActionClass()}
                          href={`/dashboard/forms/${form.id}/submissions`}
                          title="Submissions"
                        >
                          <ClipboardList className="h-4 w-4" />
                          <TooltipLabel label="Submissions" />
                        </Link>
                      </div>
                      <div className="flex flex-wrap gap-2 lg:justify-end">
                      <Link
                        aria-label="Open public form"
                        className={smallActionClass("muted")}
                        href={publicPath}
                        title="Open public form"
                      >
                        <Globe2 className="h-4 w-4" />
                        <TooltipLabel label="Public" />
                      </Link>
                      <Link
                        aria-label="QR code"
                        className={smallActionClass("muted")}
                        href={`/dashboard/forms/${form.id}#qr-code`}
                        title="QR code"
                      >
                        <QrCode className="h-4 w-4" />
                        <TooltipLabel label="QR" />
                      </Link>
                      <Link
                        aria-label="Embed and share"
                        className={smallActionClass("muted")}
                        href={`/dashboard/forms/${form.id}#embed-form`}
                        title="Embed and share"
                      >
                        <Share2 className="h-4 w-4" />
                        <TooltipLabel label="Embed" />
                      </Link>

                      {canManageForms ? (
                      <form action={isPublished ? unpublishForm.bind(null, form.id) : publishForm.bind(null, form.id)}>
                        <SubmitButton
                          className={smallActionClass("muted")}
                          disabled={isArchived}
                          pendingText="..."
                          showStatus={false}
                          title={isPublished ? "Unpublish" : "Publish"}
                        >
                          <FileText className="h-4 w-4" />
                          <TooltipLabel label={isPublished ? "Unpublish" : "Publish"} />
                        </SubmitButton>
                      </form>
                      ) : null}

                      {canManageForms ? (
                      <form action={archiveForm.bind(null, form.id)}>
                        <SubmitButton
                          className={smallActionClass("muted")}
                          disabled={isArchived}
                          pendingText="..."
                          showStatus={false}
                          title="Archive"
                        >
                          <Archive className="h-4 w-4" />
                          <TooltipLabel label="Archive" />
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
