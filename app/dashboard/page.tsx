import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
              Dashboard
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950">
              FormOS Dashboard
            </h1>
            <p className="mt-3 text-base text-slate-700">
              Signed in as {user?.name ? `${user.name} (${user.email})` : user?.email}.
            </p>
          </div>
        </header>

        <section>
          <Link
            className="block rounded-md border border-slate-200 bg-white p-6 transition hover:border-teal-300 hover:shadow-sm"
            href="/dashboard/forms"
          >
            <p className="text-lg font-semibold text-slate-950">Forms</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
              Placeholder for form creation, publishing, and submission review.
            </p>
          </Link>
        </section>
      </div>
    </main>
  );
}
