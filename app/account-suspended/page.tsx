import Link from "next/link";

export default function AccountSuspendedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10">
      <section className="w-full max-w-md rounded-xl border border-red-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-950">
          Your account has been suspended.
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          Please contact support if you believe this is unexpected.
        </p>
        <Link
          className="mt-6 inline-flex rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
          href="/"
        >
          Back to Home
        </Link>
      </section>
    </main>
  );
}
