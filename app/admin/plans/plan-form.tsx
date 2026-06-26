import { SubmitButton } from "@/components/ui/submit-button";
import { fieldTypeLabel, SUPPORTED_FIELD_TYPES } from "@/lib/forms/fields";
import { normalizePlanLimits, type PlanLimits } from "@/lib/plans/limits";
import { BadgeDollarSign, Layers3, Save } from "lucide-react";

export const booleanLimitFields = [
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
  ["allowConditionalLogic", "Conditional logic"],
  ["allowBasicAnalytics", "Basic analytics"],
  ["allowCustomSubmissionNotifications", "Custom submission notification email"],
  ["allowClients", "Clients"],
  ["allowConvertSubmissionToClient", "Convert submissions to clients"],
  ["allowContracts", "Contracts"],
  ["allowAgreements", "Agreements"],
  ["allowDocumentTemplates", "Document templates"],
] as const;

type PlanFormDefaults = {
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

function moneyValue(value: unknown) {
  return value === null || value === undefined ? "" : String(value);
}

export function formatDate(date: Date | null | undefined) {
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
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-5">
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
            <input
              className="size-3.5"
              defaultChecked={limits.maxForms === null}
              name="maxFormsUnlimited"
              type="checkbox"
            />
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
        <label className={tinyLabelClass()}>
          Conditional rules
          <input
            className={inputClass()}
            defaultValue={limits.maxConditionalRules ?? ""}
            min={0}
            name="maxConditionalRules"
            type="number"
          />
          <span className="flex items-center gap-2 text-[11px] font-normal text-slate-500">
            <input
              className="size-3.5"
              defaultChecked={limits.maxConditionalRules === null}
              name="maxConditionalRulesUnlimited"
              type="checkbox"
            />
            Unlimited
          </span>
        </label>
        <label className={tinyLabelClass()}>
          Clients
          <input
            className={inputClass()}
            defaultValue={limits.maxClients ?? ""}
            min={0}
            name="maxClients"
            type="number"
          />
          <span className="flex items-center gap-2 text-[11px] font-normal text-slate-500">
            <input
              className="size-3.5"
              defaultChecked={limits.maxClients === null}
              name="maxClientsUnlimited"
              type="checkbox"
            />
            Unlimited
          </span>
        </label>
        <label className={tinyLabelClass()}>
          Documents / month
          <input
            className={inputClass()}
            defaultValue={limits.maxDocumentsPerMonth ?? ""}
            min={0}
            name="maxDocumentsPerMonth"
            type="number"
          />
          <span className="flex items-center gap-2 text-[11px] font-normal text-slate-500">
            <input
              className="size-3.5"
              defaultChecked={limits.maxDocumentsPerMonth === null}
              name="maxDocumentsPerMonthUnlimited"
              type="checkbox"
            />
            Unlimited
          </span>
        </label>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-slate-50">
        <div className="border-b border-slate-200 px-4 py-3">
          <h4 className="text-sm font-semibold text-slate-950">Features</h4>
        </div>
        <div className="divide-y divide-slate-200">
          {booleanLimitFields.map(([name, label]) => (
            <label
              className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-2.5 text-sm text-slate-700"
              key={name}
            >
              <span>{label}</span>
              <input
                className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                defaultChecked={limits[name]}
                name={name}
                type="checkbox"
              />
            </label>
          ))}
        </div>
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
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {SUPPORTED_FIELD_TYPES.map((fieldType) => (
            <label
              className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
              key={fieldType}
            >
              <span>{fieldTypeLabel(fieldType)}</span>
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
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PlanForm({
  action,
  defaults,
  redirectTo,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  defaults: PlanFormDefaults;
  redirectTo?: string;
  submitLabel: string;
}) {
  const limits = normalizePlanLimits(defaults.limits);

  return (
    <form
      action={action}
      className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      {redirectTo ? <input name="redirectTo" type="hidden" value={redirectTo} /> : null}
      <section className="grid gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-950">Plan Details</h3>
          <p className="mt-1 text-sm text-slate-500">
            Configure pricing, visibility, limits, and Stripe identifiers for
            this plan.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className={tinyLabelClass()}>
            Name
            <input
              className={inputClass()}
              defaultValue={defaults.name}
              name="name"
              required
            />
          </label>
          <label className={tinyLabelClass()}>
            Slug
            <input
              className={inputClass()}
              defaultValue={defaults.slug}
              name="slug"
              required
            />
          </label>
        </div>
        <label className={tinyLabelClass()}>
          Description
          <textarea
            className="min-h-20 rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            defaultValue={defaults.description ?? ""}
            name="description"
          />
        </label>
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
          Creating or editing a plan does not automatically update existing
          subscribers in Stripe. Use the Stripe sync action for product/price
          setup.
        </p>
      </section>

      <section className="grid gap-3">
        <h3 className="flex items-center gap-2 text-base font-semibold text-slate-950">
          <BadgeDollarSign className="size-4 text-blue-600" />
          Stripe Plan
        </h3>
        <div className="grid gap-3 md:grid-cols-4">
          <label className={tinyLabelClass()}>
            Monthly price
            <input
              className={inputClass()}
              defaultValue={moneyValue(defaults.priceMonthly)}
              min={0}
              name="priceMonthly"
              step="0.01"
              type="number"
            />
          </label>
          <label className={tinyLabelClass()}>
            Yearly price
            <input
              className={inputClass()}
              defaultValue={moneyValue(defaults.priceYearly)}
              min={0}
              name="priceYearly"
              step="0.01"
              type="number"
            />
          </label>
          <label className={tinyLabelClass()}>
            Currency
            <input className={inputClass()} defaultValue={defaults.currency} name="currency" />
          </label>
          <label className={tinyLabelClass()}>
            Sort order
            <input
              className={inputClass()}
              defaultValue={defaults.sortOrder}
              name="sortOrder"
              type="number"
            />
          </label>
        </div>
        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Stripe Product ID
            </p>
            <p className="mt-1 break-all text-xs text-slate-700">
              {defaults.stripeProductId || "Not synced"}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Stripe Monthly Price ID
            </p>
            <p className="mt-1 break-all text-xs text-slate-700">
              {defaults.stripeMonthlyPriceId || "Not synced"}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Stripe Yearly Price ID
            </p>
            <p className="mt-1 break-all text-xs text-slate-700">
              {defaults.stripeYearlyPriceId || "Not synced"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
          <span className="rounded-full bg-slate-100 px-3 py-1">
            Sync status:{" "}
            <strong className="font-semibold text-slate-950">
              {defaults.stripeSyncStatus || "Not synced"}
            </strong>
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1">
            Last synced:{" "}
            <strong className="font-semibold text-slate-950">
              {formatDate(defaults.stripeSyncedAt)}
            </strong>
          </span>
        </div>
        {defaults.stripeSyncError ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
            {defaults.stripeSyncError}
          </p>
        ) : null}
      </section>

      <section className="grid gap-4">
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700">
            <input
              className="size-3.5"
              defaultChecked={defaults.isActive}
              name="isActive"
              type="checkbox"
            />
            Active
          </label>
          <label className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700">
            <input
              className="size-3.5"
              defaultChecked={defaults.isPublic}
              name="isPublic"
              type="checkbox"
            />
            Public
          </label>
        </div>
        <LimitInputs limits={limits} />
      </section>

      <SubmitButton
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        pendingText="Saving plan..."
      >
        <Save className="size-4" />
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
