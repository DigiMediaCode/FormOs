import { FormMode } from "@prisma/client";
import Link from "next/link";
import { createForm } from "@/lib/forms/actions";

type NewFormPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function NewFormPage({ searchParams }: NewFormPageProps) {
  const { error } = await searchParams;

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <header className="border-b border-slate-200 pb-6">
          <Link className="text-sm font-medium text-teal-700 hover:text-teal-800" href="/dashboard/forms">
            Forms
          </Link>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">
            Create form
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Add the basic shell now. Fields, builder, and submissions come later.
          </p>
        </header>

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <form action={createForm} className="flex flex-col gap-5 rounded-md border border-slate-200 bg-white p-6">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
            Title
            <input
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              name="title"
              required
              type="text"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
            Description
            <textarea
              className="min-h-28 rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              name="description"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
            Mode
            <select
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              defaultValue={FormMode.STANDARD}
              name="mode"
            >
              <option value={FormMode.STANDARD}>Standard</option>
              <option value={FormMode.AGREEMENT}>Agreement</option>
              <option value={FormMode.BOOKING}>Booking</option>
            </select>
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
              type="submit"
            >
              Create Form
            </button>
            <Link
              className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
              href="/dashboard/forms"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
