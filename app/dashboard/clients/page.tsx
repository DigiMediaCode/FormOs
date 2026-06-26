import Link from "next/link";
import { BriefcaseBusiness, ClipboardList, Plus, Search, UserRound } from "lucide-react";
import { getUserEffectiveLimits } from "@/lib/plans/limits";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMember } from "@/lib/workspaces/access";

type ClientsPageProps = {
  searchParams: Promise<{
    q?: string;
    error?: string;
    success?: string;
  }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function lockedFeature() {
  return (
    <section className="rounded-3xl border border-blue-100 bg-blue-50 p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-blue-700">
          <UserRound className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
            Clients
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">
            Clients are available on Pro and Business plans.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
            Upgrade to save reusable client records from form submissions and keep
            customer details connected to your workflow history.
          </p>
          <Link
            className="mt-4 inline-flex rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            href="/dashboard/settings/billing"
          >
            View plans
          </Link>
        </div>
      </div>
    </section>
  );
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const context = await requireWorkspaceMember();
  const { q, error, success } = await searchParams;
  const limits = await getUserEffectiveLimits(context.ownerId);
  const search = String(q ?? "").trim();

  if (!limits.allowClients) {
    return (
      <main className="min-h-screen px-4 py-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-6xl">{lockedFeature()}</div>
      </main>
    );
  }

  const clients = await prisma.client.findMany({
    where: {
      ownerId: context.ownerId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { companyName: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      type: true,
      name: true,
      email: true,
      phone: true,
      companyName: true,
      createdAt: true,
      sourceSubmission: {
        select: {
          id: true,
          formId: true,
          createdAt: true,
          form: {
            select: {
              title: true,
            },
          },
        },
      },
    },
  });

  return (
    <main className="min-h-screen px-4 py-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
              Workspace
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Clients
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Save customer details from completed forms and keep them linked to submissions.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 sm:mt-0">
            <Link
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              href="/dashboard/forms"
            >
              <ClipboardList className="h-4 w-4" />
              View submissions
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              href="/dashboard/clients/new"
            >
              <Plus className="h-4 w-4" />
              Create Client
            </Link>
          </div>
        </header>

        {success ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {success}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <form className="flex gap-2" action="/dashboard/clients">
            <label className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                defaultValue={search}
                name="q"
                placeholder="Search clients by name, email, or company..."
              />
            </label>
            <button className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white" type="submit">
              Search
            </button>
          </form>
        </section>

        {clients.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-blue-200 bg-blue-50 p-8 text-center shadow-sm">
            <UserRound className="mx-auto h-8 w-8 text-blue-700" />
            <h2 className="mt-3 text-xl font-semibold text-slate-950">
              No clients yet.
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-700">
              Convert a form submission into a client or create one manually.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link
                className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                href="/dashboard/clients/new"
              >
                Create Client
              </Link>
              <Link
                className="rounded-2xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                href="/dashboard/forms"
              >
                View Submissions
              </Link>
            </div>
          </section>
        ) : (
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="hidden grid-cols-[1.3fr_1fr_1fr_1.2fr_120px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-600 lg:grid">
              <span>Client</span>
              <span>Contact</span>
              <span>Company</span>
              <span>Source</span>
              <span>Action</span>
            </div>
            <div className="divide-y divide-slate-200">
              {clients.map((client) => (
                <article
                  className="grid gap-3 px-4 py-4 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr_120px] lg:items-center lg:gap-4 lg:px-5"
                  key={client.id}
                >
                  <div className="min-w-0">
                    <Link
                      className="truncate text-base font-semibold text-slate-950 hover:text-blue-700"
                      href={`/dashboard/clients/${client.id}`}
                    >
                      {client.name}
                    </Link>
                    <p className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                      {client.type}
                    </p>
                  </div>
                  <div className="min-w-0 text-sm text-slate-600">
                    <p className="truncate">{client.email || "No email"}</p>
                    <p className="truncate">{client.phone || "No phone"}</p>
                  </div>
                  <p className="truncate text-sm text-slate-700">
                    {client.companyName || "Not set"}
                  </p>
                  <div className="min-w-0 text-sm text-slate-600">
                    {client.sourceSubmission ? (
                      <Link
                        className="inline-flex items-center gap-2 text-blue-700 hover:text-blue-800"
                        href={`/dashboard/forms/${client.sourceSubmission.formId}/submissions/${client.sourceSubmission.id}`}
                      >
                        <BriefcaseBusiness className="h-4 w-4" />
                        <span className="truncate">
                          {client.sourceSubmission.form.title}
                        </span>
                      </Link>
                    ) : (
                      "Manual client"
                    )}
                    <p className="mt-0.5 text-xs text-slate-500">
                      Created {formatDate(client.createdAt)}
                    </p>
                  </div>
                  <Link
                    className="inline-flex w-fit rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                    href={`/dashboard/clients/${client.id}`}
                  >
                    View
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
