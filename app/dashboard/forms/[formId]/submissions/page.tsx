import Link from "next/link";
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
          <Link className="text-sm font-medium text-teal-700 hover:text-teal-800" href={`/dashboard/forms/${form.id}`}>
            Back to form
          </Link>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
                Submissions
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-950">
                {form.title}
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Status: {form.status}
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white px-4 py-3">
              <p className="text-sm text-slate-700">Total submissions</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {submissions.length}
              </p>
            </div>
          </div>
        </header>

        {submissions.length === 0 ? (
          <section className="rounded-md border border-dashed border-slate-300 bg-white p-8">
            <h2 className="text-xl font-semibold text-slate-950">
              No submissions yet
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
              Public submissions for this form will appear here.
            </p>
          </section>
        ) : (
          <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
            <div className="hidden grid-cols-[180px_120px_120px_1fr_120px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-sm font-medium text-slate-700 lg:grid">
              <span>Submitted</span>
              <span>Status</span>
              <span>Version</span>
              <span>Preview</span>
              <span>Details</span>
            </div>
            <div className="divide-y divide-slate-200">
              {submissions.map((submission) => (
                <article className="grid gap-4 px-5 py-4 lg:grid-cols-[180px_120px_120px_1fr_120px]" key={submission.id}>
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
                      Status
                    </p>
                    <p className="text-sm text-slate-800">{submission.status}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 lg:hidden">
                      Version
                    </p>
                    <p className="text-sm text-slate-800">
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
                    <Link
                      className="text-sm font-medium text-teal-700 hover:text-teal-800"
                      href={`/dashboard/forms/${form.id}/submissions/${submission.id}`}
                    >
                      View details
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
