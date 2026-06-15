import { SubmitButton } from "@/components/ui/submit-button";
import {
  getUserPlanAccess,
  limitLabel,
  UNLIMITED_EVERYTHING_LIMITS,
} from "@/lib/plans/limits";
import { getPlatformSettings } from "@/lib/platform/settings";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceOwner } from "@/lib/workspaces/access";

type BillingPageProps = {
  searchParams: Promise<{
    checkout?: string;
    error?: string;
    success?: string;
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

function isActiveSubscribedStatus(status: string | null | undefined) {
  return status === "ACTIVE" || status === "TRIALING";
}

function isManualStatus(status: string | null | undefined) {
  return status === "MANUAL";
}

function isPaidPrice(value: unknown) {
  const amount = Number(value);

  return Number.isFinite(amount) && amount > 0;
}

function isPaidStripeStatus(status: string | null | undefined) {
  return ["ACTIVE", "TRIALING", "PAST_DUE", "INCOMPLETE"].includes(status ?? "");
}

function isUnlimitedOverride(limits: unknown) {
  return (
    JSON.stringify(limits) === JSON.stringify(UNLIMITED_EVERYTHING_LIMITS)
  );
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const context = await requireWorkspaceOwner();
  const user = context.user;

  const { checkout, error, success } = await searchParams;
  const [access, subscription, plans, override, platformSettings] = await Promise.all([
    getUserPlanAccess(user.id),
    prisma.userSubscription.findUnique({
      where: { userId: user.id },
      select: {
        status: true,
        planId: true,
        billingProvider: true,
        currentPeriodEnd: true,
        trialStartedAt: true,
        trialEndsAt: true,
        trialUsedAt: true,
        cancelAtPeriodEnd: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
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
    getPlatformSettings(),
  ]);
  const subscriptionStatus = subscription?.status ?? access.plan.status ?? "FREE";
  const trialEligible =
    platformSettings.trialEnabled &&
    !subscription?.trialUsedAt &&
    !isPaidStripeStatus(subscriptionStatus);
  const canManageBilling = Boolean(subscription?.stripeCustomerId);
  const canManageStripeSubscription = Boolean(
    subscription?.stripeSubscriptionId &&
      subscription.billingProvider === "stripe" &&
      subscriptionStatus !== "CANCELED",
  );

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
        {success ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {success}
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
        {subscriptionStatus === "TRIALING" ? (
          <section className="rounded-md border border-blue-200 bg-blue-50 p-5 text-blue-900">
            <h2 className="font-semibold">
              You are on a {access.plan.name} trial.
            </h2>
            <p className="mt-1 text-sm">
              Trial ends on {formatDate(subscription?.trialEndsAt ?? subscription?.currentPeriodEnd)}.
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
              {subscriptionStatus === "TRIALING" ? (
                <p className="mt-1 text-sm font-medium text-blue-700">
                  Trial ends: {formatDate(subscription?.trialEndsAt)}
                </p>
              ) : null}
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
            {canManageBilling ? (
              <p className="mt-2 max-w-xl text-xs leading-5 text-slate-500">
                To cancel or update your subscription, open the Stripe billing
                portal. If you do not see a cancel option in Stripe, enable
                subscription cancellation in your Stripe Customer Portal settings.
              </p>
            ) : null}
          </form>

          {canManageStripeSubscription ? (
            <div className="flex flex-wrap gap-3">
              {subscription?.cancelAtPeriodEnd ? (
                <form action="/api/billing/resume" method="post">
                  <SubmitButton
                    className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                    pendingText="Resuming subscription..."
                  >
                    Resume Subscription
                  </SubmitButton>
                </form>
              ) : (
                <form action="/api/billing/cancel" method="post">
                  <SubmitButton
                    className="rounded-md border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-50"
                    pendingText="Canceling subscription..."
                  >
                    Cancel Subscription
                  </SubmitButton>
                </form>
              )}
            </div>
          ) : null}
        </section>

        <section className="grid gap-4">
          <h2 className="text-xl font-semibold text-slate-950">
            Upgrade or Change Plan
          </h2>
          <div className="grid gap-4 lg:grid-cols-3">
            {plans.map((plan) => {
              const isCurrentActiveSubscribedPlan =
                subscription?.planId === plan.id &&
                isActiveSubscribedStatus(subscriptionStatus);
              const isCurrentManualPlan =
                subscription?.planId === plan.id && isManualStatus(subscriptionStatus);
              const monthlyDisabled =
                isCurrentActiveSubscribedPlan ||
                isCurrentManualPlan ||
                !isPaidPrice(plan.priceMonthly) ||
                !plan.stripeMonthlyPriceId;
              const yearlyDisabled =
                isCurrentActiveSubscribedPlan ||
                isCurrentManualPlan ||
                !isPaidPrice(plan.priceYearly) ||
                !plan.stripeYearlyPriceId;
              const monthlyButtonText = isCurrentActiveSubscribedPlan
                ? "Currently Subscribed"
                : isCurrentManualPlan
                  ? "Manually Assigned"
                  : trialEligible
                    ? `Start ${platformSettings.trialDays}-day free trial`
                    : "Choose Monthly";
              const yearlyButtonText = isCurrentActiveSubscribedPlan
                ? "Currently Subscribed"
                : isCurrentManualPlan
                  ? "Manually Assigned"
                  : trialEligible
                    ? `Start ${platformSettings.trialDays}-day free trial`
                    : "Choose Yearly";

              return (
                <article
                  className="grid gap-4 rounded-md border border-slate-200 bg-white p-5 shadow-sm"
                  key={plan.id}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-950">
                        {plan.name}
                      </h3>
                      {isCurrentActiveSubscribedPlan ? (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                          Current Plan
                        </span>
                      ) : null}
                      {isCurrentManualPlan ? (
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                          Manually Assigned
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 min-h-12 text-sm leading-6 text-slate-600">
                      {plan.description}
                    </p>
                    {isCurrentManualPlan ? (
                      <p className="mt-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-900">
                        This plan was assigned by an administrator.
                      </p>
                    ) : null}
                    {trialEligible ? (
                      <p className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-900">
                        Includes a {platformSettings.trialDays}-day free trial.
                      </p>
                    ) : null}
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
                        disabled={monthlyDisabled}
                        pendingText="Redirecting to checkout..."
                        showStatus={false}
                      >
                        {monthlyButtonText}
                      </SubmitButton>
                    </form>
                    <form action="/api/billing/checkout" method="post">
                      <input name="planId" type="hidden" value={plan.id} />
                      <input name="interval" type="hidden" value="yearly" />
                      <SubmitButton
                        className="w-full rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={yearlyDisabled}
                        pendingText="Redirecting to checkout..."
                        showStatus={false}
                      >
                        {yearlyButtonText}
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
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
