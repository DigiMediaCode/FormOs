import Link from "next/link";
import { ArrowLeft, BarChart3, Send, Users } from "lucide-react";
import { sendBroadcastEmailAction } from "@/app/admin/email-notifications/actions";
import {
  formatDate,
  inputClass,
  labelClass,
} from "@/app/admin/email-notifications/email-template-form";
import { RichContentEditor } from "@/components/admin/rich-content-editor";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

type BroadcastPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

function userDisplayName(user: {
  email: string;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
}) {
  return (
    user.name ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.email
  );
}

export default async function BroadcastEmailPage({
  searchParams,
}: BroadcastPageProps) {
  await requireSuperAdmin();
  const { error, success } = await searchParams;
  const [users, campaigns] = await Promise.all([
    prisma.user.findMany({
      where: {
        email: {
          not: "",
        },
        suspendedAt: null,
      },
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
      },
      take: 100,
    }),
    prisma.emailCampaign.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    }),
  ]);

  return (
    <main className="px-4 py-6 lg:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Super Admin / Emails / Broadcast
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950">
              Send Broadcast Email
            </h1>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Send a one-off announcement to all active users or a selected user group.
            </p>
          </div>
          <Link
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
            href="/admin/email-notifications"
          >
            <ArrowLeft className="size-4" />
            Back to Emails
          </Link>
        </header>

        {success ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {success}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Send className="size-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-950">
                Broadcast message
              </h2>
              <p className="text-xs leading-5 text-slate-500">
                Personalize with variables like <code>{"{{userName}}"}</code>,{" "}
                <code>{"{{firstName}}"}</code>, and <code>{"{{userEmail}}"}</code>.
              </p>
            </div>
          </div>

          <form action={sendBroadcastEmailAction} className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className={labelClass}>
                Campaign Name
                <input
                  className={inputClass}
                  name="name"
                  placeholder="June promotion"
                  required
                />
              </label>
              <label className={labelClass}>
                Subject
                <input
                  className={inputClass}
                  name="subject"
                  placeholder="A FormOS update for {{firstName}}"
                  required
                />
              </label>
            </div>

            <fieldset className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <legend className="px-1 text-xs font-semibold text-slate-700">
                Recipients
              </legend>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  className="size-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                  defaultChecked
                  name="recipientMode"
                  type="radio"
                  value="all"
                />
                Send to all active users
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  className="size-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                  name="recipientMode"
                  type="radio"
                  value="specific"
                />
                Send only to selected users/emails
              </label>
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <Users className="size-4" />
                    Select users
                  </div>
                  <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
                    {users.map((recipient) => (
                      <label
                        className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                        key={recipient.id}
                      >
                        <input
                          className="mt-0.5 size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          name="recipientUserIds"
                          type="checkbox"
                          value={recipient.id}
                        />
                        <span>
                          <span className="block font-semibold text-slate-900">
                            {userDisplayName(recipient)}
                          </span>
                          <span className="block text-xs text-slate-500">
                            {recipient.email}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <label className={labelClass}>
                  Or paste email addresses
                  <textarea
                    className={`${inputClass} min-h-40`}
                    name="recipientEmails"
                    placeholder="one@example.com, two@example.com"
                  />
                  <span className="text-xs font-normal text-slate-500">
                    Only existing, active FormOS users will receive the broadcast.
                  </span>
                </label>
              </div>
            </fieldset>

            <label className={labelClass}>
              Text Body
              <textarea
                className={`${inputClass} min-h-36 font-mono text-xs leading-6`}
                name="textBody"
                placeholder={"Hi {{userName}},\n\nHere is what is new in FormOS..."}
                required
              />
            </label>
            <div className={labelClass}>
              <span>Optional HTML Body</span>
              <RichContentEditor
                help="Use formatting and insert photos or videos. Uploaded media is stored in the FormOS Media Library."
                initialHtml={'<p>Hi {{userName}},</p><p>Here is what is new in FormOS...</p>'}
                label="Rich HTML Body"
                name="htmlBody"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs leading-5 text-slate-500">
                Broadcasts send immediately through the configured email provider.
                Tokens, app secrets, and payment data are never exposed.
              </p>
              <ConfirmSubmitButton
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                confirmMessage="Send this broadcast now?"
                pendingText="Sending broadcast..."
              >
                <Send className="size-4" />
                Send Broadcast
              </ConfirmSubmitButton>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-base font-semibold text-slate-950">
              Broadcast history
            </h2>
            <p className="text-xs text-slate-500">
              Review previous broadcasts and delivery counts.
            </p>
          </div>
          {campaigns.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Campaign</th>
                    <th className="px-3 py-2 font-semibold">Status</th>
                    <th className="px-3 py-2 font-semibold">Recipients</th>
                    <th className="px-3 py-2 font-semibold">Sent</th>
                    <th className="px-3 py-2 font-semibold">Failed</th>
                    <th className="px-3 py-2 font-semibold">Created</th>
                    <th className="px-3 py-2 font-semibold">Analytics</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id}>
                      <td className="px-3 py-2">
                        <p className="font-semibold text-slate-950">
                          {campaign.name}
                        </p>
                        <p className="max-w-xs truncate text-xs text-slate-500">
                          {campaign.subject}
                        </p>
                      </td>
                      <td className="px-3 py-2 text-xs font-semibold text-slate-600">
                        {campaign.status}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {campaign.recipientCount}
                      </td>
                      <td className="px-3 py-2 text-emerald-700">
                        {campaign.sentCount}
                      </td>
                      <td className="px-3 py-2 text-red-700">
                        {campaign.failedCount}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-500">
                        {formatDate(campaign.createdAt)}
                      </td>
                      <td className="px-3 py-2">
                        <Link
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          href={`/admin/email-notifications/broadcast/${campaign.id}`}
                        >
                          <BarChart3 className="size-3.5" />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              No broadcasts have been sent yet.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
