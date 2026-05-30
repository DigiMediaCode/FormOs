import { FormStatus } from "@prisma/client";
import Link from "next/link";
import {
  archiveForm,
  getUserForms,
  publishForm,
  unpublishForm,
} from "@/lib/forms/actions";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function StatusBadge({ status }: { status: FormStatus }) {
  const classes = {
    DRAFT: "border-amber-200 bg-amber-50 text-amber-800",
    PUBLISHED: "border-emerald-200 bg-emerald-50 text-emerald-800",
    ARCHIVED: "border-slate-200 bg-slate-100 text-slate-700",
  }[status];

  return (
    <span className={`rounded-md border px-2 py-1 text-xs font-medium ${classes}`}>
      {status}
    </span>
  );
}

export default async function FormsPage() {
  const forms = await getUserForms();

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
              Dashboard
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950">Forms</h1>
          </div>

          <Link
            className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            href="/dashboard/forms/new"
          >
            Create Form
          </Link>
        </header>

        {forms.length === 0 ? (
          <section className="rounded-md border border-dashed border-slate-300 bg-white p-8">
            <h2 className="text-xl font-semibold text-slate-950">
              No forms yet
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
              Create your first form foundation. The builder comes later.
            </p>
            <Link
              className="mt-5 inline-flex rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
              href="/dashboard/forms/new"
            >
              Create Form
            </Link>
          </section>
        ) : (
          <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
            <div className="grid gap-0">
              {forms.map((form) => {
                const isPublished = form.status === FormStatus.PUBLISHED;
                const isArchived = form.status === FormStatus.ARCHIVED;
                const publicPath = `/f/${form.id}`;

                return (
                  <article
                    className="grid gap-5 border-b border-slate-200 p-5 last:border-b-0 lg:grid-cols-[1fr_auto]"
                    key={form.id}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-lg font-semibold text-slate-950">
                          {form.title}
                        </h2>
                        <StatusBadge status={form.status} />
                      </div>
                      <dl className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <dt className="font-medium text-slate-950">Mode</dt>
                          <dd>{form.mode}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-slate-950">Created</dt>
                          <dd>{formatDate(form.createdAt)}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-slate-950">Updated</dt>
                          <dd>{formatDate(form.updatedAt)}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-slate-950">Public link</dt>
                          <dd>
                            <Link className="text-teal-700 hover:text-teal-800" href={publicPath}>
                              {publicPath}
                            </Link>
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      <Link
                        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
                        href={`/dashboard/forms/${form.id}`}
                      >
                        Manage
                      </Link>

                      <form action={isPublished ? unpublishForm.bind(null, form.id) : publishForm.bind(null, form.id)}>
                        <button
                          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isArchived}
                          type="submit"
                        >
                          {isPublished ? "Unpublish" : "Publish"}
                        </button>
                      </form>

                      <form action={archiveForm.bind(null, form.id)}>
                        <button
                          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isArchived}
                          type="submit"
                        >
                          Archive
                        </button>
                      </form>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
