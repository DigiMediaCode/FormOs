import Link from "next/link";
import { UserRole } from "@prisma/client";
import { resendVerificationEmailAction } from "@/app/(auth)/verification-actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { prisma } from "@/lib/prisma";
import {
  allowedFieldTypeLabels,
  featureLabels,
  getUserPlanAccess,
  limitLabel,
} from "@/lib/plans/limits";
import { getWorkspaceContextForCurrentUser } from "@/lib/workspaces/access";

type DashboardPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { error, success } = await searchParams;
  const workspaceContext = await getWorkspaceContextForCurrentUser();
  const user = workspaceContext?.user ?? null;
  const ownerId = workspaceContext?.ownerId ?? user?.id;
  const [access, businessProfile] = ownerId
    ? await Promise.all([
        getUserPlanAccess(ownerId),
        prisma.businessProfile.findUnique({
          where: { userId: ownerId },
          select: { companyName: true },
        }),
      ])
    : [null, null];
  const shouldShowVerificationBanner =
    user && !user.emailVerifiedAt && user.role !== UserRole.SUPER_ADMIN;
  const shouldShowBusinessProfilePrompt =
    user &&
    workspaceContext?.isOwner &&
    (!businessProfile || !businessProfile.companyName);

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
              Dashboard
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950">
              FormOS Dashboard
            </h1>
            <p className="mt-3 text-base text-slate-700">
              Signed in as {user?.name ? `${user.name} (${user.email})` : user?.email}.
            </p>
            {workspaceContext && !workspaceContext.isOwner ? (
              <p className="mt-2 text-sm text-slate-600">
                Workspace: {workspaceContext.workspace.name || "My Workspace"} -{" "}
                Role: {workspaceContext.role}
              </p>
            ) : null}
          </div>
        </header>

        {success ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {success}
          </p>
        ) : null}

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        {shouldShowVerificationBanner ? (
          <section className="rounded-md border border-amber-200 bg-amber-50 p-5 text-amber-950">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold">
                  Please verify your email address.
                </h2>
                <p className="mt-1 text-sm leading-6">
                  Verification helps keep your FormOS account secure.
                </p>
              </div>
              <form action={resendVerificationEmailAction}>
                <SubmitButton
                  className="rounded-md bg-amber-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-950"
                  pendingText="Sending verification email..."
                  showStatus={false}
                >
                  Resend verification email
                </SubmitButton>
              </form>
            </div>
          </section>
        ) : null}

        {shouldShowBusinessProfilePrompt ? (
          <section className="rounded-md border border-blue-200 bg-blue-50 p-5 text-blue-950">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold">
                  Complete your business profile to prepare your account for billing and invoices.
                </h2>
                <p className="mt-1 text-sm leading-6">
                  This is optional for now and helps future billing setup go smoothly.
                </p>
              </div>
              <Link
                className="w-fit rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
                href="/dashboard/settings/profile"
              >
                Complete Profile
              </Link>
            </div>
          </section>
        ) : null}

        {access ? (
          <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-blue-700">
                  Current Plan
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  {access.plan.name}
                </h2>
              </div>
              {access.hasCustomQuota ? (
                <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  Custom quota applied
                </span>
              ) : null}
            </div>

            {access.isUnlimitedEverything ? (
              <p className="mt-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                Unlimited access is enabled for your account.
              </p>
            ) : null}

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
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

            <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-950">
                Field types available
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                {allowedFieldTypeLabels(access.limits)}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {featureLabels(access.limits).map((feature) => (
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    feature.allowed
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                  key={feature.label}
                >
                  {feature.label}: {feature.allowed ? "Allowed" : "Blocked"}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <Link
            className="block rounded-md border border-slate-200 bg-white p-6 transition hover:border-blue-300 hover:shadow-sm"
            href="/dashboard/forms"
          >
            <p className="text-lg font-semibold text-slate-950">Forms</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
              Placeholder for form creation, publishing, and submission review.
            </p>
          </Link>
        </section>
      </div>
    </main>
  );
}
