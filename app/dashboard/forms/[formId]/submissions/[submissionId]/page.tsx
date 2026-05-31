import Link from "next/link";
import { markOfficeCompleted, saveOfficeFields } from "@/lib/forms/office-actions";
import { getFormSubmissionById } from "@/lib/forms/submissions";
import type { FormBuilderField } from "@/lib/forms/fields";

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

function metadataValue(value: unknown) {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  return "Not available";
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

function renderOfficeInput(field: FormBuilderField, value: string | boolean) {
  const inputClass =
    "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

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
    return (
      <label className="flex items-center gap-3 rounded-md border border-slate-300 bg-white px-3 py-3 text-sm text-slate-700">
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

export default async function SubmissionDetailPage({
  params,
  searchParams,
}: SubmissionDetailPageProps) {
  const { formId, submissionId } = await params;
  const { error, success } = await searchParams;
  const { form, submission } = await getFormSubmissionById(formId, submissionId);
  const saveOfficeAction = saveOfficeFields.bind(null, form.id, submission.id);

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="border-b border-slate-200 pb-6">
          <Link className="text-sm font-medium text-teal-700 hover:text-teal-800" href={`/dashboard/forms/${form.id}/submissions`}>
            Back to submissions
          </Link>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
                Submission detail
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-950">
                {submission.snapshot.title}
              </h1>
              {form.title !== submission.snapshot.title ? (
                <p className="mt-2 text-sm text-slate-700">
                  Current form title: {form.title}
                </p>
              ) : null}
            </div>
            <span className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800">
              {submission.status}
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

        <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-6 sm:grid-cols-3">
          <div>
            <p className="text-sm font-medium text-slate-950">Submitted</p>
            <p className="mt-1 text-sm text-slate-700">
              {formatDateTime(submission.createdAt)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-950">Form version</p>
            <p className="mt-1 text-sm text-slate-700">
              v{submission.formVersion}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-950">Snapshot mode</p>
            <p className="mt-1 text-sm text-slate-700">
              {submission.snapshot.mode || "Not available"}
            </p>
          </div>
        </section>

        {submission.context.length > 0 ? (
          <section className="rounded-md border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-semibold text-slate-950">Form context</h2>
            <div className="mt-5 flex flex-col gap-4">
              {submission.context.map((item) => {
                if (item.type === "section_heading") {
                  return (
                    <h3 className="border-b border-slate-200 pb-2 text-lg font-semibold text-slate-950" key={item.id}>
                      {item.content}
                    </h3>
                  );
                }

                if (item.type === "html") {
                  return (
                    <div
                      className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700"
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

        <section className="rounded-md border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-950">
            Submitted answers
          </h2>
          <div className="mt-5 divide-y divide-slate-200">
            {submission.answers.length === 0 ? (
              <p className="text-sm leading-6 text-slate-700">
                No answer fields were captured for this submission.
              </p>
            ) : null}
            {submission.answers.map((answer) => (
              <div className="grid gap-2 py-4 sm:grid-cols-[240px_1fr]" key={answer.fieldId}>
                <p className="text-sm font-medium text-slate-950">
                  {answer.label}
                </p>
                {answer.imageDataUrl ? (
                  <div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={answer.label}
                      className="max-h-40 rounded-md border border-slate-200 bg-white object-contain p-2"
                      src={answer.imageDataUrl}
                    />
                  </div>
                ) : answer.files ? (
                  <div className="flex flex-col gap-3">
                    {answer.files.map((file) => (
                      <div
                        className="rounded-md border border-slate-200 bg-slate-50 p-4"
                        key={file.provider === "google_drive" ? file.driveFileId : file.dropboxFileId}
                      >
                        <p className="text-sm font-medium text-slate-950">
                          {file.fileName}
                        </p>
                        <p className="mt-1 text-sm text-slate-700">
                          {file.mimeType} - {formatFileSize(file.size)}
                        </p>
                        {file.provider === "google_drive" ? (
                          <>
                            {file.submissionFolderName ? (
                              <p className="mt-1 text-sm text-slate-700">
                                Folder: {file.submissionFolderName}
                              </p>
                            ) : null}
                            {file.webViewLink ? (
                              <Link
                                className="mt-3 inline-flex text-sm font-medium text-teal-700 hover:text-teal-800"
                                href={file.webViewLink}
                                rel="noreferrer"
                                target="_blank"
                              >
                                Open in Google Drive
                              </Link>
                            ) : null}
                          </>
                        ) : (
                          <>
                            <p className="mt-1 break-all text-sm text-slate-700">
                              Dropbox path: {file.path}
                            </p>
                            {file.submissionFolderPath ? (
                              <p className="mt-1 break-all text-sm text-slate-700">
                                Folder: {file.submissionFolderPath}
                              </p>
                            ) : null}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {answer.value}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-950">
            Office Use Only
          </h2>
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
            <form action={saveOfficeAction} className="mt-5 flex flex-col gap-5">
              {submission.officeFields.map(({ field, value, supported }) => (
                <div className="grid gap-2 sm:grid-cols-[240px_1fr]" key={field.id}>
                  <label className="text-sm font-medium text-slate-950" htmlFor={field.id}>
                    {field.label || field.content || field.id}
                  </label>
                  {supported ? (
                    <div>{renderOfficeInput(field, value)}</div>
                  ) : (
                    <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      Not supported for office use yet.
                    </p>
                  )}
                </div>
              ))}
              <button
                className="w-fit rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                type="submit"
              >
                Save Office Fields
              </button>
            </form>
          )}
          {!submission.officeCompletedAt ? (
            <form action={markOfficeCompleted.bind(null, form.id, submission.id)} className="mt-4">
              <button
                className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
                type="submit"
              >
                Mark Office Completed
              </button>
            </form>
          ) : (
            <Link
              className="mt-4 inline-flex rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
              href={`/dashboard/forms/${form.id}/submissions/${submission.id}/completed-pdf`}
            >
              Download Completed PDF
            </Link>
          )}
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-950">Metadata</h2>
          <dl className="mt-5 grid gap-4">
            <div>
              <dt className="text-sm font-medium text-slate-950">User agent</dt>
              <dd className="mt-1 break-words text-sm text-slate-700">
                {metadataValue(submission.metadata.userAgent)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-950">IP address</dt>
              <dd className="mt-1 text-sm text-slate-700">
                {metadataValue(submission.metadata.ipAddress)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-950">Submitted at</dt>
              <dd className="mt-1 text-sm text-slate-700">
                {metadataValue(submission.metadata.submittedAt)}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  );
}
