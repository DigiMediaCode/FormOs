import Link from "next/link";
import { FormStatus, UserRole } from "@prisma/client";
import { CheckCircle2, Circle } from "lucide-react";
import {
  hideOnboardingChecklist,
  showOnboardingChecklist,
} from "@/app/dashboard/onboarding-actions";
import { resendVerificationEmailAction } from "@/app/(auth)/verification-actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { getResolvedUploadProvider } from "@/lib/integrations/upload-settings";
import { prisma } from "@/lib/prisma";
import {
  allowedFieldTypeLabels,
  featureLabels,
  getUserPlanAccess,
  limitLabel,
} from "@/lib/plans/limits";
import { getWorkspaceContextForCurrentUser } from "@/lib/workspaces/access";

type ChecklistItem = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  actionLabel: string;
  href?: string;
  formAction?: () => Promise<void>;
};

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
  const [access, businessProfile, uploadProvider, onboardingState, formStats] = ownerId
    ? await Promise.all([
        getUserPlanAccess(ownerId),
        prisma.businessProfile.findUnique({
          where: { userId: ownerId },
          select: { companyName: true, billingName: true },
        }),
        getResolvedUploadProvider(ownerId),
        prisma.userOnboardingState.findUnique({
          where: { userId: ownerId },
          select: { dismissedAt: true, completedAt: true },
        }),
        prisma.form.findMany({
          where: { ownerId },
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            status: true,
            _count: {
              select: { submissions: true },
            },
            submissions: {
              where: {
                officeCompletedAt: {
                  not: null,
                },
              },
              select: { id: true },
              take: 1,
            },
          },
        }),
      ])
    : [null, null, null, null, []];
  const shouldShowVerificationBanner =
    user && !user.emailVerifiedAt && user.role !== UserRole.SUPER_ADMIN;
  const shouldShowBusinessProfilePrompt =
    user &&
    workspaceContext?.isOwner &&
    (!businessProfile || (!businessProfile.companyName && !businessProfile.billingName));
  const publishedForm = formStats.find(
    (form) => form.status === FormStatus.PUBLISHED,
  );
  const submissionCount = formStats.reduce(
    (total, form) => total + form._count.submissions,
    0,
  );
  const hasFinalizedSubmission = formStats.some(
    (form) => form.submissions.length > 0,
  );
  const canUseStorage =
    Boolean(access?.limits.allowGoogleDrive) || Boolean(access?.limits.allowDropbox);
  const canGeneratePdf = Boolean(access?.limits.allowPdfGeneration);
  const checklistItems: ChecklistItem[] =
    user && access && uploadProvider
      ? [
          {
            id: "verify-email",
            title: "Verify your email",
            description: "Protect your account and receive important notifications.",
            completed: Boolean(user.emailVerifiedAt),
            actionLabel: user.emailVerifiedAt ? "Verified" : "Resend Verification",
            formAction: user.emailVerifiedAt ? undefined : resendVerificationEmailAction,
          },
          {
            id: "business-profile",
            title: "Complete your business profile",
            description: "Add business details for billing, invoices, and workspace setup.",
            completed: Boolean(
              businessProfile?.companyName || businessProfile?.billingName,
            ),
            actionLabel: "Complete Profile",
            href: "/dashboard/settings/profile",
          },
          {
            id: "plan",
            title: "Choose or confirm your plan",
            description: `Current plan: ${access.plan.name}. Review billing when needed.`,
            completed: true,
            actionLabel: "View Billing",
            href: "/dashboard/settings/billing",
          },
          {
            id: "storage",
            title: "Connect Google Drive or Dropbox",
            description: canUseStorage
              ? "Choose where uploaded files from public forms should be stored."
              : "Storage uploads are available on paid plans.",
            completed: canUseStorage && Boolean(uploadProvider.activeProvider),
            actionLabel: canUseStorage ? "Connect Storage" : "Upgrade Plan",
            href: canUseStorage
              ? "/dashboard/settings/integrations"
              : "/dashboard/settings/billing",
          },
          {
            id: "first-form",
            title: "Create your first form",
            description: "Start with a blank form or use an agreement template.",
            completed: formStats.length > 0,
            actionLabel: "Create Form",
            href: "/dashboard/forms/new",
          },
          {
            id: "publish-form",
            title: "Publish your form",
            description: "Published forms can receive public submissions.",
            completed: Boolean(publishedForm),
            actionLabel: "View Forms",
            href: "/dashboard/forms",
          },
          {
            id: "public-link",
            title: "Copy your public link or QR code",
            description: "Share your published form link or downloadable QR code.",
            completed: Boolean(publishedForm),
            actionLabel: "Open Form Details",
            href: publishedForm ? `/dashboard/forms/${publishedForm.id}` : "/dashboard/forms",
          },
          {
            id: "test-response",
            title: "Submit a test response",
            description: "Test the public form flow before sending it to customers.",
            completed: submissionCount > 0,
            actionLabel: "View Forms",
            href: "/dashboard/forms",
          },
          {
            id: "finalize-submission",
            title: "Finalize a submission and send PDF",
            description: canGeneratePdf
              ? "Complete office fields and send the completed PDF."
              : "Completed PDF generation is available on plans with PDF support.",
            completed: canGeneratePdf && hasFinalizedSubmission,
            actionLabel: canGeneratePdf ? "View Submissions" : "Upgrade Plan",
            href: canGeneratePdf ? "/dashboard/forms" : "/dashboard/settings/billing",
          },
        ]
      : [];
  const completedChecklistCount = checklistItems.filter((item) => item.completed).length;
  const checklistTotal = checklistItems.length;
  const checklistComplete =
    checklistTotal > 0 && completedChecklistCount === checklistTotal;
  const shouldRenderOnboarding =
    Boolean(workspaceContext?.isOwner && access && user) &&
    !onboardingState?.dismissedAt;

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

        {shouldRenderOnboarding ? (
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-blue-700">
                  Setup Progress
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  Set up your FormOS workspace
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {completedChecklistCount} / {checklistTotal} completed
                </p>
              </div>
              <form action={hideOnboardingChecklist}>
                <SubmitButton
                  className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
                  pendingText="Hiding checklist..."
                  showStatus={false}
                >
                  Hide setup checklist
                </SubmitButton>
              </form>
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{
                  width: `${checklistTotal ? (completedChecklistCount / checklistTotal) * 100 : 0}%`,
                }}
              />
            </div>

            {checklistComplete ? (
              <p className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                Your FormOS workspace is ready.
              </p>
            ) : null}

            <div className="mt-6 grid gap-3">
              {checklistItems.map((item) => (
                <div
                  className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-[auto_1fr_auto] md:items-center"
                  key={item.id}
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${
                      item.completed
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-white text-slate-400"
                    }`}
                  >
                    {item.completed ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-950">{item.title}</h3>
                      {item.completed ? (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          Complete
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {item.description}
                    </p>
                  </div>
                  {item.formAction ? (
                    <form action={item.formAction}>
                      <SubmitButton
                        className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 md:w-fit"
                        pendingText="Sending..."
                        showStatus={false}
                      >
                        {item.actionLabel}
                      </SubmitButton>
                    </form>
                  ) : item.href ? (
                    <Link
                      className={`inline-flex w-full justify-center rounded-md px-4 py-2.5 text-sm font-medium transition md:w-fit ${
                        item.completed
                          ? "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                      href={item.href}
                    >
                      {item.actionLabel}
                    </Link>
                  ) : (
                    <span className="rounded-md border border-slate-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-slate-500">
                      {item.actionLabel}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : workspaceContext?.isOwner && onboardingState?.dismissedAt ? (
          <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-950">
                  Setup checklist is hidden.
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Show it again if you want to review workspace setup steps.
                </p>
              </div>
              <form action={showOnboardingChecklist}>
                <SubmitButton
                  className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
                  pendingText="Showing checklist..."
                  showStatus={false}
                >
                  Show setup checklist
                </SubmitButton>
              </form>
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
