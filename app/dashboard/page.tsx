import Link from "next/link";
import { FormStatus, UserRole } from "@prisma/client";
import { CheckCircle2, Circle } from "lucide-react";
import {
  hideOnboardingChecklist,
  showOnboardingChecklist,
} from "@/app/dashboard/onboarding-actions";
import { resendVerificationEmailAction } from "@/app/(auth)/verification-actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { getOwnerAnalyticsSummary } from "@/lib/forms/analytics";
import { getTemplateLandingPage } from "@/lib/forms/templates/template-landing-pages";
import { WORKFLOW_TEMPLATES } from "@/lib/forms/templates/vertical-workflow-templates";
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
    template?: string;
  }>;
};

function formatDate(date: Date | null | undefined) {
  if (!date) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
}

function safeTemplateParam(value: string | undefined) {
  return value && /^[a-z0-9-]+$/.test(value) ? value : "";
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { error, success, template } = await searchParams;
  const templateParam = safeTemplateParam(template);
  const workspaceContext = await getWorkspaceContextForCurrentUser();
  const user = workspaceContext?.user ?? null;
  const ownerId = workspaceContext?.ownerId ?? user?.id;
  const [
    access,
    businessProfile,
    uploadProvider,
    onboardingState,
    formStats,
    analyticsSummary,
    subscription,
  ] = ownerId
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
        getOwnerAnalyticsSummary(ownerId),
        prisma.userSubscription.findUnique({
          where: { userId: ownerId },
          select: {
            status: true,
            trialEndsAt: true,
            currentPeriodEnd: true,
            plan: {
              select: {
                name: true,
              },
            },
          },
        }),
      ])
    : [null, null, null, null, [], null, null];
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
  const selectedTemplatePage = templateParam
    ? getTemplateLandingPage(templateParam)
    : null;
  const selectedTemplate = selectedTemplatePage
    ? WORKFLOW_TEMPLATES.find(
        (workflowTemplate) =>
          workflowTemplate.slug === selectedTemplatePage.templateSlug,
      )
    : WORKFLOW_TEMPLATES.find(
        (workflowTemplate) => workflowTemplate.slug === templateParam,
      );
  const canUseStorage =
    Boolean(access?.limits.allowGoogleDrive) || Boolean(access?.limits.allowDropbox);
  const canGeneratePdf = Boolean(access?.limits.allowPdfGeneration);
  const isTrialing = subscription?.status?.toUpperCase() === "TRIALING";
  const trialPlanName = subscription?.plan?.name ?? access?.plan.name ?? "paid plan";
  const trialEndDate = subscription?.trialEndsAt ?? subscription?.currentPeriodEnd;
  const checklistItems: ChecklistItem[] =
    user && access && uploadProvider
      ? [
          {
            id: "template",
            title: "Choose a workflow template",
            description:
              "Start from a vertical workflow with uploads, signatures, office fields, and PDF-ready structure.",
            completed: formStats.length > 0,
            actionLabel: "Browse Templates",
            href: "/dashboard/forms/new",
          },
          {
            id: "first-form",
            title: "Create your first form",
            description: selectedTemplate
              ? `Use ${selectedTemplate.title} or create a blank form.`
              : "Create a template-based workflow or start from a blank form.",
            completed: formStats.length > 0,
            actionLabel: selectedTemplate ? `Start with ${selectedTemplate.title}` : "Create Form",
            href: selectedTemplate
              ? `/dashboard/forms/new?template=${selectedTemplate.slug}`
              : "/dashboard/forms/new",
          },
          {
            id: "connect-storage",
            title: "Connect Google Drive or Dropbox",
            description: canUseStorage
              ? "Choose where uploaded customer files and completed documents should be organized."
              : "Storage uploads are available on paid plans.",
            completed: canUseStorage && Boolean(uploadProvider.activeProvider),
            actionLabel: canUseStorage ? "Connect Storage" : "Upgrade Plan",
            href: canUseStorage
              ? "/dashboard/settings/integrations"
              : "/dashboard/settings/billing",
          },
          {
            id: "publish",
            title: "Publish your form",
            description: "Published forms can receive public submissions.",
            completed: Boolean(publishedForm),
            actionLabel: "View Forms",
            href: "/dashboard/forms",
          },
          {
            id: "test-response",
            title: "Submit a test response",
            description: "Test the public form flow before sending it to customers.",
            completed: submissionCount > 0,
            actionLabel: publishedForm ? "Open Public Form" : "View Forms",
            href: publishedForm ? `/f/${publishedForm.id}` : "/dashboard/forms",
          },
          {
            id: "review-submission",
            title: "Review your first submission",
            description: "Open the submission inbox and check what the customer sent.",
            completed: submissionCount > 0,
            actionLabel: "Review Submissions",
            href: publishedForm
              ? `/dashboard/forms/${publishedForm.id}/submissions`
              : "/dashboard/forms",
          },
          {
            id: "finalize-submission",
            title: "Generate/finalize PDF",
            description: canGeneratePdf
              ? "Complete office fields, finalize the submission, and create the finished PDF."
              : "Completed PDF generation is available on plans with PDF support.",
            completed: canGeneratePdf && hasFinalizedSubmission,
            actionLabel: canGeneratePdf ? "View Submissions" : "Upgrade Plan",
            href: canGeneratePdf ? "/dashboard/forms" : "/dashboard/settings/billing",
          },
          {
            id: "share",
            title: "Share your form by link, QR, or embed",
            description:
              analyticsSummary?.views && analyticsSummary.views > 0
                ? "Your form has started receiving views."
                : "Copy a public link, download a QR code, or embed the form on your website.",
            completed: Boolean(analyticsSummary?.views && analyticsSummary.views > 0),
            actionLabel: "Open Sharing Options",
            href: publishedForm ? `/dashboard/forms/${publishedForm.id}` : "/dashboard/forms",
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

        {isTrialing ? (
          <section className="rounded-xl border border-blue-200 bg-blue-50 p-5 text-blue-950">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold">
                  You are on a {trialPlanName} trial.
                </h2>
                <p className="mt-1 text-sm leading-6">
                  Trial ends on {formatDate(trialEndDate)}. Use this time to
                  publish a workflow, test a submission, and finalize a PDF.
                </p>
              </div>
              <Link
                className="w-fit rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
                href="/dashboard/settings/billing"
              >
                Manage billing
              </Link>
            </div>
          </section>
        ) : null}

        {workspaceContext?.isOwner && selectedTemplate ? (
          <section className="rounded-xl border border-teal-200 bg-teal-50 p-5 text-teal-950">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                  Template selected
                </p>
                <h2 className="mt-1 text-base font-semibold">
                  Start with {selectedTemplate.title}
                </h2>
                <p className="mt-1 text-sm leading-6">
                  Create this workflow, edit it in the builder, then publish and
                  test the public form.
                </p>
              </div>
              <Link
                className="w-fit rounded-md bg-teal-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-teal-800"
                href={`/dashboard/forms/new?template=${selectedTemplate.slug}`}
              >
                Use this template
              </Link>
            </div>
          </section>
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

        {access?.limits.allowBasicAnalytics && analyticsSummary ? (
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-blue-700">
                  Analytics
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  Last 30 days
                </h2>
              </div>
              <Link
                className="text-sm font-semibold text-blue-700 hover:text-blue-800"
                href="/dashboard/forms"
              >
                Review forms
              </Link>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Form views</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {analyticsSummary.views}
                </p>
                {analyticsSummary.views === 0 ? (
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    No views yet. Share your form link or add it to your website
                    to start collecting responses.
                  </p>
                ) : null}
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Submissions</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {analyticsSummary.submissions}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Completion rate</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {analyticsSummary.averageCompletionRate}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Top performing form</p>
                {analyticsSummary.topForm ? (
                  <Link
                    className="mt-2 block text-base font-semibold leading-6 text-slate-950 hover:text-blue-700"
                    href={`/dashboard/forms/${analyticsSummary.topForm.id}`}
                  >
                    {analyticsSummary.topForm.title}
                    <span className="mt-1 block text-xs font-medium text-slate-500">
                      {analyticsSummary.topForm.submissions} submissions
                    </span>
                  </Link>
                ) : (
                  <p className="mt-2 text-sm font-medium text-slate-600">
                    No submissions yet
                  </p>
                )}
              </div>
            </div>
          </section>
        ) : access && !access.limits.allowBasicAnalytics ? (
          <section className="rounded-md border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
            Basic analytics are not included in your current plan.
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
