import Link from "next/link";
import { WorkspaceRole } from "@prisma/client";
import {
  inviteWorkspaceMember,
  removeWorkspaceMember,
  updateWorkspaceMemberRole,
} from "@/app/dashboard/settings/team/actions";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { SubmitButton } from "@/components/ui/submit-button";
import { getUserPlanAccess, limitLabel } from "@/lib/plans/limits";
import { prisma } from "@/lib/prisma";
import {
  getOrCreateUserWorkspace,
  requireWorkspaceOwner,
} from "@/lib/workspaces/access";

type TeamSettingsPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
}

export default async function TeamSettingsPage({
  searchParams,
}: TeamSettingsPageProps) {
  const context = await requireWorkspaceOwner();
  const { error, success } = await searchParams;
  const workspace = await getOrCreateUserWorkspace(context.ownerId);
  const [access, members, pendingInvites] = await Promise.all([
    getUserPlanAccess(context.ownerId),
    prisma.workspaceMember.findMany({
      where: {
        workspaceId: workspace.id,
        status: "ACTIVE",
      },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        role: true,
        invitedEmail: true,
        createdAt: true,
        userId: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.workspaceInvite.findMany({
      where: {
        workspaceId: workspace.id,
        acceptedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        email: true,
        role: true,
        expiresAt: true,
        createdAt: true,
      },
    }),
  ]);

  const staffCount = members.filter(
    (member) => member.role !== WorkspaceRole.OWNER,
  ).length;
  const allowed = access.limits.allowTeamMembers;

  return (
    <main className="px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header>
          <h1 className="text-3xl font-semibold text-slate-950">Team</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Invite staff to help manage forms and submissions in your workspace.
          </p>
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

        {!allowed ? (
          <section className="rounded-md border border-amber-200 bg-amber-50 p-6">
            <h2 className="text-xl font-semibold text-amber-950">
              Team access is available on Business plans.
            </h2>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              Your current plan is {access.plan.name}. Upgrade when you are
              ready to invite staff into your workspace.
            </p>
            <Link
              className="mt-5 inline-flex rounded-md bg-amber-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-800"
              href="/dashboard/settings/billing"
            >
              Upgrade from Billing
            </Link>
          </section>
        ) : (
          <>
            <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">
                    {workspace.name || "My Workspace"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Staff seats used: {staffCount} /{" "}
                    {limitLabel(access.limits.maxTeamMembers)}
                  </p>
                </div>
                {access.hasCustomQuota ? (
                  <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    Custom quota applied
                  </span>
                ) : null}
              </div>

              <form action={inviteWorkspaceMember} className="grid gap-4 md:grid-cols-[1fr_180px_auto] md:items-end">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
                  Staff email
                  <input
                    className="rounded-md border border-slate-300 px-3 py-2"
                    name="email"
                    placeholder="staff@example.com"
                    required
                    type="email"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
                  Role
                  <select
                    className="rounded-md border border-slate-300 px-3 py-2"
                    name="role"
                    defaultValue={WorkspaceRole.STAFF}
                  >
                    <option value={WorkspaceRole.ADMIN}>Admin</option>
                    <option value={WorkspaceRole.STAFF}>Staff</option>
                  </select>
                </label>
                <SubmitButton
                  className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                  pendingText="Sending invite..."
                >
                  Invite Staff
                </SubmitButton>
              </form>
            </section>

            <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-950">
                Team Members
              </h2>
              <div className="grid gap-3">
                {members.map((member) => (
                  <div
                    className="grid gap-3 rounded-md border border-slate-200 p-4 lg:grid-cols-[1fr_180px_auto_auto] lg:items-center"
                    key={member.id}
                  >
                    <div>
                      <p className="font-medium text-slate-950">
                        {member.user.name || member.user.email}
                      </p>
                      <p className="text-sm text-slate-600">{member.user.email}</p>
                    </div>
                    <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {member.role}
                    </span>
                    {member.role === WorkspaceRole.OWNER ? (
                      <p className="text-sm text-slate-500">Workspace owner</p>
                    ) : (
                      <>
                        <form
                          action={updateWorkspaceMemberRole.bind(null, member.id)}
                          className="flex gap-2"
                        >
                          <select
                            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                            name="role"
                            defaultValue={member.role}
                          >
                            <option value={WorkspaceRole.ADMIN}>Admin</option>
                            <option value={WorkspaceRole.STAFF}>Staff</option>
                          </select>
                          <SubmitButton
                            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
                            pendingText="Saving role..."
                            showStatus={false}
                          >
                            Save
                          </SubmitButton>
                        </form>
                        <form action={removeWorkspaceMember.bind(null, member.id)}>
                          <ConfirmSubmitButton
                            confirmMessage="Remove this team member from your workspace?"
                            pendingText="Removing..."
                          >
                            Remove
                          </ConfirmSubmitButton>
                        </form>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-slate-950">
                Pending Invites
              </h2>
              {pendingInvites.length === 0 ? (
                <p className="text-sm text-slate-600">No pending invites.</p>
              ) : (
                <div className="grid gap-3">
                  {pendingInvites.map((invite) => (
                    <div
                      className="rounded-md border border-slate-200 p-4"
                      key={invite.id}
                    >
                      <p className="font-medium text-slate-950">{invite.email}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {invite.role} invite sent {formatDate(invite.createdAt)}.
                        Expires {formatDate(invite.expiresAt)}.
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
