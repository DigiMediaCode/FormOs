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
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="border-b border-slate-200 pb-6">
          <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
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
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-blue-700">
                Submissions
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-950">
                {form.title}
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Status: {form.status}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                href={`/dashboard/forms/${form.id}`}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to form
              </Link>
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-sm text-slate-700">Total submissions</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {submissions.length}
              </p>
              </div>
            </div>
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
            <div className="hidden grid-cols-[180px_1fr_120px_150px_110px_110px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-sm font-medium text-slate-700 lg:grid">
              <span>Submitted</span>
              <span>Submitter</span>
              <span>Preview</span>
              <span>Status</span>
              <span>Assets</span>
              <span>Details</span>
            </div>
            <div className="divide-y divide-slate-200">
              {submissions.map((submission) => (
                <article className="grid gap-4 px-5 py-4 lg:grid-cols-[180px_1fr_120px_150px_110px_110px] lg:items-center" key={submission.id}>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 lg:hidden">
                      Submitted
                    </p>
                    <p className="text-sm text-slate-800">
                      {formatDateTime(submission.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 lg:hidden">
                      Submitter
                    </p>
                    <p className="text-sm font-semibold text-slate-950">
                      {submission.submitterIdentity}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      v{submission.formVersion}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 lg:hidden">
                      Preview
                    </p>
                    <p className="line-clamp-2 text-sm leading-6 text-slate-700">
                      {submission.preview}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 lg:hidden">
                      Status
                    </p>
                    <p className="w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                      {submission.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 lg:hidden">
                      Assets
                    </p>
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
                  <div>
                    <Link
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                      href={`/dashboard/forms/${form.id}/submissions/${submission.id}`}
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Link>
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
