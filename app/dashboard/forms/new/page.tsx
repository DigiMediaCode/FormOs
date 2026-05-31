import { FormMode } from "@prisma/client";
import Link from "next/link";
import { createForm } from "@/lib/forms/actions";
import { createVehicleHireAgreementTemplate } from "@/lib/forms/templates/create-template-form";

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
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Create blank form
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-700">
              Start with an empty form and add fields in the builder.
            </p>
          </div>

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

        <section className="rounded-md border border-slate-200 bg-white p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
                Create from template
              </p>
              <h2 className="mt-2 text-lg font-semibold text-slate-950">
                Vehicle Hire Agreement
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
                Creates an editable agreement form with driver details, ID uploads,
                acknowledgements, signatures, and office-use-only handover fields.
              </p>
            </div>
            <form action={createVehicleHireAgreementTemplate}>
              <button
                className="rounded-md bg-teal-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-teal-800"
                type="submit"
              >
                Use Template
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
