import Link from "next/link";
import { notFound } from "next/navigation";
import {
  replyToSupportRequestAction,
  updateSupportRequestAction,
} from "@/app/admin/support/actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireSuperAdmin } from "@/lib/admin/auth";
import {
  escapeHtml,
  formatSupportDate,
  SUPPORT_PRIORITIES,
  SUPPORT_STATUSES,
} from "@/lib/support/requests";
import { prisma } from "@/lib/prisma";

type AdminSupportDetailPageProps = {
  params: Promise<{
    requestId: string;
  }>;
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

const inputClass =
  "rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass = "flex flex-col gap-1.5 text-sm font-medium text-slate-700";

export default async function AdminSupportDetailPage({
  params,
  searchParams,
}: AdminSupportDetailPageProps) {
  await requireSuperAdmin();
  const [{ requestId }, messages] = await Promise.all([params, searchParams]);
  const request = await prisma.supportRequest.findUnique({
    where: { id: requestId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      messages: {
        orderBy: {
          createdAt: "asc",
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!request) {
    notFound();
  }

  return (
    <main className="px-4 py-6 lg:px-6">
      <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="grid gap-5">
          <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Link
              className="text-sm font-semibold text-slate-600 hover:text-slate-950"
              href="/admin/support"
            >
              Back to support requests
            </Link>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">
              {request.subject}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{request.id}</p>
          </header>

          {messages.success ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {messages.success}
            </p>
          ) : null}
          {messages.error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {messages.error}
            </p>
          ) : null}

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 text-sm md:grid-cols-2">
              <Info label="Name" value={request.name || "Not provided"} />
              <Info label="Email" value={request.email} />
              <Info label="Category" value={request.category || "Other"} />
              <Info label="Source" value={request.source} />
              <Info label="Status" value={request.status} />
              <Info label="Priority" value={request.priority} />
              <Info label="Created" value={formatSupportDate(request.createdAt)} />
              <Info label="Resolved" value={formatSupportDate(request.resolvedAt)} />
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Message
              </p>
              <div
                className="mt-2 whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700"
                dangerouslySetInnerHTML={{
                  __html: escapeHtml(request.message),
                }}
              />
            </div>

            {request.user ? (
              <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm">
                <p className="font-semibold text-slate-950">Linked user</p>
                <p className="mt-1 text-slate-600">
                  {request.user.name || request.user.email} · {request.user.role}
                </p>
                <Link
                  className="mt-2 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-800"
                  href={`/admin/users/${request.user.id}`}
                >
                  View user
                </Link>
              </div>
            ) : null}
          </article>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">
                  Conversation
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Public replies sent to the customer are saved here. Internal
                  admin notes stay private in the side panel.
                </p>
              </div>
              <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                {request.messages.length} replies
              </span>
            </div>

            <div className="mt-5 grid gap-4">
              {request.messages.length > 0 ? (
                request.messages.map((message) => (
                  <div
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    key={message.id}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          {message.authorType === "ADMIN"
                            ? message.author?.name ||
                              message.author?.email ||
                              message.authorName ||
                              "FormOS Support"
                            : message.authorName || request.name || "Customer"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatSupportDate(message.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${
                          message.emailStatus?.startsWith("SENT")
                            ? "bg-emerald-50 text-emerald-700"
                            : message.emailStatus?.startsWith("FAILED")
                              ? "bg-red-50 text-red-700"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {message.emailStatus || message.visibility}
                      </span>
                    </div>
                    <div
                      className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700"
                      dangerouslySetInnerHTML={{
                        __html: escapeHtml(message.message),
                      }}
                    />
                  </div>
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">
                  No customer replies have been sent yet.
                </p>
              )}
            </div>
          </section>
        </section>

        <aside className="grid gap-5 lg:sticky lg:top-6 lg:h-fit">
        <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-950">Reply to customer</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            This sends an email to {request.email} and saves the reply in the
            conversation history.
          </p>
          <form
            action={replyToSupportRequestAction.bind(null, request.id)}
            className="mt-4 grid gap-4"
          >
            <label className={labelClass}>
              Status after reply
              <select className={inputClass} defaultValue={request.status} name="status">
                {SUPPORT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Priority
              <select className={inputClass} defaultValue={request.priority} name="priority">
                {SUPPORT_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Public Reply
              <textarea
                className={`${inputClass} min-h-40`}
                maxLength={5000}
                name="replyMessage"
                placeholder="Write the message that should be emailed to the customer."
                required
              />
            </label>
            <SubmitButton
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              pendingText="Sending reply..."
            >
              Send Reply
            </SubmitButton>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-950">Manage request</h3>
          <form
            action={updateSupportRequestAction.bind(null, request.id)}
            className="mt-4 grid gap-4"
          >
            <label className={labelClass}>
              Status
              <select className={inputClass} defaultValue={request.status} name="status">
                {SUPPORT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Priority
              <select className={inputClass} defaultValue={request.priority} name="priority">
                {SUPPORT_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Admin Notes
              <textarea
                className={`${inputClass} min-h-40`}
                defaultValue={request.adminNotes ?? ""}
                maxLength={5000}
                name="adminNotes"
                placeholder="Internal notes only. These are not shown publicly."
              />
            </label>
            <SubmitButton
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              pendingText="Saving request..."
            >
              Save Request
            </SubmitButton>
          </form>
        </section>
        </aside>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-slate-800">{value}</p>
    </div>
  );
}
