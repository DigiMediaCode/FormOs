import { getAdminUsers } from "@/lib/admin/data";
import Link from "next/link";
import {
  deleteUserAction,
  reactivateUserAction,
  suspendUserAction,
} from "@/app/admin/users/actions";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Ban, RotateCcw, Trash2, UserCog } from "lucide-react";

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

const successIconButtonClass =
  "inline-flex h-8 w-8 items-center justify-center rounded-md border border-emerald-100 bg-white text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40";

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
    <main className="px-4 py-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[92rem]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">
              Super Admin
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Users</h2>
            <p className="mt-1 text-sm text-slate-600">
              Review accounts, plans, usage, and safe account controls.
            </p>
          </div>
          <p className="mt-3 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-700 sm:mt-0">{users.length} users</p>
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
        <div className="mt-5 overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-[980px] divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 font-semibold">User</th>
                <th className="px-3 py-2 font-semibold">Role/Auth</th>
                <th className="px-3 py-2 font-semibold">Business</th>
                <th className="px-3 py-2 font-semibold">Usage</th>
                <th className="px-3 py-2 font-semibold">Plan/Billing</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Created</th>
                <th className="px-3 py-2 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((user) => (
                <tr className="align-top transition hover:bg-slate-50/70" key={user.id}>
                  <td className="max-w-64 px-3 py-2">
                    <p className="truncate font-semibold text-slate-950">
                      {user.name || "No name"}
                    </p>
                    <p className="truncate text-slate-500">{user.email}</p>
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    <p className="font-medium text-slate-800">{user.role}</p>
                    <p className="mt-0.5">{user.authMethods}</p>
                  </td>
                  <td className="max-w-48 px-3 py-2 text-slate-600">
                    <p className="truncate">{user.companyName || "Not set"}</p>
                    <p className="mt-0.5 truncate text-slate-400">{user.country || "No country"}</p>
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    <p>{user.formsCount} forms · {user.submissionsCount} subs</p>
                    <p className="mt-0.5">{user.teamMembersCount} team · Drive {user.googleDriveConnected ? "yes" : "no"}</p>
                  </td>
                  <td className="max-w-52 px-3 py-2 text-slate-600">
                    <p className="truncate font-medium text-slate-800">
                      {user.planName}
                      {user.hasQuotaOverride ? (
                        <span className="ml-1 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                          Custom
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 truncate text-slate-500">
                      {user.subscriptionStatus} · {user.billingProvider || "No provider"}
                    </p>
                  </td>
                  <td className="px-3 py-2">
                    {user.suspendedAt ? (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
                        Suspended
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-600">{formatDate(user.createdAt)}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex items-center justify-end gap-1">
                      <Link
                        aria-label={`Manage ${user.email}`}
                        className={iconButtonClass}
                        href={`/admin/users/${user.id}`}
                        title="Manage user"
                      >
                        <UserCog className="h-4 w-4" />
                      </Link>
                      {user.suspendedAt ? (
                        <form action={reactivateUserAction.bind(null, user.id)}>
                          <SubmitButton
                            className={successIconButtonClass}
                            pendingText="Reactivating..."
                            showStatus={false}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </SubmitButton>
                        </form>
                      ) : (
                        <form action={suspendUserAction.bind(null, user.id)}>
                          <input name="suspendedReason" type="hidden" value="Suspended by Super Admin" />
                          <ConfirmSubmitButton
                            className={iconButtonClass}
                            confirmMessage="Suspend this user?"
                            pendingText="Suspending..."
                          >
                            <Ban className="h-4 w-4" />
                          </ConfirmSubmitButton>
                        </form>
                      )}
                      <form action={deleteUserAction.bind(null, user.id)}>
                        <ConfirmSubmitButton
                          className={dangerIconButtonClass}
                          confirmMessage="Delete this user? This is only allowed when safe and cannot be undone."
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
