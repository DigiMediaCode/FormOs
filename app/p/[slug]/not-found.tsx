import Link from "next/link";
import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";

export default function CmsPageNotFound() {
  return (
    <main className="min-h-screen bg-slate-50">
      <PublicHeader />
      <section className="mx-auto max-w-3xl px-5 py-16 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <h1 className="text-3xl font-semibold text-slate-950">
            This page is currently unavailable.
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            The page may be unpublished, archived, or no longer available.
          </p>
          <Link
            className="mt-6 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            href="/"
          >
            Back to Home
          </Link>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
