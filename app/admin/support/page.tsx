import Link from "next/link";
import { Eye, MessageSquare } from "lucide-react";
import { requireSuperAdmin } from "@/lib/admin/auth";
import {
  formatSupportDate,
  SUPPORT_CATEGORIES,
  SUPPORT_PRIORITIES,
  SUPPORT_STATUSES,
} from "@/lib/support/requests";
import { prisma } from "@/lib/prisma";

type AdminSupportPageProps = {
  searchParams: Promise<{
    category?: string;
    error?: string;
    priority?: string;
    status?: string;
    success?: string;
  }>;
};

function badgeClass(value: string) {
  if (value === "OPEN" || value === "URGENT") {
    return "bg-red-50 text-red-700";
  }

  if (value === "IN_PROGRESS" || value === "HIGH") {
    return "bg-amber-50 text-amber-700";
  }

  if (value === "RESOLVED" || value === "CLOSED" || value === "LOW") {
    return "bg-slate-100 text-slate-600";
  }

  return "bg-blue-50 text-blue-700";
}

export default async function AdminSupportPage({
  searchParams,
}: AdminSupportPageProps) {
  await requireSuperAdmin();
  const params = await searchParams;
  const where = {
    ...(params.status ? { status: params.status } : {}),
    ...(params.category ? { category: params.category } : {}),
    ...(params.priority ? { priority: params.priority } : {}),
  };
  const requests = await prisma.supportRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  return (
    <main className="px-4 py-6 lg:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
            Super Admin
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-950">
            Support Requests
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            View and manage public contact requests from FormOS visitors and users.
          </p>
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

        <form className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
          <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" name="status" defaultValue={params.status ?? ""}>
            <option value="">All statuses</option>
            {SUPPORT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" name="category" defaultValue={params.category ?? ""}>
            <option value="">All categories</option>
            {SUPPORT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <select className="rounded-xl border border-slate-200 px-3 py-2 text-sm" name="priority" defaultValue={params.priority ?? ""}>
            <option value="">All priorities</option>
            {SUPPORT_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
          <button className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white" type="submit">
            Filter
          </button>
        </form>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Request</th>
                  <th className="px-4 py-3 font-semibold">Requester</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Priority</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                  <th className="px-4 py-3 text-right font-semibold">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((request) => (
                  <tr key={request.id} className="align-top">
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <MessageSquare className="size-4" />
                        </span>
                        <div>
                          <p className="font-semibold text-slate-950">{request.subject}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{request.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <p>{request.name || "No name"}</p>
                      <p className="text-xs text-slate-500">{request.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{request.category || "Other"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass(request.priority)}`}>
                        {request.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {formatSupportDate(request.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Link
                          className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                          href={`/admin/support/${request.id}`}
                          title="View support request"
                        >
                          <Eye className="size-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {requests.length === 0 ? (
                  <tr>
                    <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={7}>
                      No support requests found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
