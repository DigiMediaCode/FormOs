import Link from "next/link";
import { getFormSubmissionById } from "@/lib/forms/submissions";

type SubmissionDetailPageProps = {
  params: Promise<{
    formId: string;
    submissionId: string;
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

export default async function SubmissionDetailPage({
  params,
}: SubmissionDetailPageProps) {
  const { formId, submissionId } = await params;
  const { form, submission } = await getFormSubmissionById(formId, submissionId);

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
                      <div className="rounded-md border border-slate-200 bg-slate-50 p-4" key={file.driveFileId}>
                        <p className="text-sm font-medium text-slate-950">
                          {file.fileName}
                        </p>
                        <p className="mt-1 text-sm text-slate-700">
                          {file.mimeType} - {formatFileSize(file.size)}
                        </p>
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
