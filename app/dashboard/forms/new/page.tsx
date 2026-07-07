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
    category?: string;
  }>;
};

function safeTemplateParam(value: string | undefined) {
  return value && /^[a-z0-9-]+$/.test(value) ? value : "";
}

function categorySlug(category: string) {
  return category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default async function NewFormPage({ searchParams }: NewFormPageProps) {
  const context = await requireWorkspaceAdminOrOwner();
  const { error, template, category } = await searchParams;
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

  const allCategories = [
    ...new Set(WORKFLOW_TEMPLATES.map((item) => item.category)),
  ];
  const activeCategory =
    allCategories.find((item) => categorySlug(item) === category) ?? null;
  const templateParamSuffix = selectedTemplateSlug
    ? `&template=${selectedTemplateSlug}`
    : "";
  const categoryFilters = [
    { label: "All", slug: "", count: templateCards.length },
    ...allCategories.map((item) => ({
      label: item,
      slug: categorySlug(item),
      count: templateCards.filter((card) => card.template.category === item)
        .length,
    })),
  ];
  const visibleCards = activeCategory
    ? templateCards.filter((card) => card.template.category === activeCategory)
    : templateCards;

  return (
    <main className="min-h-screen px-4 py-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <Link className="text-sm font-semibold text-blue-700 hover:text-blue-800" href="/dashboard/forms">
            Forms
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            Create a workflow
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Start from a proven template or create a clean blank form. Builder,
            publishing, and submissions remain one step away.
          </p>
        </header>

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        {selectedTemplate ? (
          <section className="rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-5 text-teal-950 shadow-sm">
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
          className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
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
              className="rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              name="title"
              required
              type="text"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
            Description
            <textarea
              className="min-h-28 rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              name="description"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
            Mode
            <select
              className="rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
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
              className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-950/20 transition hover:bg-blue-700"
              pendingText="Creating form..."
            >
              Create Form
            </SubmitButton>
            <Link
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              href="/dashboard/forms"
            >
              Cancel
            </Link>
          </div>
        </form>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
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

          <div className="mt-4 flex flex-wrap gap-2">
            {categoryFilters.map((filter) => {
              const isActive = filter.slug === (activeCategory ? categorySlug(activeCategory) : "");
              const href = filter.slug
                ? `/dashboard/forms/new?category=${filter.slug}${templateParamSuffix}`
                : `/dashboard/forms/new${selectedTemplateSlug ? `?template=${selectedTemplateSlug}` : ""}`;

              return (
                <Link
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    isActive
                      ? "border-teal-300 bg-teal-600 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                  href={href}
                  key={filter.slug || "all"}
                >
                  {filter.label}
                  <span
                    className={`ml-1.5 ${isActive ? "text-teal-100" : "text-slate-400"}`}
                  >
                    {filter.count}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="mt-5 grid gap-3">
            {visibleCards.map(({ access: templateAccess, selected, template }) => (
              <article
                className={`grid gap-4 rounded-2xl border p-4 shadow-sm sm:grid-cols-[1fr_auto] sm:items-center ${
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
                      className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                      pendingText="Creating template..."
                    >
                      {templateAccess.ctaLabel}
                    </SubmitButton>
                  </form>
                ) : templateAccess.formLimitReached ? (
                  <button
                    className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-500"
                    disabled
                    type="button"
                  >
                    {templateAccess.ctaLabel}
                  </button>
                ) : (
                  <Link
                    className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
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
