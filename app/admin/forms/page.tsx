import { getAdminForms } from "@/lib/admin/data";
import {
  archiveAdminFormAction,
  deleteAdminFormAction,
} from "@/app/admin/forms/actions";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { SubmitButton } from "@/components/ui/submit-button";
import Link from "next/link";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
}

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
    <main className="px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-semibold text-slate-950">Forms</h2>
        {success ? (
          <p className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {success}
          </p>
        ) : null}
        {error ? (
          <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}
        <div className="mt-8 overflow-x-auto rounded-md border border-slate-200 bg-white">
          <table className="min-w-[980px] divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-700">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Mode</th>
                <th className="px-4 py-3 font-medium">Version</th>
                <th className="px-4 py-3 font-medium">Submissions</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="px-4 py-3 font-medium">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {forms.map((form) => (
                <tr key={form.id}>
                  <td className="px-4 py-3 text-slate-900">{form.title}</td>
                  <td className="px-4 py-3 text-slate-700">{form.owner.email}</td>
                  <td className="px-4 py-3 text-slate-700">{form.status}</td>
                  <td className="px-4 py-3 text-slate-700">{form.mode}</td>
                  <td className="px-4 py-3 text-slate-700">v{form.version}</td>
                  <td className="px-4 py-3 text-slate-700">{form._count.submissions}</td>
                  <td className="px-4 py-3 text-slate-700">{formatDate(form.createdAt)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatDate(form.updatedAt)}</td>
                  <td className="px-4 py-3 text-slate-700">
                    <div className="flex min-w-56 flex-wrap gap-2">
                      <Link
                        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-blue-700 hover:bg-slate-50"
                        href={`/admin/forms/${form.id}`}
                      >
                        View
                      </Link>
                      <form action={archiveAdminFormAction.bind(null, form.id)}>
                        <SubmitButton
                          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                          pendingText="Archiving..."
                          showStatus={false}
                        >
                          Archive
                        </SubmitButton>
                      </form>
                      <form action={deleteAdminFormAction.bind(null, form.id)}>
                        <ConfirmSubmitButton
                          confirmMessage="Delete this form? Forms with submissions are blocked and should be archived."
                          disabled={form._count.submissions > 0}
                          pendingText="Deleting..."
                        >
                          Delete
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
