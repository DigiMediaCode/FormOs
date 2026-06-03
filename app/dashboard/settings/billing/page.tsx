import { redirect } from "next/navigation";
import { SubmitButton } from "@/components/ui/submit-button";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  getUserPlanAccess,
  limitLabel,
  UNLIMITED_EVERYTHING_LIMITS,
} from "@/lib/plans/limits";
import { prisma } from "@/lib/prisma";

type BillingPageProps = {
  searchParams: Promise<{
    checkout?: string;
    error?: string;
  }>;
};

function formatMoney(value: unknown, currency: string) {
  if (value === null || value === undefined) {
    return "Contact us";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "Contact us";
  }

  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

function formatDate(date: Date | null | undefined) {
  if (!date) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
}

function statusLabel(status: string | null | undefined) {
  return status ? status.replaceAll("_", " ") : "Free";
}

function isPaidPrice(value: unknown) {
  const amount = Number(value);

  return Number.isFinite(amount) && amount > 0;
}

function isUnlimitedOverride(limits: unknown) {
  return (
    JSON.stringify(limits) === JSON.stringify(UNLIMITED_EVERYTHING_LIMITS)
  );
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { checkout, error } = await searchParams;
  const [access, subscription, plans, override] = await Promise.all([
    getUserPlanAccess(user.id),
    prisma.userSubscription.findUnique({
      where: { userId: user.id },
      select: {
        status: true,
        billingProvider: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        stripeCustomerId: true,
      },
    }),
    prisma.subscriptionPlan.findMany({
      where: {
        isActive: true,
        isPublic: true,
        slug: { not: "free" },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        description: true,
        priceMonthly: true,
        priceYearly: true,
        currency: true,
        stripeMonthlyPriceId: true,
        stripeYearlyPriceId: true,
      },
    }),
    prisma.userQuotaOverride.findUnique({
      where: { userId: user.id },
      select: {
        limits: true,
      },
    }),
  ]);
  const subscriptionStatus = subscription?.status ?? access.plan.status ?? "FREE";
  const canManageBilling = Boolean(subscription?.stripeCustomerId);

  return (
    <main className="px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header>
          <h1 className="text-3xl font-semibold text-slate-950">Billing</h1>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Manage your FormOS plan through Stripe-hosted Checkout and the
            Stripe Customer Portal.
          </p>
        </header>

        {checkout === "success" ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Checkout completed. Your subscription will update shortly.
          </p>
        ) : null}
        {checkout === "cancelled" ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Checkout was cancelled. No changes were made.
          </p>
        ) : null}
        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        {subscriptionStatus === "PAST_DUE" ? (
          <section className="rounded-md border border-amber-200 bg-amber-50 p-5 text-amber-900">
            <h2 className="font-semibold">Your payment needs attention.</h2>
            <p className="mt-1 text-sm">Please update your billing details.</p>
          </section>
        ) : null}
        {subscriptionStatus === "CANCELED" ? (
          <section className="rounded-md border border-red-200 bg-red-50 p-5 text-red-900">
            <h2 className="font-semibold">Your subscription is canceled.</h2>
            <p className="mt-1 text-sm">
              Your account may be limited to the Free plan.
            </p>
          </section>
        ) : null}

        <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                Current Plan
              </h2>
              <p className="mt-2 text-2xl font-semibold text-blue-700">
                {access.plan.name}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Status: {statusLabel(subscriptionStatus)}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Billing provider: {subscription?.billingProvider ?? "None"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Current period end: {formatDate(subscription?.currentPeriodEnd)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {override ? (
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  {isUnlimitedOverride(override.limits)
                    ? "Unlimited access granted by admin"
                    : "Custom quota applied"}
                </span>
              ) : null}
              {subscription?.cancelAtPeriodEnd ? (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                  Cancels at period end
                </span>
              ) : null}
            </div>
          </div>

          {override ? (
            <p className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              Effective access is using custom override.
            </p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Forms</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">
                {access.usage.formsUsed} / {limitLabel(access.limits.maxForms)}
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Submissions this month</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">
                {access.usage.monthlySubmissionsUsed} /{" "}
                {limitLabel(access.limits.maxMonthlySubmissions)}
              </p>
            </div>
          </div>

          <form action="/api/billing/portal" method="post">
            <SubmitButton
              className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!canManageBilling}
              pendingText="Opening billing portal..."
            >
              Manage Billing
            </SubmitButton>
            {!canManageBilling ? (
              <p className="mt-2 text-xs text-slate-500">
                A Stripe customer will be created when you start checkout.
              </p>
            ) : null}
          </form>
        </section>

        <section className="grid gap-4">
          <h2 className="text-xl font-semibold text-slate-950">
            Upgrade or Change Plan
          </h2>
          <div className="grid gap-4 lg:grid-cols-3">
            {plans.map((plan) => (
              <article
                className="grid gap-4 rounded-md border border-slate-200 bg-white p-5 shadow-sm"
                key={plan.id}
              >
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">
                    {plan.name}
                  </h3>
                  <p className="mt-1 min-h-12 text-sm leading-6 text-slate-600">
                    {plan.description}
                  </p>
                </div>
                <div className="grid gap-2 text-sm text-slate-700">
                  <p>
                    Monthly:{" "}
                    <strong>{formatMoney(plan.priceMonthly, plan.currency)}</strong>
                  </p>
                  <p>
                    Yearly:{" "}
                    <strong>{formatMoney(plan.priceYearly, plan.currency)}</strong>
                  </p>
                </div>
                <div className="grid gap-2">
                  <form action="/api/billing/checkout" method="post">
                    <input name="planId" type="hidden" value={plan.id} />
                    <input name="interval" type="hidden" value="monthly" />
                    <SubmitButton
                      className="w-full rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={
                        !isPaidPrice(plan.priceMonthly) ||
                        !plan.stripeMonthlyPriceId
                      }
                      pendingText="Redirecting to checkout..."
                      showStatus={false}
                    >
                      Choose Monthly
                    </SubmitButton>
                  </form>
                  <form action="/api/billing/checkout" method="post">
                    <input name="planId" type="hidden" value={plan.id} />
                    <input name="interval" type="hidden" value="yearly" />
                    <SubmitButton
                      className="w-full rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={
                        !isPaidPrice(plan.priceYearly) ||
                        !plan.stripeYearlyPriceId
                      }
                      pendingText="Redirecting to checkout..."
                      showStatus={false}
                    >
                      Choose Yearly
                    </SubmitButton>
                  </form>
                  {(!isPaidPrice(plan.priceMonthly) || !plan.stripeMonthlyPriceId) &&
                  (!isPaidPrice(plan.priceYearly) || !plan.stripeYearlyPriceId) ? (
                    <p className="text-xs text-slate-500">
                      Sync this plan to Stripe before users can subscribe.
                    </p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
