import { FormMode, FormStatus } from "@prisma/client";
import Link from "next/link";
import { FormEmbedCard } from "@/components/forms/form-embed-card";
import { GoogleDriveUploadWarning } from "@/components/forms/google-drive-upload-warning";
import { PublicFormQrCard } from "@/components/forms/public-form-qr-card";
import { SubmitButton } from "@/components/ui/submit-button";
import { getAppUrl } from "@/lib/app-url";
import { getFormAnalyticsSummary } from "@/lib/forms/analytics";
import {
  archiveForm,
  getUserFormById,
  publishForm,
  unpublishForm,
  updateForm,
} from "@/lib/forms/actions";
import { normalizeFormFields } from "@/lib/forms/fields";
import { getResolvedUploadProvider } from "@/lib/integrations/upload-settings";
import { getUserEffectiveLimits } from "@/lib/plans/limits";
import { prisma } from "@/lib/prisma";
import {
  canManageWorkspaceForms,
  requireWorkspaceMember,
} from "@/lib/workspaces/access";

type FormDetailPageProps = {
  params: Promise<{
    formId: string;
  }>;
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function NextStepCard({
  description,
  href,
  label,
  title,
}: {
  description: string;
  href: string;
  label: string;
  title: string;
}) {
  return (
    <Link
      className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50"
      href={href}
    >
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-slate-600">{description}</p>
      <span className="mt-3 inline-flex text-xs font-semibold text-blue-700">
        {label}
      </span>
    </Link>
  );
}

export default async function FormDetailPage({
  params,
  searchParams,
}: FormDetailPageProps) {
  const { formId } = await params;
  const { error, success } = await searchParams;
  const context = await requireWorkspaceMember();
  const canManageForms = canManageWorkspaceForms(context);
  const form = await getUserFormById(formId);
  const publicPath = `/f/${form.id}`;
  const publicFormUrl = `${getAppUrl()}${publicPath}`;
  const embedPath = `/embed/forms/${form.id}`;
  const embedUrl = `${getAppUrl()}${embedPath}`;
  const iframeEmbedCode = `<iframe
  src="${embedUrl}"
  width="100%"
  height="800"
  frameborder="0"
  style="border:0; width:100%; min-height:800px;"
  loading="lazy"
></iframe>`;
  const jsEmbedCode = `<div data-formos-form="${form.id}"></div>
<script src="${getAppUrl()}/embed.js" async></script>`;
  const isPublished = form.status === FormStatus.PUBLISHED;
  const isArchived = form.status === FormStatus.ARCHIVED;
  const fields = normalizeFormFields(form.fields);
  const hasUploadFields = fields.some((field) => field.type === "image_upload");
  const [uploadProvider, limits, analyticsSummary, submissionStats] = await Promise.all([
    getResolvedUploadProvider(form.ownerId),
    getUserEffectiveLimits(form.ownerId),
    getFormAnalyticsSummary(form.id, form.ownerId),
    prisma.formSubmission.findMany({
      where: { formId: form.id, ownerId: form.ownerId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        officeCompletedAt: true,
      },
      take: 5,
    }),
  ]);
  const hasSubmissions = submissionStats.length > 0;
  const hasFinalizedSubmission = submissionStats.some(
    (submission) => Boolean(submission.officeCompletedAt),
  );
  const latestSubmissionId = submissionStats[0]?.id ?? null;

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="border-b border-slate-200 pb-6">
          <Link className="text-sm font-medium text-teal-700 hover:text-teal-800" href="/dashboard/forms">
            Forms
          </Link>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-950">
                {form.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
                {form.description || "No description yet."}
              </p>
            </div>
            <span className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800">
              {form.status}
            </span>
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

        {hasUploadFields && !uploadProvider.uploadsAvailable ? (
          <GoogleDriveUploadWarning />
        ) : null}

        {limits.allowQrCode ? (
          <PublicFormQrCard
            formId={form.id}
            formSlug={form.slug}
            publicFormUrl={publicFormUrl}
            status={form.status}
          />
        ) : (
          <section className="rounded-md border border-amber-200 bg-amber-50 p-6 text-sm leading-6 text-amber-900">
            QR codes are not included in your current plan.
          </section>
        )}

        <FormEmbedCard
          allowEmbeds={limits.allowEmbeds}
          embedUrl={embedUrl}
          iframeCode={iframeEmbedCode}
          isPublished={isPublished}
          jsCode={jsEmbedCode}
        />

        <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-blue-700">
                Next steps
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">
                Keep this workflow moving
              </h2>
            </div>
            <p className="text-sm text-slate-500">
              Suggestions change as this form moves from draft to active workflow.
            </p>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {!isPublished ? (
              <>
                <NextStepCard
                  description="Add or reorder fields, set required inputs, and review the public preview."
                  href={`/dashboard/forms/${form.id}/builder`}
                  label="Open builder"
                  title="Finish builder"
                />
                <NextStepCard
                  description="Publish when the workflow is ready to collect responses."
                  href={`/dashboard/forms/${form.id}`}
                  label="Use status controls"
                  title="Publish form"
                />
              </>
            ) : !hasSubmissions ? (
              <>
                <NextStepCard
                  description="Open the customer-facing form and walk through it yourself."
                  href={publicPath}
                  label="Open form"
                  title="Submit a test response"
                />
                <NextStepCard
                  description="Copy the link, use the QR card, or send it to a customer."
                  href={publicPath}
                  label="Open public link"
                  title="Copy link"
                />
                {limits.allowQrCode ? (
                  <NextStepCard
                    description="Use the QR card on this page for in-person sharing."
                    href={`/dashboard/forms/${form.id}`}
                    label="View QR card"
                    title="Download/share QR"
                  />
                ) : null}
                {limits.allowEmbeds ? (
                  <NextStepCard
                    description="Use the embed card above to place this form on your website."
                    href={`/dashboard/forms/${form.id}`}
                    label="View embed code"
                    title="Embed on website"
                  />
                ) : null}
              </>
            ) : (
              <>
                <NextStepCard
                  description="Open the submission inbox and inspect the latest customer responses."
                  href={`/dashboard/forms/${form.id}/submissions`}
                  label="Review submissions"
                  title="Review submissions"
                />
                <NextStepCard
                  description="Complete internal Office Use Only fields where this workflow requires staff review."
                  href={
                    latestSubmissionId
                      ? `/dashboard/forms/${form.id}/submissions/${latestSubmissionId}`
                      : `/dashboard/forms/${form.id}/submissions`
                  }
                  label="Open latest"
                  title="Complete office fields"
                />
                {limits.allowPdfGeneration ? (
                  <NextStepCard
                    description={
                      hasFinalizedSubmission
                        ? "Download completed PDFs from finalized submission records."
                        : "Finalize a submission to generate the completed PDF."
                    }
                    href={
                      latestSubmissionId
                        ? `/dashboard/forms/${form.id}/submissions/${latestSubmissionId}`
                        : `/dashboard/forms/${form.id}/submissions`
                    }
                    label={hasFinalizedSubmission ? "Open PDFs" : "Finalize"}
                    title="Generate/finalize PDF"
                  />
                ) : null}
                <NextStepCard
                  description="Use views, submissions, completion rate, and source breakdown to improve sharing."
                  href={`/dashboard/forms/${form.id}`}
                  label="View analytics"
                  title="View analytics"
                />
              </>
            )}
          </div>
        </section>

        {limits.allowBasicAnalytics ? (
          <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-blue-700">
                  Analytics
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">
                  Last 30 days
                </h2>
              </div>
              <p className="text-sm text-slate-500">
                Tracks public and embedded form activity.
              </p>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Views</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">
                  {analyticsSummary.views}
                </p>
                {analyticsSummary.views === 0 ? (
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    No views yet. Share your form link or add it to your website
                    to start collecting responses.
                  </p>
                ) : null}
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Submissions</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">
                  {analyticsSummary.submissions}
                </p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Completion rate</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">
                  {analyticsSummary.completionRate}
                </p>
              </div>
            </div>
            <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-950">Source breakdown</p>
              {analyticsSummary.sourceBreakdown.length > 0 ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {analyticsSummary.sourceBreakdown.map((source) => (
                    <div
                      className="rounded-md border border-slate-200 bg-white px-3 py-2"
                      key={source.source}
                    >
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        {source.source.toLowerCase().replaceAll("_", " ")}
                      </p>
                      <p className="mt-1 text-lg font-semibold text-slate-950">
                        {source.count}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-600">
                  No analytics events recorded yet.
                </p>
              )}
            </div>
          </section>
        ) : (
          <section className="rounded-md border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
            Basic analytics are not included in the owner's current plan.
          </section>
        )}

        <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm font-medium text-slate-950">Mode</p>
            <p className="mt-1 text-sm text-slate-700">{form.mode}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-950">Slug</p>
            <p className="mt-1 break-all text-sm text-slate-700">{form.slug}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-950">Version</p>
            <p className="mt-1 text-sm text-slate-700">{form.version}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-950">Public link</p>
            <Link className="mt-1 block text-sm text-teal-700 hover:text-teal-800" href={publicPath}>
              {publicPath}
            </Link>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-950">Created</p>
            <p className="mt-1 text-sm text-slate-700">{formatDate(form.createdAt)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-950">Updated</p>
            <p className="mt-1 text-sm text-slate-700">{formatDate(form.updatedAt)}</p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_280px]">
          {canManageForms ? (
            <form
              action={updateForm.bind(null, form.id)}
              className="flex flex-col gap-5 rounded-md border border-slate-200 bg-white p-6"
            >
            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                Basic details
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                These details identify the form before the builder is added.
              </p>
            </div>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
              Title
              <input
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                defaultValue={form.title}
                name="title"
                required
                type="text"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
              Description
              <textarea
                className="min-h-28 rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                defaultValue={form.description ?? ""}
                name="description"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
              Mode
              <select
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                defaultValue={form.mode}
                name="mode"
              >
                <option value={FormMode.STANDARD}>Standard</option>
                <option value={FormMode.AGREEMENT}>Agreement</option>
                <option value={FormMode.BOOKING}>Booking</option>
              </select>
            </label>

            <SubmitButton
              className="w-fit rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
              pendingText="Saving form details..."
            >
              Save changes
            </SubmitButton>
            </form>
          ) : (
            <section className="rounded-md border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-950">
                Basic details
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                You can view this form and its submissions. Editing is available
                to workspace owners and admins.
              </p>
            </section>
          )}

          <aside className="flex flex-col gap-4">
            <section className="rounded-md border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-slate-950">Status</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {canManageForms ? (
                <form action={isPublished ? unpublishForm.bind(null, form.id) : publishForm.bind(null, form.id)}>
                  <SubmitButton
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isArchived}
                    pendingText={isPublished ? "Unpublishing form..." : "Publishing form..."}
                  >
                    {isPublished ? "Unpublish" : "Publish"}
                  </SubmitButton>
                </form>
                ) : null}
                {canManageForms ? (
                <form action={archiveForm.bind(null, form.id)}>
                  <SubmitButton
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isArchived}
                    pendingText="Archiving form..."
                  >
                    Archive
                  </SubmitButton>
                </form>
                ) : null}
                {!canManageForms ? (
                  <p className="text-sm leading-6 text-slate-600">
                    Status changes are available to workspace owners and admins.
                  </p>
                ) : null}
              </div>
            </section>

            <section className="rounded-md border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-slate-950">Next</h2>
              <div className="mt-4 flex flex-col gap-2">
                {canManageForms ? (
                  <Link
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-sm font-medium text-slate-800 transition hover:bg-slate-50"
                    href={`/dashboard/forms/${form.id}/builder`}
                  >
                    Builder
                  </Link>
                ) : null}
                <Link
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-sm font-medium text-slate-800 transition hover:bg-slate-50"
                  href={`/dashboard/forms/${form.id}/submissions`}
                >
                  Submissions
                </Link>
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
