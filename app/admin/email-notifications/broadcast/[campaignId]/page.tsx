import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MailCheck, MailWarning, Send, Users } from "lucide-react";
import { formatDate } from "@/app/admin/email-notifications/email-template-form";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

type CampaignAnalyticsPageProps = {
  params: Promise<{
    campaignId: string;
  }>;
};

function percent(value: number, total: number) {
  if (total <= 0) {
    return "0%";
  }

  return `${Math.round((value / total) * 100)}%`;
}

export default async function CampaignAnalyticsPage({
  params,
}: CampaignAnalyticsPageProps) {
  await requireSuperAdmin();
  const { campaignId } = await params;
  const campaign = await prisma.emailCampaign.findUnique({
    where: {
      id: campaignId,
    },
  });

  if (!campaign) {
    notFound();
  }

  return (
    <main className="px-4 py-6 lg:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Super Admin / Emails / Broadcast Analytics
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950">
              {campaign.name}
            </h1>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Sent {formatDate(campaign.createdAt)} - Status {campaign.status}
            </p>
          </div>
          <Link
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
            href="/admin/email-notifications/broadcast"
          >
            <ArrowLeft className="size-4" />
            Back to Broadcasts
          </Link>
        </header>

        <section className="grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <Users className="size-5 text-blue-600" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Recipients
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">
              {campaign.recipientCount}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <MailCheck className="size-5 text-emerald-600" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Sent
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">
              {campaign.sentCount}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <MailWarning className="size-5 text-red-600" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Failed
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">
              {campaign.failedCount}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <Send className="size-5 text-indigo-600" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Delivery rate
            </p>
            <p className="mt-1 text-2xl font-semibold text-slate-950">
              {percent(campaign.sentCount, campaign.recipientCount)}
            </p>
          </div>
        </section>

        <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Subject
            </p>
            <p className="mt-1 text-base font-semibold text-slate-950">
              {campaign.subject}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Text body
            </p>
            <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">
              {campaign.textBody}
            </pre>
          </div>
          {campaign.htmlBody ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                HTML preview
              </p>
              <div
                className="mt-2 rounded-xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700"
                dangerouslySetInnerHTML={{ __html: campaign.htmlBody }}
              />
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
