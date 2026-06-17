import Link from "next/link";
import { FormStatus, UserRole } from "@prisma/client";
import {
  CheckCircle2,
  ClipboardList,
  FileText,
  HardDrive,
  LayoutTemplate,
  Plug,
  Plus,
  Send,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  hideOnboardingChecklist,
  showOnboardingChecklist,
} from "@/app/dashboard/onboarding-actions";
import {
  OnboardingStepper,
  type OnboardingStepperItem,
} from "@/components/dashboard/onboarding-stepper";
import { resendVerificationEmailAction } from "@/app/(auth)/verification-actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { getOwnerAnalyticsSummary } from "@/lib/forms/analytics";
import { getTemplateLandingPage } from "@/lib/forms/templates/template-landing-pages";
import { WORKFLOW_TEMPLATES } from "@/lib/forms/templates/vertical-workflow-templates";
import { getResolvedUploadProvider } from "@/lib/integrations/upload-settings";
import { prisma } from "@/lib/prisma";
import {
  getUserPlanAccess,
} from "@/lib/plans/limits";
import { getWorkspaceContextForCurrentUser } from "@/lib/workspaces/access";

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

function submissionStatusClass(status: string) {
  const normalized = status.toUpperCase();

  if (normalized.includes("FINAL") || normalized.includes("COMPLETE")) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (normalized.includes("REVIEW")) {
    return "bg-amber-50 text-amber-800";
  }

  return "bg-blue-50 text-blue-700";
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
    recentSubmissions,
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
            title: true,
            status: true,
            updatedAt: true,
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
        prisma.formSubmission.findMany({
          where: { ownerId },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            formId: true,
            status: true,
            createdAt: true,
            form: {
              select: {
                title: true,
              },
            },
          },
        }),
      ])
    : [null, null, null, null, [], null, null, []];
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
  const publishedFormCount = formStats.filter(
    (form) => form.status === FormStatus.PUBLISHED,
  ).length;
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
  const checklistItems: OnboardingStepperItem[] =
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
  const canManageForms =
    Boolean(workspaceContext?.isOwner) || workspaceContext?.role === "ADMIN";
  const recentForms = formStats.slice(0, 3);
  const storageLabel = uploadProvider?.activeProvider
    ? uploadProvider.activeProvider.replaceAll("_", " ")
    : "Not connected";
  const quickActions = [
    canManageForms
      ? {
          href: "/dashboard/forms/new",
          label: "Create Form",
          icon: Plus,
          primary: true,
        }
      : null,
    canManageForms
      ? {
          href: "/dashboard/forms/new",
          label: "Create from Template",
          icon: LayoutTemplate,
        }
      : null,
    {
      href: publishedForm ? `/dashboard/forms/${publishedForm.id}/submissions` : "/dashboard/forms",
      label: "View Submissions",
      icon: ClipboardList,
    },
    workspaceContext?.isOwner
      ? {
          href: "/dashboard/settings/integrations",
          label: "Settings / Integrations",
          icon: Plug,
        }
      : null,
  ].filter((action): action is {
    href: string;
    label: string;
    icon: LucideIcon;
    primary?: boolean;
  } => action !== null);

  return (
    <main className="min-h-screen px-4 py-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        {workspaceContext && !workspaceContext.isOwner ? (
          <p className="w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
            Workspace: {workspaceContext.workspace.name || "My Workspace"} - Role:{" "}
            {workspaceContext.role}
          </p>
        ) : null}

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
          <section className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 text-blue-950 shadow-sm">
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
                className="w-fit rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-950/20 transition hover:bg-blue-700"
                href="/dashboard/settings/billing"
              >
                Manage billing
              </Link>
            </div>
          </section>
        ) : null}

        {workspaceContext?.isOwner && selectedTemplate ? (
          <section className="rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-5 text-teal-950 shadow-sm">
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
                className="w-fit rounded-2xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
                href={`/dashboard/forms/new?template=${selectedTemplate.slug}`}
              >
                Use this template
              </Link>
            </div>
          </section>
        ) : null}

        {shouldShowVerificationBanner ? (
          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-950 shadow-sm">
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
                  className="rounded-2xl bg-amber-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-950"
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
          <section className="rounded-3xl border border-blue-200 bg-blue-50 p-5 text-blue-950 shadow-sm">
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
                className="w-fit rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-950/20 transition hover:bg-blue-700"
                href="/dashboard/settings/profile"
              >
                Complete Profile
              </Link>
            </div>
          </section>
        ) : null}

        {access?.limits.allowBasicAnalytics && analyticsSummary ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                  Analytics
                </p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">
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
            <div className="mt-4 flex snap-x gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
              <div className="min-w-[42%] snap-start rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:min-w-0">
                <p className="text-xs font-medium text-slate-500">Form views</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">
                  {analyticsSummary.views}
                </p>
                {analyticsSummary.views === 0 ? (
                  <p className="mt-1 hidden text-xs leading-5 text-slate-500 sm:block">
                    No views yet. Share your form link or add it to your website
                    to start collecting responses.
                  </p>
                ) : null}
              </div>
              <div className="min-w-[42%] snap-start rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:min-w-0">
                <p className="text-xs font-medium text-slate-500">Submissions</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">
                  {analyticsSummary.submissions}
                </p>
              </div>
              <div className="min-w-[42%] snap-start rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:min-w-0">
                <p className="text-xs font-medium text-slate-500">Completion rate</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">
                  {analyticsSummary.averageCompletionRate}
                </p>
              </div>
              <div className="min-w-[52%] snap-start rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:min-w-0">
                <p className="text-xs font-medium text-slate-500">Top performing form</p>
                {analyticsSummary.topForm ? (
                  <Link
                    className="mt-1 block text-sm font-semibold leading-5 text-slate-950 hover:text-blue-700"
                    href={`/dashboard/forms/${analyticsSummary.topForm.id}`}
                  >
                    {analyticsSummary.topForm.title}
                    <span className="mt-0.5 block text-xs font-medium text-slate-500">
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
          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900 shadow-sm">
            Basic analytics are not included in your current plan.
          </section>
        ) : null}

        <section className="flex snap-x gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 xl:grid-cols-4 [&::-webkit-scrollbar]:hidden">
          <div className="min-w-[42%] snap-start rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:min-w-0 sm:p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-500">Total Forms</p>
                <p className="mt-1 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                  {formStats.length}
                </p>
              </div>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 sm:h-9 sm:w-9">
                <FileText className="h-4 w-4" />
              </span>
            </div>
          </div>
          <div className="min-w-[42%] snap-start rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:min-w-0 sm:p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-500">Total Submissions</p>
                <p className="mt-1 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                  {submissionCount}
                </p>
              </div>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-700 sm:h-9 sm:w-9">
                <Send className="h-4 w-4" />
              </span>
            </div>
          </div>
          <div className="min-w-[42%] snap-start rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:min-w-0 sm:p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-slate-500">Published Forms</p>
                <p className="mt-1 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                  {publishedFormCount}
                </p>
              </div>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 sm:h-9 sm:w-9">
                <CheckCircle2 className="h-4 w-4" />
              </span>
            </div>
          </div>
          <div className="min-w-[48%] snap-start rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:min-w-0 sm:p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">Storage Provider</p>
                <p className="mt-1 truncate text-base font-semibold capitalize text-slate-950 sm:text-lg">
                  {storageLabel.toLowerCase()}
                </p>
                {uploadProvider?.activeProvider ? (
                  <span className="mt-1.5 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    Active
                  </span>
                ) : null}
              </div>
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 sm:h-9 sm:w-9">
                <HardDrive className="h-4 w-4" />
              </span>
            </div>
          </div>
        </section>

        <section className="flex snap-x gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden">
          {quickActions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                className={
                  action.primary
                    ? "inline-flex h-11 w-11 shrink-0 snap-start items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-semibold text-white shadow-sm shadow-blue-950/20 transition hover:bg-blue-700 sm:w-auto sm:px-4 sm:py-2.5"
                    : "inline-flex h-11 w-11 shrink-0 snap-start items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-800 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800 sm:w-auto sm:px-4 sm:py-2.5"
                }
                href={action.href}
                key={action.label}
                title={action.label}
              >
                <Icon className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only">{action.label}</span>
              </Link>
            );
          })}
        </section>

        {shouldRenderOnboarding ? (
          <OnboardingStepper
            checklistComplete={checklistComplete}
            completedCount={completedChecklistCount}
            hideAction={hideOnboardingChecklist}
            items={checklistItems}
            totalCount={checklistTotal}
          />
        ) : workspaceContext?.isOwner && onboardingState?.dismissedAt ? (
          <form action={showOnboardingChecklist} className="fixed right-0 top-1/2 z-40 -translate-y-1/2">
            <SubmitButton
              className="rounded-l-2xl border border-r-0 border-blue-200 bg-white px-3 py-4 text-xs font-semibold text-blue-700 shadow-xl shadow-slate-950/10 transition hover:bg-blue-50 [writing-mode:vertical-rl]"
              pendingText="Opening..."
              showStatus={false}
            >
              Setup checklist
            </SubmitButton>
          </form>
        ) : null}

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Link
                className="text-lg font-semibold text-slate-950 transition hover:text-blue-700"
                href="/dashboard/forms"
              >
                Recent Submissions
              </Link>
              <p className="mt-1 text-sm leading-6 text-slate-600 sm:block">
                Latest activity across your forms.
              </p>
            </div>
            <Link
              className="text-sm font-semibold text-blue-700 hover:text-blue-800"
              href="/dashboard/forms"
            >
              View all -&gt;
            </Link>
          </div>

          {recentSubmissions.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-950">
                No submissions yet.
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Publish a form and share its link, QR code, or embed to collect
                your first response.
              </p>
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
              <div className="hidden grid-cols-[1fr_150px_120px_90px] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
                <span>Form Name</span>
                <span>Submitted</span>
                <span>Status</span>
                <span className="text-right">Action</span>
              </div>
              <div className="divide-y divide-slate-200">
                {recentSubmissions.map((submission) => (
                  <article
                    className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 bg-white p-3 md:grid-cols-[1fr_150px_120px_90px] md:items-center md:gap-4 md:p-4"
                    key={submission.id}
                  >
                    <Link
                      className="min-w-0 truncate font-semibold text-slate-950 transition hover:text-blue-700 md:order-1"
                      href={`/dashboard/forms/${submission.formId}/submissions/${submission.id}`}
                    >
                      {submission.form.title}
                    </Link>
                    <Link
                      className="row-span-2 inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800 md:order-4 md:row-span-1 md:justify-self-end md:px-3 md:py-2"
                      href={`/dashboard/forms/${submission.formId}/submissions/${submission.id}`}
                    >
                      View
                    </Link>
                    <p className="text-xs text-slate-600 md:order-2 md:text-sm">
                      {formatDate(submission.createdAt)}
                    </p>
                    <span
                      className={`w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold md:order-3 md:px-2.5 md:py-1 md:text-xs ${submissionStatusClass(
                        submission.status,
                      )}`}
                    >
                      {submission.status}
                    </span>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Link
                className="text-lg font-semibold text-slate-950 transition hover:text-blue-700"
                href="/dashboard/forms"
              >
                Recent Forms
              </Link>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Jump back into the workflows you touched most recently.
              </p>
            </div>
            <Link
              className="text-sm font-semibold text-blue-700 hover:text-blue-800"
              href="/dashboard/forms"
            >
              View all -&gt;
            </Link>
          </div>

          {recentForms.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-950">
                Start with a workflow, not a blank page.
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Use a vertical template or create a blank form when you are ready.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                  href="/dashboard/forms/new"
                >
                  Create Form
                </Link>
                <Link
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800"
                  href="/templates"
                >
                  Browse Templates
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
              <div className="hidden grid-cols-[1fr_120px_120px_180px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
                <span>Form</span>
                <span>Status</span>
                <span>Updated</span>
                <span className="text-right">Actions</span>
              </div>
              <div className="divide-y divide-slate-200">
                {recentForms.map((form) => (
                  <article
                    className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 bg-white p-3 md:grid-cols-[1fr_120px_120px_180px] md:items-center md:gap-3 md:p-4"
                    key={form.id}
                  >
                    <div className="min-w-0 md:order-1">
                      <Link
                        className="block truncate font-semibold text-slate-950 transition hover:text-blue-700"
                        href={`/dashboard/forms/${form.id}`}
                      >
                        {form.title}
                      </Link>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {form._count.submissions} submissions
                        <span className="md:hidden">
                          {" "}
                          · Updated {formatDate(form.updatedAt)}
                        </span>
                      </p>
                    </div>
                    <div className="row-span-2 flex items-center gap-1 md:order-4 md:row-span-1 md:justify-end">
                      <Link
                        className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800"
                        href={`/dashboard/forms/${form.id}`}
                      >
                        Manage
                      </Link>
                      {canManageForms ? (
                        <Link
                          className="hidden h-9 items-center justify-center rounded-xl bg-blue-600 px-3 text-sm font-semibold text-white transition hover:bg-blue-700 sm:inline-flex"
                          href={`/dashboard/forms/${form.id}/builder`}
                        >
                          Builder
                        </Link>
                      ) : null}
                    </div>
                    <span className="w-fit rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 md:order-2 md:px-2.5 md:py-1 md:text-xs">
                      {form.status}
                    </span>
                    <p className="hidden text-sm text-slate-600 md:order-3 md:block">
                      {formatDate(form.updatedAt)}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
