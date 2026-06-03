import { getAdminUsers } from "@/lib/admin/data";
import Link from "next/link";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
}

export default async function AdminUsersPage() {
  const users = await getAdminUsers();

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-semibold text-slate-950">Users</h2>
        <div className="mt-8 overflow-hidden rounded-md border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-700">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Country</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Forms</th>
                <th className="px-4 py-3 font-medium">Submissions</th>
                <th className="px-4 py-3 font-medium">Google Drive</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 text-slate-900">{user.name || "No name"}</td>
                  <td className="px-4 py-3 text-slate-700">{user.email}</td>
                  <td className="px-4 py-3 text-slate-700">{user.role}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {user.companyName || "Not set"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {user.country || "Not set"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3 text-slate-700">{user.formsCount}</td>
                  <td className="px-4 py-3 text-slate-700">{user.submissionsCount}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {user.googleDriveConnected ? "Yes" : "No"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {user.planName}
                    {user.hasQuotaOverride ? (
                      <span className="ml-2 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                        Custom
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    <Link
                      className="text-sm font-medium text-blue-700 hover:text-blue-800"
                      href={`/admin/users/${user.id}`}
                    >
                      Manage
                    </Link>
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
