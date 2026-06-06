import Link from "next/link";
import { Send } from "lucide-react";
import { SubmitButton } from "@/components/ui/submit-button";
import { prisma } from "@/lib/prisma";
import { escapeHtml, formatSupportDate } from "@/lib/support/requests";
import { verifySupportReplyToken } from "@/lib/support/reply-token";
import { createCustomerSupportReplyAction } from "@/app/support/reply/actions";

type SupportReplyPageProps = {
  searchParams: Promise<{
    token?: string;
    error?: string;
    success?: string;
  }>;
};

const inputClass =
  "rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default async function SupportReplyPage({
  searchParams,
}: SupportReplyPageProps) {
  const params = await searchParams;
  const token = params.token ?? "";
  const payload = verifySupportReplyToken(token);

  if (!payload) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-600">
            Support Reply
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">
            This reply link is invalid or expired
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Please contact FormOS support again so we can continue helping you.
          </p>
          <Link
            className="mt-5 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            href="/contact"
          >
            Contact Support
          </Link>
        </section>
      </main>
    );
  }

  const request = await prisma.supportRequest.findFirst({
    where: {
      id: payload.requestId,
      email: payload.email,
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
        take: 10,
      },
    },
  });

  if (!request) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-600">
            Support Reply
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">
            Support request not found
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            This link no longer matches an active support request.
          </p>
          <Link
            className="mt-5 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            href="/contact"
          >
            Contact Support
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto grid max-w-3xl gap-5">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <Link className="text-sm font-semibold text-blue-700" href="/">
            FormOS
          </Link>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
            Support Reply
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">
            {request.subject}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
              {request.status}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
              Request {request.id}
            </span>
          </div>
        </header>

        {params.success ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {params.success}
          </p>
        ) : null}
        {params.error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {params.error}
          </p>
        ) : null}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">
            Conversation
          </h2>
          <div className="mt-4 grid gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Your original request
              </p>
              <div
                className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700"
                dangerouslySetInnerHTML={{
                  __html: escapeHtml(request.message),
                }}
              />
            </div>
            {request.messages.map((message) => (
              <div
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                key={message.id}
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-semibold text-slate-950">
                    {message.authorType === "ADMIN"
                      ? "FormOS Support"
                      : message.authorName || request.name || "You"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatSupportDate(message.createdAt)}
                  </p>
                </div>
                <div
                  className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700"
                  dangerouslySetInnerHTML={{
                    __html: escapeHtml(message.message),
                  }}
                />
              </div>
            ))}
          </div>
        </section>

        <form
          action={createCustomerSupportReplyAction}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <input name="token" type="hidden" value={token} />
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
            Reply message
            <textarea
              className={`${inputClass} min-h-40`}
              maxLength={5000}
              minLength={2}
              name="message"
              placeholder="Write your reply to FormOS support."
              required
            />
          </label>
          <SubmitButton
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            pendingText="Sending reply..."
          >
            <Send className="size-4" />
            Send Reply
          </SubmitButton>
        </form>
      </section>
    </main>
  );
}
