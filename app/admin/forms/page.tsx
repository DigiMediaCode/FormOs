import { getAdminForms } from "@/lib/admin/data";
import {
  archiveAdminFormAction,
  deleteAdminFormAction,
} from "@/app/admin/forms/actions";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { SubmitButton } from "@/components/ui/submit-button";
import Link from "next/link";
import { Archive, Eye, Trash2 } from "lucide-react";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "2-digit",
  }).format(date);
}

const iconButtonClass =
  "inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40";

const dangerIconButtonClass =
  "inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-100 bg-white text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40";

type AdminFormsPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function AdminFormsPage({ searchParams }: AdminFormsPageProps) {
  const { error, success } = await searchParams;
  const forms = await getAdminForms();

  return (
    <main className="px-4 py-6 lg:px-6">
      <div className="mx-auto max-w-[92rem]">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
              Super Admin
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">Forms</h2>
          </div>
          <p className="text-sm text-slate-500">{forms.length} forms</p>
        </div>
        {success ? (
          <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {success}
          </p>
        ) : null}
        {error ? (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}
        <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-[860px] divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 font-semibold">Form</th>
                <th className="px-3 py-2 font-semibold">Owner</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Type</th>
                <th className="px-3 py-2 font-semibold">Subs</th>
                <th className="px-3 py-2 font-semibold">Dates</th>
                <th className="px-3 py-2 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {forms.map((form) => (
                <tr className="align-top transition hover:bg-slate-50/70" key={form.id}>
                  <td className="max-w-80 px-3 py-2">
                    <p className="truncate font-semibold text-slate-950">{form.title}</p>
                    <p className="mt-0.5 text-slate-500">v{form.version}</p>
                  </td>
                  <td className="max-w-64 px-3 py-2 text-slate-600">
                    <p className="truncate">{form.owner.email}</p>
                  </td>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                      {form.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-600">{form.mode}</td>
                  <td className="px-3 py-2 text-slate-600">{form._count.submissions}</td>
                  <td className="px-3 py-2 text-slate-600">
                    <p>Created {formatDate(form.createdAt)}</p>
                    <p className="mt-0.5 text-slate-400">Updated {formatDate(form.updatedAt)}</p>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex items-center justify-end gap-1">
                      <Link
                        aria-label={`View ${form.title}`}
                        className={iconButtonClass}
                        href={`/admin/forms/${form.id}`}
                        title="View form"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <form action={archiveAdminFormAction.bind(null, form.id)}>
                        <SubmitButton
                          className={iconButtonClass}
                          pendingText="Archiving..."
                          showStatus={false}
                        >
                          <Archive className="h-4 w-4" />
                        </SubmitButton>
                      </form>
                      <form action={deleteAdminFormAction.bind(null, form.id)}>
                        <ConfirmSubmitButton
                          className={dangerIconButtonClass}
                          confirmMessage="Delete this form? Forms with submissions are blocked and should be archived."
                          disabled={form._count.submissions > 0}
                          pendingText="Deleting..."
                        >
                          <Trash2 className="h-4 w-4" />
                        </ConfirmSubmitButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
