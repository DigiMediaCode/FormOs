import { getAdminUsers } from "@/lib/admin/data";
import Link from "next/link";
import {
  deleteUserAction,
  reactivateUserAction,
  suspendUserAction,
} from "@/app/admin/users/actions";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { SubmitButton } from "@/components/ui/submit-button";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
}

type AdminUsersPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const { error, success } = await searchParams;
  const users = await getAdminUsers();

  return (
    <main className="px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-semibold text-slate-950">Users</h2>
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
          <table className="min-w-[1200px] divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-700">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Auth</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Country</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Forms</th>
                <th className="px-4 py-3 font-medium">Submissions</th>
                <th className="px-4 py-3 font-medium">Team</th>
                <th className="px-4 py-3 font-medium">Google Drive</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Billing</th>
                <th className="px-4 py-3 font-medium">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 text-slate-900">{user.name || "No name"}</td>
                  <td className="px-4 py-3 text-slate-700">{user.email}</td>
                  <td className="px-4 py-3 text-slate-700">{user.authMethods}</td>
                  <td className="px-4 py-3 text-slate-700">{user.role}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {user.companyName || "Not set"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {user.country || "Not set"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {user.suspendedAt ? (
                      <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                        Suspended
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{user.formsCount}</td>
                  <td className="px-4 py-3 text-slate-700">{user.submissionsCount}</td>
                  <td className="px-4 py-3 text-slate-700">{user.teamMembersCount}</td>
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
                    <div>{user.subscriptionStatus}</div>
                    <div className="text-xs text-slate-500">
                      {user.billingProvider || "No provider"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    <div className="flex min-w-56 flex-wrap gap-2">
                      <Link
                        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-blue-700 hover:bg-slate-50"
                        href={`/admin/users/${user.id}`}
                      >
                        Manage
                      </Link>
                      {user.suspendedAt ? (
                        <form action={reactivateUserAction.bind(null, user.id)}>
                          <SubmitButton
                            className="rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                            pendingText="Reactivating..."
                            showStatus={false}
                          >
                            Reactivate
                          </SubmitButton>
                        </form>
                      ) : (
                        <form action={suspendUserAction.bind(null, user.id)}>
                          <input name="suspendedReason" type="hidden" value="Suspended by Super Admin" />
                          <ConfirmSubmitButton
                            confirmMessage="Suspend this user?"
                            pendingText="Suspending..."
                          >
                            Suspend
                          </ConfirmSubmitButton>
                        </form>
                      )}
                      <form action={deleteUserAction.bind(null, user.id)}>
                        <ConfirmSubmitButton
                          confirmMessage="Delete this user? This is only allowed when safe and cannot be undone."
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
