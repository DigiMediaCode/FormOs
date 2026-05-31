import { getAdminForms } from "@/lib/admin/data";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
}

export default async function AdminFormsPage() {
  const forms = await getAdminForms();

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-semibold text-slate-950">Forms</h2>
        <div className="mt-8 overflow-hidden rounded-md border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
