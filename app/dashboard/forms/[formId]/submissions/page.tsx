import Link from "next/link";
import { ArrowLeft, Eye, FileUp, PenLine } from "lucide-react";
import { getFormSubmissions } from "@/lib/forms/submissions";

type SubmissionsPageProps = {
  params: Promise<{
    formId: string;
  }>;
};

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function SubmissionsPage({ params }: SubmissionsPageProps) {
  const { formId } = await params;
  const { form, submissions } = await getFormSubmissions(formId);

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:gap-5">
        <header className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
          <nav className="hidden flex-wrap items-center gap-2 text-sm text-slate-500 sm:flex">
            <Link className="font-medium text-blue-700 hover:text-blue-800" href="/dashboard/forms">
              Forms
            </Link>
            <span>/</span>
            <Link className="font-medium text-blue-700 hover:text-blue-800" href={`/dashboard/forms/${form.id}`}>
              {form.title}
            </Link>
            <span>/</span>
            <span>Submissions</span>
          </nav>
          <div className="flex items-start justify-between gap-3 sm:mt-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-700 sm:text-xs">
                Submissions
              </p>
              <h1 className="mt-1 truncate text-xl font-semibold text-slate-950 sm:text-3xl">
                {form.title}
              </h1>
              <p className="mt-1 text-xs text-slate-500 sm:mt-2 sm:text-sm">
                {form.status} · {submissions.length} total
              </p>
            </div>
            <Link
              className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              href={`/dashboard/forms/${form.id}`}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to form</span>
              <span className="sm:hidden">Back</span>
            </Link>
          </div>
        </header>

        {submissions.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-blue-200 bg-blue-50 p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">
              No submissions yet
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
              No submissions yet. Share your form link to collect your first response.
            </p>
            <Link
              className="mt-5 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              href={`/f/${form.id}`}
            >
              Open public form
            </Link>
          </section>
        ) : (
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="hidden grid-cols-[170px_1fr_1.4fr_100px_110px_86px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-sm font-medium text-slate-700 lg:grid">
              <span>Submitted</span>
              <span>Submitter</span>
              <span>Preview</span>
              <span>Status</span>
              <span>Assets</span>
              <span>Details</span>
            </div>
            <div className="divide-y divide-slate-200">
              {submissions.map((submission) => (
                <article key={submission.id}>
                  <div className="flex items-center gap-3 px-4 py-2.5 lg:hidden" dir="ltr">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-slate-950">
                          {submission.submitterIdentity}
                        </p>
                        <p className="shrink-0 text-[11px] text-slate-500">
                          {formatDateTime(submission.createdAt)}
                        </p>
                      </div>
                      <p className="mt-1 line-clamp-1 text-xs leading-5 text-slate-600">
                        {submission.preview}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                          {submission.status}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          v{submission.formVersion}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                          <FileUp className="h-3 w-3" />
                          {Number(submission.fileCount)}
                        </span>
                        {Boolean(submission.hasSignature) ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                            <PenLine className="h-3 w-3" />
                            Signed
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <Link
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-700"
                      href={`/dashboard/forms/${form.id}/submissions/${submission.id}`}
                      title="View submission"
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View</span>
                    </Link>
                  </div>

                  <div className="hidden gap-4 px-5 py-4 lg:grid lg:grid-cols-[170px_1fr_1.4fr_100px_110px_86px] lg:items-center">
                    <div>
                      <p className="text-sm text-slate-800">
                        {formatDateTime(submission.createdAt)}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">
                        {submission.submitterIdentity}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        v{submission.formVersion}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm leading-6 text-slate-600">
                        {submission.preview}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="w-fit rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {submission.status}
                      </p>
                    </div>
                    <div className="flex items-center justify-start">
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          <FileUp className="h-3.5 w-3.5" />
                          {Number(submission.fileCount)}
                        </span>
                        {Boolean(submission.hasSignature) ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                            <PenLine className="h-3.5 w-3.5" />
                            Signed
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Link
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                        href={`/dashboard/forms/${form.id}/submissions/${submission.id}`}
                        title="View submission"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
