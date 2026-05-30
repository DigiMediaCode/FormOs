import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
            FormOS
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-950">
            Standalone form builder foundation
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
            Milestone 0 sets up the project shell for agreement forms, booking
            forms, and public submissions.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white"
            href="/dashboard"
          >
            Dashboard
          </Link>
          <Link
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800"
            href="/f/test-form"
          >
            Public form
          </Link>
        </div>
      </div>
    </main>
  );
}
