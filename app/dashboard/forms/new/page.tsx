import { FormMode } from "@prisma/client";
import Link from "next/link";
import { SubmitButton } from "@/components/ui/submit-button";
import { createForm } from "@/lib/forms/actions";
import { createWorkflowTemplate } from "@/lib/forms/templates/create-template-form";
import { getTemplateAccessStatus } from "@/lib/forms/templates/template-access";
import { WORKFLOW_TEMPLATES } from "@/lib/forms/templates/vertical-workflow-templates";
import { getUserPlanAccess } from "@/lib/plans/limits";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceAdminOrOwner } from "@/lib/workspaces/access";

type NewFormPageProps = {
  searchParams: Promise<{
    error?: string;
    template?: string;
  }>;
};

function safeTemplateParam(value: string | undefined) {
  return value && /^[a-z0-9-]+$/.test(value) ? value : "";
}

export default async function NewFormPage({ searchParams }: NewFormPageProps) {
  const context = await requireWorkspaceAdminOrOwner();
  const { error, template } = await searchParams;
  const selectedTemplateSlug = safeTemplateParam(template);
  const [access, activePlans] = await Promise.all([
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
    selected: template.slug === selectedTemplateSlug,
  })).sort((a, b) => Number(b.selected) - Number(a.selected));
  const selectedTemplate = templateCards.find((card) => card.selected);

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <header className="border-b border-slate-200 pb-6">
          <Link className="text-sm font-medium text-teal-700 hover:text-teal-800" href="/dashboard/forms">
            Forms
          </Link>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">
            Create form
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Add the basic shell now. Fields, builder, and submissions come later.
          </p>
        </header>

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        {selectedTemplate ? (
          <section className="rounded-md border border-teal-200 bg-teal-50 p-5 text-teal-950">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
              Recommended starting point
            </p>
            <h2 className="mt-1 text-lg font-semibold">
              Start with {selectedTemplate.template.title}
            </h2>
            <p className="mt-2 text-sm leading-6">
              This workflow came from the template page. You can create it now,
              then adjust labels, fields, and office steps in the builder.
            </p>
          </section>
        ) : null}

        <form
          action={createForm}
          className="flex flex-col gap-5 rounded-md border border-slate-200 bg-white p-6"
          id="blank-form"
        >
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Create blank form
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-700">
              Start with an empty form and add fields in the builder.
            </p>
          </div>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
            Title
            <input
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              name="title"
              required
              type="text"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
            Description
            <textarea
              className="min-h-28 rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              name="description"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
            Mode
            <select
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              defaultValue={FormMode.STANDARD}
              name="mode"
            >
              <option value={FormMode.STANDARD}>Standard</option>
              <option value={FormMode.AGREEMENT}>Agreement</option>
              <option value={FormMode.BOOKING}>Booking</option>
            </select>
          </label>

          <div className="flex flex-wrap gap-3">
            <SubmitButton
              className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
              pendingText="Creating form..."
            >
              Create Form
            </SubmitButton>
            <Link
              className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
              href="/dashboard/forms"
            >
              Cancel
            </Link>
          </div>
        </form>

        <section className="rounded-md border border-slate-200 bg-white p-6">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
              Create from workflow template
            </p>
            <h2 className="mt-2 text-lg font-semibold text-slate-950">
              Vertical workflows
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
              Start with a complete workflow: public intake, uploads, acknowledgments,
              signatures, office processing, and PDF-ready structure.
            </p>
          </div>

          <div className="mt-5 grid gap-3">
            {templateCards.map(({ access: templateAccess, selected, template }) => (
              <article
                className={`grid gap-4 rounded-md border p-4 sm:grid-cols-[1fr_auto] sm:items-center ${
                  selected
                    ? "border-teal-300 bg-teal-50"
                    : "border-slate-200 bg-slate-50"
                }`}
                key={template.slug}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-950">
                      {template.title}
                    </h3>
                    <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800">
                      {template.category}
                    </span>
                    {selected ? (
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-teal-800">
                        Selected
                      </span>
                    ) : null}
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        templateAccess.hasPlanAccess
                          ? "bg-emerald-50 text-emerald-700"
                          : templateAccess.isTrialAvailable
                            ? "bg-blue-50 text-blue-700"
                            : "bg-amber-50 text-amber-800"
                      }`}
                    >
                      {templateAccess.hasPlanAccess
                        ? "Included"
                        : templateAccess.isTrialAvailable
                          ? "Trial available"
                          : templateAccess.minimumPlanName
                            ? `Requires ${templateAccess.minimumPlanName}`
                            : "Upgrade required"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {template.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {templateAccess.featureBadges.slice(0, 7).map((badge) => (
                      <span
                        className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600"
                        key={badge}
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-xs leading-5 text-slate-600">
                    {templateAccess.message}
                  </p>
                </div>
                {templateAccess.canCreate ? (
                  <form action={createWorkflowTemplate}>
                    <input name="templateSlug" type="hidden" value={template.slug} />
                    <SubmitButton
                      className="rounded-md bg-teal-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-teal-800"
                      pendingText="Creating template..."
                    >
                      {templateAccess.ctaLabel}
                    </SubmitButton>
                  </form>
                ) : templateAccess.formLimitReached ? (
                  <button
                    className="rounded-md border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-500"
                    disabled
                    type="button"
                  >
                    {templateAccess.ctaLabel}
                  </button>
                ) : (
                  <Link
                    className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                    href="/dashboard/settings/billing"
                  >
                    {templateAccess.ctaLabel}
                  </Link>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
