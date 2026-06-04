import Link from "next/link";

export function AccessDenied() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <section className="mx-auto max-w-lg rounded-md border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-950">Access denied</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          You do not have permission to access this area.
        </p>
        <Link
          className="mt-6 inline-flex rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          href="/dashboard"
        >
          Back to Dashboard
        </Link>
      </section>
    </main>
  );
}
