import Link from "next/link";
import { ArrowLeft, BriefcaseBusiness, FileText, UserRound } from "lucide-react";
import { notFound } from "next/navigation";
import { getUserEffectiveLimits } from "@/lib/plans/limits";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMember } from "@/lib/workspaces/access";

type ClientDetailPageProps = {
  params: Promise<{
    clientId: string;
  }>;
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 whitespace-pre-wrap text-sm font-semibold text-slate-950">
        {value || "Not set"}
      </p>
    </div>
  );
}

export default async function ClientDetailPage({
  params,
  searchParams,
}: ClientDetailPageProps) {
  const context = await requireWorkspaceMember();
  const { clientId } = await params;
  const { error, success } = await searchParams;
  const limits = await getUserEffectiveLimits(context.ownerId);

  if (!limits.allowClients) {
    return (
      <main className="min-h-screen px-4 py-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-blue-100 bg-blue-50 p-6">
          <h1 className="text-2xl font-semibold text-slate-950">
            Clients are not included in your current plan.
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Upgrade to access client records for your workspace.
          </p>
          <Link
            className="mt-4 inline-flex rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
            href="/dashboard/settings/billing"
          >
            View plans
          </Link>
        </div>
      </main>
    );
  }

  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      ownerId: context.ownerId,
    },
    select: {
      id: true,
      type: true,
      name: true,
      email: true,
      phone: true,
      companyName: true,
      abnOrBusinessId: true,
      address: true,
      notes: true,
      metadata: true,
      createdAt: true,
      updatedAt: true,
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
      businessDocuments: {
        orderBy: {
          updatedAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          type: true,
          title: true,
          status: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!client) {
    notFound();
  }

  return (
    <main className="min-h-screen px-4 py-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800"
            href="/dashboard/clients"
          >
            <ArrowLeft className="h-4 w-4" />
            Clients
          </Link>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                  {client.name}
                </h1>
                <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700">
                  {client.type}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Created {formatDateTime(client.createdAt)}
              </p>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <UserRound className="h-6 w-6" />
            </span>
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

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-blue-600" />
              <h2 className="text-base font-semibold text-slate-950">Client details</h2>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <DetailRow label="Email" value={client.email} />
              <DetailRow label="Phone" value={client.phone} />
              <DetailRow label="Company" value={client.companyName} />
              <DetailRow label="ABN / Business ID" value={client.abnOrBusinessId} />
              <div className="sm:col-span-2">
                <DetailRow label="Address" value={client.address} />
              </div>
              <div className="sm:col-span-2">
                <DetailRow label="Notes" value={client.notes} />
              </div>
            </div>
          </section>

          <aside className="flex flex-col gap-5">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <h2 className="text-base font-semibold text-slate-950">
                  Source submission
                </h2>
              </div>
              {client.sourceSubmission ? (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-950">
                    {client.sourceSubmission.form.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Submitted {formatDateTime(client.sourceSubmission.createdAt)}
                  </p>
                  <Link
                    className="mt-3 inline-flex rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                    href={`/dashboard/forms/${client.sourceSubmission.formId}/submissions/${client.sourceSubmission.id}`}
                  >
                    View submission
                  </Link>
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  This client was created manually.
                </p>
              )}
            </section>

            <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <BriefcaseBusiness className="h-4 w-4 text-blue-600" />
                <h2 className="text-base font-semibold text-slate-950">
                  Contracts & Agreements
                </h2>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  className="inline-flex rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                  href={`/dashboard/contracts/new?clientId=${client.id}`}
                >
                  New Contract
                </Link>
                <Link
                  className="inline-flex rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                  href={`/dashboard/agreements/new?clientId=${client.id}`}
                >
                  New Agreement
                </Link>
              </div>
              {client.businessDocuments.length > 0 ? (
                <div className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-slate-50">
                  {client.businessDocuments.map((document) => (
                    <Link
                      className="block px-4 py-3 transition hover:bg-white"
                      href={`/dashboard/${
                        document.type === "CONTRACT" ? "contracts" : "agreements"
                      }/${document.id}`}
                      key={document.id}
                    >
                      <p className="text-sm font-semibold text-slate-950">
                        {document.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {document.type} - {document.status} - Updated{" "}
                        {formatDateTime(document.updatedAt)}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  Create a contract or agreement for this client.
                </p>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
