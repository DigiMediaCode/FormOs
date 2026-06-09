import {
  createPlanAction,
  deleteSubscriptionPlan,
  seedDefaultPlansAction,
  syncPlanToStripeAction,
  toggleSubscriptionPlanStatus,
  updatePlanAction,
} from "@/app/admin/plans/actions";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { fieldTypeLabel, SUPPORTED_FIELD_TYPES } from "@/lib/forms/fields";
import {
  DEFAULT_PLAN_DEFINITIONS,
  normalizePlanLimits,
  seedDefaultPlansIfMissing,
  type PlanLimits,
} from "@/lib/plans/limits";
import { prisma } from "@/lib/prisma";
import {
  BadgeDollarSign,
  CheckCircle2,
  CircleOff,
  Layers3,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";

type AdminPlansPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

const booleanLimitFields = [
  ["allowGoogleDrive", "Google Drive uploads"],
  ["allowDropbox", "Dropbox uploads"],
  ["allowPdfGeneration", "Completed PDF generation"],
  ["allowOfficeUseFields", "Office Use Only fields"],
  ["allowTemplates", "Templates"],
  ["allowQrCode", "QR codes"],
  ["allowCustomBranding", "Custom branding"],
  ["allowTeamMembers", "Team members"],
  ["allowAdFreeForms", "Ad-free public forms"],
  ["allowEmbeds", "Form embeds"],
  ["allowApiAccess", "API access"],
] as const;

function moneyValue(value: unknown) {
  return value === null || value === undefined ? "" : String(value);
}

function formatDate(date: Date | null | undefined) {
  if (!date) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function inputClass() {
  return "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
}

function tinyLabelClass() {
  return "flex flex-col gap-1.5 text-xs font-medium text-slate-600";
}

function LimitInputs({ limits }: { limits: PlanLimits }) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 md:grid-cols-3">
        <label className={tinyLabelClass()}>
          Max forms
          <input
            className={inputClass()}
            defaultValue={limits.maxForms ?? ""}
            min={0}
            name="maxForms"
            type="number"
          />
          <span className="flex items-center gap-2 text-[11px] font-normal text-slate-500">
            <input className="size-3.5" defaultChecked={limits.maxForms === null} name="maxFormsUnlimited" type="checkbox" />
            Unlimited
          </span>
        </label>
        <label className={tinyLabelClass()}>
          Monthly submissions
          <input
            className={inputClass()}
            defaultValue={limits.maxMonthlySubmissions ?? ""}
            min={0}
            name="maxMonthlySubmissions"
            type="number"
          />
          <span className="flex items-center gap-2 text-[11px] font-normal text-slate-500">
            <input
              className="size-3.5"
              defaultChecked={limits.maxMonthlySubmissions === null}
              name="maxMonthlySubmissionsUnlimited"
              type="checkbox"
            />
            Unlimited
          </span>
        </label>
        <label className={tinyLabelClass()}>
          Team members
          <input
            className={inputClass()}
            defaultValue={limits.maxTeamMembers ?? ""}
            min={0}
            name="maxTeamMembers"
            type="number"
          />
          <span className="flex items-center gap-2 text-[11px] font-normal text-slate-500">
            <input
              className="size-3.5"
              defaultChecked={limits.maxTeamMembers === null}
              name="maxTeamMembersUnlimited"
              type="checkbox"
            />
            Unlimited
          </span>
        </label>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {booleanLimitFields.map(([name, label]) => (
          <label
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            key={name}
          >
            <input className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" defaultChecked={limits[name]} name={name} type="checkbox" />
            {label}
          </label>
        ))}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-950">
          <Layers3 className="size-4 text-blue-600" />
          Allowed Field Types
        </h4>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Use Allow all for unrestricted plans, or choose the exact field types
          this plan can save in the builder.
        </p>
        <label className="mt-3 flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            defaultChecked={limits.allowedFieldTypes === null}
            name="allowAllFieldTypes"
            type="checkbox"
          />
          Allow all field types
        </label>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {SUPPORTED_FIELD_TYPES.map((fieldType) => (
            <label
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
              key={fieldType}
            >
              <input
                className="size-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                defaultChecked={
                  limits.allowedFieldTypes === null ||
                  limits.allowedFieldTypes.includes(fieldType)
                }
                name="allowedFieldTypes"
                type="checkbox"
                value={fieldType}
              />
              {fieldTypeLabel(fieldType)}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlanForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  defaults: {
    name: string;
    slug: string;
    description: string | null;
    priceMonthly: unknown;
    priceYearly: unknown;
    stripeProductId?: string | null;
    stripeMonthlyPriceId?: string | null;
    stripeYearlyPriceId?: string | null;
    stripeSyncedAt?: Date | null;
    stripeSyncStatus?: string | null;
    stripeSyncError?: string | null;
    currency: string;
    isActive: boolean;
    isPublic: boolean;
    sortOrder: number;
    limits: unknown;
  };
  submitLabel: string;
}) {
  const limits = normalizePlanLimits(defaults.limits);

  return (
    <form action={action} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-2">
        <label className={tinyLabelClass()}>
          Name
          <input className={inputClass()} defaultValue={defaults.name} name="name" required />
        </label>
        <label className={tinyLabelClass()}>
          Slug
          <input className={inputClass()} defaultValue={defaults.slug} name="slug" required />
        </label>
      </div>
      <label className={tinyLabelClass()}>
        Description
        <textarea className="min-h-16 rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" defaultValue={defaults.description ?? ""} name="description" />
      </label>
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
        Changing a plan price creates a new Stripe Price for future subscriptions.
        Existing subscribers are not automatically migrated.
      </p>
      <div className="grid gap-3 md:grid-cols-4">
        <label className={tinyLabelClass()}>
          Monthly price
          <input className={inputClass()} defaultValue={moneyValue(defaults.priceMonthly)} min={0} name="priceMonthly" step="0.01" type="number" />
        </label>
        <label className={tinyLabelClass()}>
          Yearly price
          <input className={inputClass()} defaultValue={moneyValue(defaults.priceYearly)} min={0} name="priceYearly" step="0.01" type="number" />
        </label>
        <label className={tinyLabelClass()}>
          Currency
          <input className={inputClass()} defaultValue={defaults.currency} name="currency" />
        </label>
        <label className={tinyLabelClass()}>
          Sort order
          <input className={inputClass()} defaultValue={defaults.sortOrder} name="sortOrder" type="number" />
        </label>
      </div>
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-950">
          <BadgeDollarSign className="size-4 text-blue-600" />
          Stripe Sync
        </h4>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Product ID
            </p>
            <p className="mt-1 break-all text-xs text-slate-700">
              {defaults.stripeProductId || "Not synced"}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Monthly Price ID
            </p>
            <p className="mt-1 break-all text-xs text-slate-700">
              {defaults.stripeMonthlyPriceId || "Not synced"}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Yearly Price ID
            </p>
            <p className="mt-1 break-all text-xs text-slate-700">
              {defaults.stripeYearlyPriceId || "Not synced"}
            </p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <p className="text-xs text-slate-600">
            Status:{" "}
            <span className="font-medium text-slate-950">
              {defaults.stripeSyncStatus || "Not synced"}
            </span>
          </p>
          <p className="text-xs text-slate-600">
            Last synced:{" "}
            <span className="font-medium text-slate-950">
              {formatDate(defaults.stripeSyncedAt)}
            </span>
          </p>
        </div>
        {defaults.stripeSyncError ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
            {defaults.stripeSyncError}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-3">
        <label className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700">
          <input className="size-3.5" defaultChecked={defaults.isActive} name="isActive" type="checkbox" />
          Active
        </label>
        <label className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700">
          <input className="size-3.5" defaultChecked={defaults.isPublic} name="isPublic" type="checkbox" />
          Public
        </label>
      </div>
      <LimitInputs limits={limits} />
      <SubmitButton
        className="inline-flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        pendingText="Saving plan..."
      >
        <Save className="size-4" />
        {submitLabel}
      </SubmitButton>
    </form>
  );
}

export default async function AdminPlansPage({ searchParams }: AdminPlansPageProps) {
  await requireSuperAdmin();
  await seedDefaultPlansIfMissing();
  const { error, success } = await searchParams;
  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          subscriptions: true,
        },
      },
    },
  });
  const starterDefaults = DEFAULT_PLAN_DEFINITIONS[1];

  return (
    <main className="px-4 py-6 lg:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 overflow-hidden">
        <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
              Super Admin
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">Plans</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Create plans, set display pricing, and manage quota limits.
            </p>
          </div>
          <form action={seedDefaultPlansAction}>
            <SubmitButton
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
              pendingText="Checking default plans..."
            >
              <Sparkles className="size-4 text-blue-600" />
              Seed Default Plans
            </SubmitButton>
          </form>
        </header>

        {success ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</p> : null}
        {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}

        <section className="grid gap-3">
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-950">
            <Plus className="size-4 text-blue-600" />
            Create Plan
          </h3>
          <PlanForm
            action={createPlanAction}
            defaults={{
              ...starterDefaults,
              description: starterDefaults.description,
              limits: starterDefaults.limits,
            }}
            submitLabel="Create Plan"
          />
        </section>

        <section className="grid gap-3">
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-950">
            <Pencil className="size-4 text-blue-600" />
            Edit Plans
          </h3>
          {plans.map((plan) => (
            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm" key={plan.id}>
              <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-base font-semibold text-slate-950">{plan.name}</h4>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                        plan.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {plan.isActive ? <CheckCircle2 className="size-3" /> : <CircleOff className="size-3" />}
                      {plan.isActive ? "Active" : "Inactive"}
                    </span>
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                      {plan._count.subscriptions} assigned
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Edit plan details below, or use the controls on the right to
                    activate, deactivate, or safely delete the plan.
                  </p>
                  <dl className="mt-3 grid gap-2 text-[11px] text-slate-500 sm:grid-cols-2 xl:grid-cols-5">
                    <div>
                      <dt className="font-medium text-slate-500">Stripe Product</dt>
                      <dd className="break-all">{plan.stripeProductId || "Not synced"}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-500">Monthly Price</dt>
                      <dd className="break-all">{plan.stripeMonthlyPriceId || "Not synced"}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-500">Yearly Price</dt>
                      <dd className="break-all">{plan.stripeYearlyPriceId || "Not synced"}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-500">Sync status</dt>
                      <dd>{plan.stripeSyncStatus || "Not synced"}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-500">Last synced</dt>
                      <dd>{formatDate(plan.stripeSyncedAt)}</dd>
                    </div>
                  </dl>
                  {plan.stripeSyncError ? (
                    <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                      {plan.stripeSyncError}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    aria-label={`Edit ${plan.name}`}
                    className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                    href={`#plan-${plan.id}`}
                    title="Edit"
                  >
                    <Pencil className="size-4" />
                  </a>
                  <form action={toggleSubscriptionPlanStatus.bind(null, plan.id)}>
                    <SubmitButton
                      className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                      pendingText={plan.isActive ? "Deactivating..." : "Activating..."}
                      showStatus={false}
                      title={plan.isActive ? "Deactivate" : "Activate"}
                    >
                      <Power className="size-4" />
                    </SubmitButton>
                  </form>
                  <form action={syncPlanToStripeAction.bind(null, plan.id)}>
                    <SubmitButton
                      className="inline-flex size-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm transition hover:bg-blue-700"
                      pendingText="Syncing..."
                      showStatus={false}
                      title="Sync to Stripe"
                    >
                      <RefreshCw className="size-4" />
                    </SubmitButton>
                  </form>
                  <form action={deleteSubscriptionPlan.bind(null, plan.id)}>
                    <ConfirmSubmitButton
                      className="inline-flex size-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      confirmMessage="Are you sure you want to delete this plan? This cannot be undone."
                      disabled={plan._count.subscriptions > 0}
                      pendingText="Deleting..."
                      title="Delete"
                    >
                      <Trash2 className="size-4" />
                    </ConfirmSubmitButton>
                    {plan._count.subscriptions > 0 ? (
                      <p className="mt-1 max-w-40 text-[11px] leading-4 text-slate-500">
                        Assigned plans must be deactivated instead.
                      </p>
                    ) : null}
                  </form>
                </div>
              </div>
              <div id={`plan-${plan.id}`}>
              <PlanForm
                action={updatePlanAction.bind(null, plan.id)}
                defaults={plan}
                submitLabel="Save Plan"
              />
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
