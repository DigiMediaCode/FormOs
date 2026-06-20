import Link from "next/link";
import {
  BarChart3,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
} from "lucide-react";
import {
  seedDefaultEmailTemplatesAction,
} from "@/app/admin/email-notifications/actions";
import { formatDate } from "@/app/admin/email-notifications/email-template-form";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireSuperAdmin } from "@/lib/admin/auth";
import {
  EMAIL_TEMPLATE_KEYS,
  seedDefaultEmailTemplatesIfMissing,
} from "@/lib/email/templates";
import { prisma } from "@/lib/prisma";

type EmailNotificationsPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

function statusBadge(isActive: boolean) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        isActive
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

export default async function EmailNotificationsPage({
  searchParams,
}: EmailNotificationsPageProps) {
  const user = await requireSuperAdmin();
  await seedDefaultEmailTemplatesIfMissing(user.id);
  const { error, success } = await searchParams;

  const [templates, campaigns] = await Promise.all([
    prisma.emailTemplate.findMany({
      orderBy: [{ key: "asc" }],
    }),
    prisma.emailCampaign.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),
  ]);
  const builtInKeys = EMAIL_TEMPLATE_KEYS as readonly string[];

  return (
    <main className="px-4 py-6 lg:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Super Admin / Emails
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950">
              Email Templates
            </h1>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Manage system email templates and send broadcast emails from one
              focused area.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              href="/admin/email-notifications/new"
            >
              <Plus className="size-4" />
              New Template
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
              href="/admin/email-notifications/broadcast"
            >
              <Send className="size-4 text-blue-600" />
              Send Broadcast
            </Link>
            <form action={seedDefaultEmailTemplatesAction}>
              <SubmitButton
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
                pendingText="Checking..."
                showStatus={false}
              >
                <Sparkles className="size-4 text-blue-600" />
                Seed Defaults
              </SubmitButton>
            </form>
          </div>
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

        <section className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Templates
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {templates.length}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Active
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {templates.filter((template) => template.isActive).length}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Broadcasts
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {campaigns.length}
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950">
                Templates
              </h2>
              <p className="text-xs text-slate-500">
                Built-in and custom notification templates.
              </p>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {templates.map((template) => (
              <article
                className="grid gap-3 px-4 py-3 md:grid-cols-[1fr_auto] md:items-center"
                key={template.id}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Mail className="size-4 text-blue-600" />
                    <Link
                      className="font-semibold text-slate-950 hover:text-blue-700"
                      href={`/admin/email-notifications/${template.id}`}
                    >
                      {template.name}
                    </Link>
                    {statusBadge(template.isActive)}
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {builtInKeys.includes(template.key) ? "System" : "Custom"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {template.description || template.subject}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Key: {template.key} - Updated {formatDate(template.updatedAt)}
                  </p>
                </div>
                <Link
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
                  href={`/admin/email-notifications/${template.id}`}
                >
                  <Pencil className="size-4" />
                  Edit
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-950">
                Recent Broadcasts
              </h2>
              <p className="text-xs text-slate-500">
                Latest email campaigns sent to users.
              </p>
            </div>
            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800"
              href="/admin/email-notifications/broadcast"
            >
              View all
              <BarChart3 className="size-4" />
            </Link>
          </div>
          {campaigns.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {campaigns.map((campaign) => (
                <article
                  className="grid gap-3 px-4 py-3 md:grid-cols-[1fr_auto] md:items-center"
                  key={campaign.id}
                >
                  <div>
                    <p className="font-semibold text-slate-950">{campaign.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{campaign.subject}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {campaign.sentCount}/{campaign.recipientCount} sent -{" "}
                      {formatDate(campaign.createdAt)}
                    </p>
                  </div>
                  <Link
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
                    href={`/admin/email-notifications/broadcast/${campaign.id}`}
                  >
                    <BarChart3 className="size-4" />
                    Analytics
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              No broadcasts sent yet.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
