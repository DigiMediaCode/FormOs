import { FormMode, FormStatus } from "@prisma/client";
import Link from "next/link";
import { GoogleDriveUploadWarning } from "@/components/forms/google-drive-upload-warning";
import {
  archiveForm,
  getUserFormById,
  publishForm,
  unpublishForm,
  updateForm,
} from "@/lib/forms/actions";
import { normalizeFormFields } from "@/lib/forms/fields";
import { getResolvedUploadProvider } from "@/lib/integrations/upload-settings";

type FormDetailPageProps = {
  params: Promise<{
    formId: string;
  }>;
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function FormDetailPage({
  params,
  searchParams,
}: FormDetailPageProps) {
  const { formId } = await params;
  const { error, success } = await searchParams;
  const form = await getUserFormById(formId);
  const publicPath = `/f/${form.id}`;
  const isPublished = form.status === FormStatus.PUBLISHED;
  const isArchived = form.status === FormStatus.ARCHIVED;
  const fields = normalizeFormFields(form.fields);
  const hasUploadFields = fields.some((field) => field.type === "image_upload");
  const uploadProvider = await getResolvedUploadProvider(form.ownerId);

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="border-b border-slate-200 pb-6">
          <Link className="text-sm font-medium text-teal-700 hover:text-teal-800" href="/dashboard/forms">
            Forms
          </Link>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-950">
                {form.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
                {form.description || "No description yet."}
              </p>
            </div>
            <span className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800">
              {form.status}
            </span>
          </div>
        </header>

        {success ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {success}
          </p>
        ) : null}

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        {hasUploadFields && !uploadProvider.uploadsAvailable ? (
          <GoogleDriveUploadWarning />
        ) : null}

        <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm font-medium text-slate-950">Mode</p>
            <p className="mt-1 text-sm text-slate-700">{form.mode}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-950">Slug</p>
            <p className="mt-1 break-all text-sm text-slate-700">{form.slug}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-950">Version</p>
            <p className="mt-1 text-sm text-slate-700">{form.version}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-950">Public link</p>
            <Link className="mt-1 block text-sm text-teal-700 hover:text-teal-800" href={publicPath}>
              {publicPath}
            </Link>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-950">Created</p>
            <p className="mt-1 text-sm text-slate-700">{formatDate(form.createdAt)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-950">Updated</p>
            <p className="mt-1 text-sm text-slate-700">{formatDate(form.updatedAt)}</p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <form
            action={updateForm.bind(null, form.id)}
            className="flex flex-col gap-5 rounded-md border border-slate-200 bg-white p-6"
          >
            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                Basic details
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                These details identify the form before the builder is added.
              </p>
            </div>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
              Title
              <input
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                defaultValue={form.title}
                name="title"
                required
                type="text"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
              Description
              <textarea
                className="min-h-28 rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                defaultValue={form.description ?? ""}
                name="description"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
              Mode
              <select
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                defaultValue={form.mode}
                name="mode"
              >
                <option value={FormMode.STANDARD}>Standard</option>
                <option value={FormMode.AGREEMENT}>Agreement</option>
                <option value={FormMode.BOOKING}>Booking</option>
              </select>
            </label>

            <button
              className="w-fit rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
              type="submit"
            >
              Save changes
            </button>
          </form>

          <aside className="flex flex-col gap-4">
            <section className="rounded-md border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-slate-950">Status</h2>
              <div className="mt-4 flex flex-wrap gap-2">
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
            </section>

            <section className="rounded-md border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-slate-950">Next</h2>
              <div className="mt-4 flex flex-col gap-2">
                <Link
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-sm font-medium text-slate-800 transition hover:bg-slate-50"
                  href={`/dashboard/forms/${form.id}/builder`}
                >
                  Builder
                </Link>
                <Link
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-sm font-medium text-slate-800 transition hover:bg-slate-50"
                  href={`/dashboard/forms/${form.id}/submissions`}
                >
                  Submissions
                </Link>
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
