import Link from "next/link";
import {
  deleteSubscriptionPlan,
  seedDefaultPlansAction,
  syncPlanToStripeAction,
  toggleSubscriptionPlanStatus,
} from "@/app/admin/plans/actions";
import { formatDate } from "@/app/admin/plans/plan-form";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { fieldTypeLabel } from "@/lib/forms/fields";
import {
  featureLabels,
  limitLabel,
  normalizePlanLimits,
  seedDefaultPlansIfMissing,
} from "@/lib/plans/limits";
import { prisma } from "@/lib/prisma";
import {
  CheckCircle2,
  CircleOff,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";

type AdminPlansPageProps = {
  searchParams: Promise<{
    error?: string;
    q?: string;
    status?: string;
    success?: string;
    visibility?: string;
  }>;
};

function moneyLabel(value: unknown, currency: string) {
  if (value === null || value === undefined) {
    return "Not set";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return String(value);
  }

  return new Intl.NumberFormat("en-AU", {
    currency: currency || "AUD",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    style: "currency",
  }).format(amount);
}

function statusBadge(isActive: boolean) {
  return isActive ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
      <CheckCircle2 className="size-3" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
      <CircleOff className="size-3" />
      Inactive
    </span>
  );
}

function planTypeBadge(isPublic: boolean) {
  return (
    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
      {isPublic ? "Public" : "Private"}
    </span>
  );
}

export default async function AdminPlansPage({
  searchParams,
}: AdminPlansPageProps) {
  await requireSuperAdmin();
  await seedDefaultPlansIfMissing();

  const { error, q = "", status = "all", success, visibility = "all" } =
    await searchParams;
  const query = q.trim().toLowerCase();
  const plans = await prisma.subscriptionPlan.findMany({
    include: {
      _count: {
        select: {
          subscriptions: true,
        },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  const filteredPlans = plans.filter((plan) => {
    const matchesQuery =
      !query ||
      plan.name.toLowerCase().includes(query) ||
      plan.slug.toLowerCase().includes(query) ||
      (plan.description ?? "").toLowerCase().includes(query);
    const matchesStatus =
      status === "all" ||
      (status === "active" && plan.isActive) ||
      (status === "inactive" && !plan.isActive);
    const matchesVisibility =
      visibility === "all" ||
      (visibility === "public" && plan.isPublic) ||
      (visibility === "private" && !plan.isPublic);

    return matchesQuery && matchesStatus && matchesVisibility;
  });

  return (
    <main className="px-4 py-6 lg:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Super Admin / Plans
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950">Plans</h1>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Manage and configure subscription plans for your users.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              href="/admin/plans/new"
            >
              <Plus className="size-4" />
              Create Plan
            </Link>
            <form action={seedDefaultPlansAction}>
              <SubmitButton
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
                pendingText="Checking..."
                showStatus={false}
              >
                <Sparkles className="size-4 text-blue-600" />
                Add Default Plans
              </SubmitButton>
            </form>
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

        <form className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:grid-cols-[1fr_160px_160px]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              defaultValue={q}
              name="q"
              placeholder="Search plans..."
            />
          </label>
          <select
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            defaultValue={status}
            name="status"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            defaultValue={visibility}
            name="visibility"
          >
            <option value="all">All visibility</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </form>

        <section className="grid gap-3">
          {filteredPlans.map((plan) => {
            const limits = normalizePlanLimits(plan.limits);
            const features = featureLabels(limits)
              .filter((feature) => feature.allowed)
              .slice(0, 8);
            const fieldTypes =
              limits.allowedFieldTypes === null
                ? ["All field types"]
                : limits.allowedFieldTypes.slice(0, 8).map(fieldTypeLabel);

            return (
              <article
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                key={plan.id}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-slate-950">
                        {plan.name}
                      </h2>
                      {statusBadge(plan.isActive)}
                      {planTypeBadge(plan.isPublic)}
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {plan._count.subscriptions} users
                      </span>
                    </div>
                    <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                      {plan.description || "No description added."}
                    </p>
                  </div>
                  <p className="break-all text-xs font-medium text-slate-400">
                    {plan.stripeProductId || "Not synced"}
                  </p>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Monthly price
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {moneyLabel(plan.priceMonthly, plan.currency)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Yearly price
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {moneyLabel(plan.priceYearly, plan.currency)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Submissions
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {limitLabel(limits.maxMonthlySubmissions)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Forms
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {limitLabel(limits.maxForms)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Features</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {features.length > 0 ? (
                        features.map((feature) => (
                          <span
                            className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                            key={feature.label}
                          >
                            {feature.label}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500">
                          No paid features enabled.
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      Allowed Field Types
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {fieldTypes.map((fieldType) => (
                        <span
                          className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                          key={fieldType}
                        >
                          {fieldType}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <Link
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                    href={`/admin/plans/${plan.id}`}
                  >
                    <Pencil className="size-4" />
                    Edit Plan
                  </Link>
                  <form
                    action={syncPlanToStripeAction.bind(
                      null,
                      plan.id,
                      "/admin/plans",
                    )}
                  >
                    <SubmitButton
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
                      pendingText="Syncing..."
                      showStatus={false}
                    >
                      <RefreshCw className="size-4" />
                      Sync Stripe
                    </SubmitButton>
                  </form>
                  <form
                    action={toggleSubscriptionPlanStatus.bind(
                      null,
                      plan.id,
                      "/admin/plans",
                    )}
                  >
                    <SubmitButton
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
                      pendingText={plan.isActive ? "Deactivating..." : "Activating..."}
                      showStatus={false}
                    >
                      <Power className="size-4" />
                      {plan.isActive ? "Deactivate" : "Activate"}
                    </SubmitButton>
                  </form>
                  <form
                    action={deleteSubscriptionPlan.bind(
                      null,
                      plan.id,
                      "/admin/plans",
                    )}
                  >
                    <ConfirmSubmitButton
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      confirmMessage="Are you sure you want to delete this plan? This cannot be undone."
                      disabled={plan._count.subscriptions > 0}
                      pendingText="Deleting..."
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </ConfirmSubmitButton>
                  </form>
                </div>

                <p className="mt-3 text-[11px] text-slate-500">
                  Stripe sync: {plan.stripeSyncStatus || "Not synced"} - Last
                  synced {formatDate(plan.stripeSyncedAt)}
                </p>
                {plan.stripeSyncError ? (
                  <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                    {plan.stripeSyncError}
                  </p>
                ) : null}
              </article>
            );
          })}

          {filteredPlans.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
              <Sparkles className="mx-auto size-8 text-blue-600" />
              <h2 className="mt-3 text-base font-semibold text-slate-950">
                No plans found
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Create a plan or adjust your filters to see existing plans.
              </p>
              <Link
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                href="/admin/plans/new"
              >
                <Plus className="size-4" />
                Create Plan
              </Link>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
