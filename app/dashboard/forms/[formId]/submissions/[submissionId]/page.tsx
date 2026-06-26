import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  ClipboardList,
  ExternalLink,
  FileUp,
  Lock,
  PenLine,
  UserRound,
} from "lucide-react";
import { PendingLink } from "@/components/ui/pending-link";
import { SubmitButton } from "@/components/ui/submit-button";
import { convertSubmissionToClientAction } from "@/lib/clients/actions";
import { inferClientFromSubmissionAnswers } from "@/lib/clients/inference";
import { markOfficeCompleted, saveOfficeFields } from "@/lib/forms/office-actions";
import { getSubmissionEvents } from "@/lib/forms/submission-events";
import { getFormSubmissionById } from "@/lib/forms/submissions";
import type { FormBuilderField } from "@/lib/forms/fields";
import { getUserEffectiveLimits } from "@/lib/plans/limits";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMember } from "@/lib/workspaces/access";

type SubmissionDetailPageProps = {
  params: Promise<{
    formId: string;
    submissionId: string;
  }>;
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function eventTypeLabel(type: string) {
  return type
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function eventMetadataSummary(metadata: unknown) {
  if (typeof metadata !== "object" || metadata === null || Array.isArray(metadata)) {
    return null;
  }

  const entries = Object.entries(metadata).filter(
    ([, value]) =>
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean",
  );

  if (entries.length === 0) {
    return null;
  }

  return entries
    .map(([key, value]) => `${eventTypeLabel(key)}: ${String(value)}`)
    .join(" | ");
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function shortSubmissionId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

function renderOfficeInput(field: FormBuilderField, value: string | boolean | string[]) {
  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  if (field.type === "textarea" || field.type === "address") {
    return (
      <textarea
        className={`${inputClass} min-h-24`}
        defaultValue={typeof value === "string" ? value : ""}
        name={field.id}
      />
    );
  }

  if (field.type === "select") {
    return (
      <select
        className={inputClass}
        defaultValue={typeof value === "string" ? value : ""}
        name={field.id}
      >
        <option value="">Choose an option</option>
        {field.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "checkbox") {
    if (field.options.length > 0) {
      const selected = Array.isArray(value) ? value.map(String) : [];

      return (
        <div className="grid gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3">
          {field.options.map((option) => (
            <label className="flex items-center gap-3 text-sm text-slate-700" key={option}>
              <input
                className="h-4 w-4"
                defaultChecked={selected.includes(option)}
                name={field.id}
                type="checkbox"
                value={option}
              />
              {option}
            </label>
          ))}
        </div>
      );
    }

    return (
      <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700">
        <input
          className="h-4 w-4"
          defaultChecked={value === true}
          name={field.id}
          type="checkbox"
        />
        {field.placeholder || field.label}
      </label>
    );
  }

  const inputTypeByFieldType = {
    currency: "number",
    date: "date",
    email: "email",
    number: "number",
    phone: "tel",
    text: "text",
  } as const;

  return (
    <input
      className={inputClass}
      defaultValue={typeof value === "string" ? value : ""}
      name={field.id}
      step={field.type === "currency" ? "0.01" : undefined}
      type={inputTypeByFieldType[field.type as keyof typeof inputTypeByFieldType] ?? "text"}
    />
  );
}

function compactInputClass() {
  return "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
}

export default async function SubmissionDetailPage({
  params,
  searchParams,
}: SubmissionDetailPageProps) {
  const context = await requireWorkspaceMember();
  const { formId, submissionId } = await params;
  const { error, success } = await searchParams;
  const [{ form, submission }, events, limits] = await Promise.all([
    getFormSubmissionById(formId, submissionId),
    getSubmissionEvents(formId, submissionId),
    getUserEffectiveLimits(context.ownerId),
  ]);
  const saveOfficeAction = saveOfficeFields.bind(null, form.id, submission.id);
  const finalizeAction = markOfficeCompleted.bind(null, form.id, submission.id);
  const convertToClientAction = convertSubmissionToClientAction.bind(
    null,
    form.id,
    submission.id,
  );
  const publicAnswers = submission.answers.filter(
    (answer) => !answer.imageDataUrl && !answer.files,
  );
  const uploadedFiles = submission.answers.flatMap((answer) =>
    (answer.files ?? []).map((file) => ({
      fieldId: answer.fieldId,
      label: answer.label,
      file,
    })),
  );
  const signatureAnswers = submission.answers.filter((answer) => answer.imageDataUrl);
  const inferredClient = inferClientFromSubmissionAnswers(submission.answers);
  const [sourceClient, existingEmailClient] = await Promise.all([
    prisma.client.findFirst({
      where: {
        ownerId: context.ownerId,
        sourceSubmissionId: submission.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    }),
    inferredClient.email
      ? prisma.client.findFirst({
          where: {
            ownerId: context.ownerId,
            email: {
              equals: inferredClient.email,
              mode: "insensitive",
            },
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        })
      : Promise.resolve(null),
  ]);
  const duplicateClient =
    existingEmailClient && existingEmailClient.id !== sourceClient?.id
      ? existingEmailClient
      : null;

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <nav className="flex flex-wrap items-center gap-2 text-xs text-slate-500 sm:text-sm">
                <Link className="font-medium text-blue-700 hover:text-blue-800" href="/dashboard/forms">
                  Forms
                </Link>
                <span>/</span>
                <Link className="font-medium text-blue-700 hover:text-blue-800" href={`/dashboard/forms/${form.id}`}>
                  {form.title}
                </Link>
                <span>/</span>
                <Link className="font-medium text-blue-700 hover:text-blue-800" href={`/dashboard/forms/${form.id}/submissions`}>
                  Submissions
                </Link>
                <span>/</span>
                <span>Submission</span>
              </nav>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                  {submission.snapshot.title}
                </h1>
                <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                  {submission.status}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500 sm:text-sm">
                Submission #{shortSubmissionId(submission.id)} - Received{" "}
                {formatDateTime(submission.createdAt)}
              </p>
              {form.title !== submission.snapshot.title ? (
                <p className="mt-2 text-sm text-slate-700">
                  Current form title: {form.title}
                </p>
              ) : null}
            </div>
            <Link
              className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm shadow-slate-950/5 transition hover:bg-slate-50"
              href={`/dashboard/forms/${form.id}/submissions`}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </div>
        </header>

        {success ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {success}
          </p>
        ) : null}

        {error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex min-w-0 flex-col gap-5">
            <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-blue-600" />
                  <h2 className="text-base font-semibold text-slate-950">Public answers</h2>
                </div>
                <p className="text-xs text-slate-500">
                  Submitted {formatDateTime(submission.createdAt)}
                </p>
              </div>
              <div className="mt-4 divide-y divide-slate-100">
                {publicAnswers.length === 0 ? (
                  <p className="py-2 text-sm leading-6 text-slate-700">
                    No standard answer fields were captured for this submission.
                  </p>
                ) : null}
                {publicAnswers.map((answer) => (
                  <div
                    className="grid gap-1 py-3 text-sm sm:grid-cols-[220px_1fr] sm:items-start"
                    key={answer.fieldId}
                  >
                    <p className="font-medium text-slate-500">{answer.label}</p>
                    <p className="whitespace-pre-wrap font-medium leading-6 text-slate-950 sm:text-right">
                      {answer.value}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {uploadedFiles.length > 0 ? (
              <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5">
                <div className="flex items-center gap-2">
                  <FileUp className="h-4 w-4 text-blue-600" />
                  <h2 className="text-base font-semibold text-slate-950">Uploaded files</h2>
                </div>
                <div className="mt-4 flex flex-col gap-3">
                  {uploadedFiles.map(({ fieldId, file }) => (
                    <div
                      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                      key={`${fieldId}-${file.provider === "google_drive" ? file.driveFileId : file.dropboxFileId}`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950">
                          {file.fileName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatFileSize(file.size)} -{" "}
                          {file.provider === "google_drive" ? "Google Drive" : "Dropbox"}
                        </p>
                        {file.provider === "google_drive" && file.submissionFolderName ? (
                          <p className="mt-1 truncate text-xs text-slate-500">
                            /{file.submissionFolderName}/
                          </p>
                        ) : null}
                        {file.provider === "dropbox" ? (
                          <p className="mt-1 truncate text-xs text-slate-500">
                            {file.submissionFolderPath || file.path}
                          </p>
                        ) : null}
                      </div>
                      {file.provider === "google_drive" && file.webViewLink ? (
                        <Link
                          className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-white px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
                          href={file.webViewLink}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Open
                        </Link>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {signatureAnswers.length > 0 ? (
              <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5">
                <div className="flex items-center gap-2">
                  <PenLine className="h-4 w-4 text-blue-600" />
                  <h2 className="text-base font-semibold text-slate-950">Signatures</h2>
                </div>
                <div className="mt-4 flex flex-col gap-4">
                  {signatureAnswers.map((answer) =>
                    answer.imageDataUrl ? (
                      <div key={answer.fieldId}>
                        <p className="text-xs font-medium text-slate-500">
                          {answer.label}
                        </p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          alt={answer.label}
                          className="mt-2 max-h-44 w-full rounded-2xl border border-slate-200 bg-slate-50 object-contain p-3"
                          src={answer.imageDataUrl}
                        />
                      </div>
                    ) : null,
                  )}
                </div>
              </section>
            ) : null}

            {submission.context.length > 0 ? (
              <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-blue-600" />
                  <h2 className="text-base font-semibold text-slate-950">Form context</h2>
                </div>
                <div className="mt-4 flex flex-col gap-3">
                  {submission.context.map((item) => {
                    if (item.type === "section_heading") {
                      return (
                        <h3 className="border-b border-slate-100 pb-2 text-sm font-semibold text-slate-950" key={item.id}>
                          {item.content}
                        </h3>
                      );
                    }

                    if (item.type === "html") {
                      return (
                        <div
                          className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700"
                          dangerouslySetInnerHTML={{ __html: item.content }}
                          key={item.id}
                        />
                      );
                    }

                    return (
                      <p className="text-sm leading-6 text-slate-700" key={item.id}>
                        {item.content}
                      </p>
                    );
                  })}
                </div>
              </section>
            ) : null}

            <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-blue-600" />
                  <h2 className="text-base font-semibold text-slate-950">
                    Office Use Only
                  </h2>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Internal
                </span>
              </div>
              {submission.officeCompletedAt ? (
                <p className="mt-2 text-sm text-slate-600">
                  Completed {formatDateTime(submission.officeCompletedAt)}.
                </p>
              ) : null}
              {submission.officeFields.length === 0 ? (
                <p className="mt-5 text-sm leading-6 text-slate-700">
                  This submission does not have office-only fields.
                </p>
              ) : (
                <form action={saveOfficeAction} className="mt-5 flex flex-col gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {submission.officeFields.map(({ field, value, supported }) => (
                      <div
                        className={field.type === "textarea" || field.type === "address" ? "md:col-span-2" : ""}
                        key={field.id}
                      >
                        <label className="text-xs font-semibold text-slate-700" htmlFor={field.id}>
                          {field.label || field.content || field.id}
                        </label>
                        <div className="mt-1">
                          {supported ? (
                            renderOfficeInput(field, value)
                          ) : (
                            <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                              Not supported for office use yet.
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <SubmitButton
                    className="w-fit rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                    pendingText="Saving office fields..."
                  >
                    Save Office Fields
                  </SubmitButton>
                </form>
              )}
              <div className="mt-4">
                {!submission.officeCompletedAt ? (
                  <form action={finalizeAction}>
                    <SubmitButton
                      className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700"
                      pendingText="Finalizing submission and sending PDF..."
                    >
                      Finalize and Send PDF
                    </SubmitButton>
                  </form>
                ) : (
                  <PendingLink
                    className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                    href={`/dashboard/forms/${form.id}/submissions/${submission.id}/completed-pdf`}
                    pendingText="Generating PDF..."
                    resetAfterMs={5000}
                  >
                    Download Completed PDF
                  </PendingLink>
                )}
              </div>
            </section>
          </div>

          <aside className="min-w-0 lg:sticky lg:top-6 lg:self-start">
            <section className="mb-5 rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5">
              <div className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-blue-600" />
                <h2 className="text-base font-semibold text-slate-950">Client</h2>
              </div>
              {sourceClient ? (
                <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="text-sm font-semibold text-emerald-950">
                    This submission is linked to {sourceClient.name}.
                  </p>
                  <Link
                    className="mt-3 inline-flex rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    href={`/dashboard/clients/${sourceClient.id}`}
                  >
                    View Client
                  </Link>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    <Link
                      className="inline-flex justify-center rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
                      href={`/dashboard/contracts/new?clientId=${sourceClient.id}&sourceSubmissionId=${submission.id}`}
                    >
                      New Contract
                    </Link>
                    <Link
                      className="inline-flex justify-center rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
                      href={`/dashboard/agreements/new?clientId=${sourceClient.id}&sourceSubmissionId=${submission.id}`}
                    >
                      New Agreement
                    </Link>
                  </div>
                </div>
              ) : duplicateClient ? (
                <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-sm font-semibold text-blue-950">
                    A client with this email already exists.
                  </p>
                  <p className="mt-1 text-xs text-blue-800">
                    {duplicateClient.email}
                  </p>
                  <Link
                    className="mt-3 inline-flex rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                    href={`/dashboard/clients/${duplicateClient.id}`}
                  >
                    View existing client
                  </Link>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    <Link
                      className="inline-flex justify-center rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-800 transition hover:bg-blue-50"
                      href={`/dashboard/contracts/new?clientId=${duplicateClient.id}&sourceSubmissionId=${submission.id}`}
                    >
                      New Contract
                    </Link>
                    <Link
                      className="inline-flex justify-center rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-800 transition hover:bg-blue-50"
                      href={`/dashboard/agreements/new?clientId=${duplicateClient.id}&sourceSubmissionId=${submission.id}`}
                    >
                      New Agreement
                    </Link>
                  </div>
                </div>
              ) : limits.allowClients && limits.allowConvertSubmissionToClient ? (
                <form action={convertToClientAction} className="mt-4 grid gap-3">
                  <label className="grid gap-1 text-xs font-semibold text-slate-600">
                    Type
                    <select
                      className={compactInputClass()}
                      defaultValue={inferredClient.type}
                      name="type"
                    >
                      <option value="PERSON">Person</option>
                      <option value="BUSINESS">Business</option>
                    </select>
                  </label>
                  <label className="grid gap-1 text-xs font-semibold text-slate-600">
                    Name
                    <input
                      className={compactInputClass()}
                      defaultValue={inferredClient.name}
                      name="name"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-semibold text-slate-600">
                    Email
                    <input
                      className={compactInputClass()}
                      defaultValue={inferredClient.email}
                      name="email"
                      type="email"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-semibold text-slate-600">
                    Phone
                    <input
                      className={compactInputClass()}
                      defaultValue={inferredClient.phone}
                      name="phone"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-semibold text-slate-600">
                    Company
                    <input
                      className={compactInputClass()}
                      defaultValue={inferredClient.companyName}
                      name="companyName"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-semibold text-slate-600">
                    Address
                    <textarea
                      className={`${compactInputClass()} min-h-20`}
                      defaultValue={inferredClient.address}
                      name="address"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-semibold text-slate-600">
                    Notes
                    <textarea
                      className={`${compactInputClass()} min-h-20`}
                      name="notes"
                      placeholder="Optional client notes"
                    />
                  </label>
                  <SubmitButton
                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                    pendingText="Creating client..."
                  >
                    Convert to Client
                  </SubmitButton>
                </form>
              ) : (
                <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-sm font-semibold text-blue-950">
                    Client conversion is available on Pro and Business plans.
                  </p>
                  <Link
                    className="mt-3 inline-flex rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                    href="/dashboard/settings/billing"
                  >
                    View plans
                  </Link>
                </div>
              )}
            </section>

            <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-600" />
                <h2 className="text-base font-semibold text-slate-950">
                  Activity Timeline
                </h2>
              </div>
              {events.length === 0 ? (
                <p className="mt-5 text-sm leading-6 text-slate-700">
                  No activity has been recorded for this submission yet.
                </p>
              ) : (
                <ol className="mt-5 space-y-4">
                  {events.map((event) => {
                    const metadataSummary = eventMetadataSummary(event.metadata);

                    return (
                      <li className="relative pl-8" key={event.id}>
                        <span className="absolute left-0 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-4 ring-white">
                          <span className="h-2 w-2 rounded-full bg-current" />
                        </span>
                        <div className="border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
                          <p className="text-sm font-semibold text-slate-950">
                            {event.message || eventTypeLabel(event.type)}
                          </p>
                          <time className="mt-1 block text-xs text-slate-500" dateTime={event.createdAt.toISOString()}>
                            {formatDateTime(event.createdAt)}
                          </time>
                          {metadataSummary ? (
                            <p className="mt-2 text-xs leading-5 text-slate-600">
                              {metadataSummary}
                            </p>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
