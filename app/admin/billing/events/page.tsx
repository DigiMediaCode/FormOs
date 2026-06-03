import Link from "next/link";
import {
  getBillingEventsForAdmin,
  getBillingHealthForAdmin,
} from "@/lib/billing/events";
import { prisma } from "@/lib/prisma";

type AdminBillingEventsPageProps = {
  searchParams: Promise<{
    status?: string;
    eventType?: string;
  }>;
};

function formatDate(date: Date | null) {
  if (!date) {
    return "Not processed";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function shortId(value: string | null) {
  if (!value) {
    return "Not set";
  }

  if (value.length <= 14) {
    return value;
  }

  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

function yesNo(value: boolean) {
  return value ? "Yes" : "No";
}

export default async function AdminBillingEventsPage({
  searchParams,
}: AdminBillingEventsPageProps) {
  const { status, eventType } = await searchParams;
  const [events, health] = await Promise.all([
    getBillingEventsForAdmin({ status, eventType }),
    getBillingHealthForAdmin(),
  ]);
  const userIds = [...new Set(events.map((event) => event.userId).filter(Boolean))] as string[];
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          email: true,
        },
      })
    : [];
  const userEmailById = new Map(users.map((user) => [user.id, user.email]));

  return (
    <main className="px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header>
          <h2 className="text-3xl font-semibold text-slate-950">
            Billing Events
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Inspect Stripe billing diagnostics, webhook processing, and plan
            sync events. Secrets and payment method details are not stored here.
          </p>
        </header>

        <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-6">
          <h3 className="text-xl font-semibold text-slate-950">Billing Health</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Stripe secret key configured</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">
                {yesNo(health.stripeSecretConfigured)}
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Webhook secret configured</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">
                {yesNo(health.stripeWebhookSecretConfigured)}
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Webhook endpoint</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">
                {health.webhookEndpointPath}
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Failed billing events</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">
                {health.failedBillingEventsCount}
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Recent successful webhooks</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">
                {health.recentSuccessfulWebhookEventsCount}
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Plans synced to Stripe</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">
                {health.syncedPlansCount}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-6">
          <form className="grid gap-4 md:grid-cols-[1fr_1fr_auto]" method="get">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
              Status
              <input
                className="rounded-md border border-slate-300 px-3 py-2"
                defaultValue={status ?? ""}
                name="status"
                placeholder="PROCESSED, FAILED, RECEIVED"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
              Event type
              <input
                className="rounded-md border border-slate-300 px-3 py-2"
                defaultValue={eventType ?? ""}
                name="eventType"
                placeholder="checkout.session.completed"
              />
            </label>
            <div className="flex items-end gap-2">
              <button className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white" type="submit">
                Filter
              </button>
              <Link
                className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-800"
                href="/admin/billing/events"
              >
                Clear
              </Link>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-700">
              <tr>
                <th className="px-4 py-3 font-medium">Event Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Subscription</th>
                <th className="px-4 py-3 font-medium">Message</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Processed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {events.map((event) => (
                <tr key={event.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {event.eventType}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{event.status}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {event.userId
                      ? userEmailById.get(event.userId) ?? shortId(event.userId)
                      : "Not set"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {shortId(event.customerId)}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {shortId(event.subscriptionId)}
                  </td>
                  <td className="max-w-md px-4 py-3 text-slate-700">
                    {event.message || "No message"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {formatDate(event.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {formatDate(event.processedAt)}
                  </td>
                </tr>
              ))}
              {events.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-600" colSpan={8}>
                    No billing events found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
