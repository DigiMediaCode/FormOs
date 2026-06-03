import { createPlanAction, seedDefaultPlansAction, updatePlanAction } from "@/app/admin/plans/actions";
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
] as const;

function moneyValue(value: unknown) {
  return value === null || value === undefined ? "" : String(value);
}

function LimitInputs({ limits }: { limits: PlanLimits }) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
          Max forms
          <input
            className="rounded-md border border-slate-300 px-3 py-2"
            defaultValue={limits.maxForms ?? ""}
            min={0}
            name="maxForms"
            type="number"
          />
          <span className="flex items-center gap-2 text-xs font-normal text-slate-600">
            <input defaultChecked={limits.maxForms === null} name="maxFormsUnlimited" type="checkbox" />
            Unlimited
          </span>
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
          Monthly submissions
          <input
            className="rounded-md border border-slate-300 px-3 py-2"
            defaultValue={limits.maxMonthlySubmissions ?? ""}
            min={0}
            name="maxMonthlySubmissions"
            type="number"
          />
          <span className="flex items-center gap-2 text-xs font-normal text-slate-600">
            <input
              defaultChecked={limits.maxMonthlySubmissions === null}
              name="maxMonthlySubmissionsUnlimited"
              type="checkbox"
            />
            Unlimited
          </span>
        </label>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {booleanLimitFields.map(([name, label]) => (
          <label
            className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
            key={name}
          >
            <input defaultChecked={limits[name]} name={name} type="checkbox" />
            {label}
          </label>
        ))}
      </div>
      <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
        <h4 className="text-sm font-semibold text-slate-950">
          Allowed Field Types
        </h4>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Use Allow all for unrestricted plans, or choose the exact field types
          this plan can save in the builder.
        </p>
        <label className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-800">
          <input
            defaultChecked={limits.allowedFieldTypes === null}
            name="allowAllFieldTypes"
            type="checkbox"
          />
          Allow all field types
        </label>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {SUPPORTED_FIELD_TYPES.map((fieldType) => (
            <label
              className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              key={fieldType}
            >
              <input
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
    <form action={action} className="grid gap-5 rounded-md border border-slate-200 bg-white p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
          Name
          <input className="rounded-md border border-slate-300 px-3 py-2" defaultValue={defaults.name} name="name" required />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
          Slug
          <input className="rounded-md border border-slate-300 px-3 py-2" defaultValue={defaults.slug} name="slug" required />
        </label>
      </div>
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
        Description
        <textarea className="min-h-20 rounded-md border border-slate-300 px-3 py-2" defaultValue={defaults.description ?? ""} name="description" />
      </label>
      <div className="grid gap-4 md:grid-cols-4">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
          Monthly price
          <input className="rounded-md border border-slate-300 px-3 py-2" defaultValue={moneyValue(defaults.priceMonthly)} min={0} name="priceMonthly" step="0.01" type="number" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
          Yearly price
          <input className="rounded-md border border-slate-300 px-3 py-2" defaultValue={moneyValue(defaults.priceYearly)} min={0} name="priceYearly" step="0.01" type="number" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
          Currency
          <input className="rounded-md border border-slate-300 px-3 py-2" defaultValue={defaults.currency} name="currency" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
          Sort order
          <input className="rounded-md border border-slate-300 px-3 py-2" defaultValue={defaults.sortOrder} name="sortOrder" type="number" />
        </label>
      </div>
      <div className="flex flex-wrap gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input defaultChecked={defaults.isActive} name="isActive" type="checkbox" />
          Active
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input defaultChecked={defaults.isPublic} name="isPublic" type="checkbox" />
          Public
        </label>
      </div>
      <LimitInputs limits={limits} />
      <SubmitButton
        className="w-fit rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
        pendingText="Saving plan..."
      >
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
  });
  const starterDefaults = DEFAULT_PLAN_DEFINITIONS[1];

  return (
    <main className="px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-slate-950">Plans</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Create plans, set display pricing, and manage quota limits.
            </p>
          </div>
          <form action={seedDefaultPlansAction}>
            <SubmitButton
              className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
              pendingText="Checking default plans..."
            >
              Seed Default Plans
            </SubmitButton>
          </form>
        </header>

        {success ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</p> : null}
        {error ? <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}

        <section className="grid gap-4">
          <h3 className="text-xl font-semibold text-slate-950">Create Plan</h3>
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

        <section className="grid gap-4">
          <h3 className="text-xl font-semibold text-slate-950">Edit Plans</h3>
          {plans.map((plan) => (
            <div className="grid gap-3" key={plan.id}>
              <h4 className="text-lg font-semibold text-slate-950">{plan.name}</h4>
              <PlanForm
                action={updatePlanAction.bind(null, plan.id)}
                defaults={plan}
                submitLabel="Save Plan"
              />
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
