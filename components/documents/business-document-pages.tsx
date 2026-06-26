import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Download,
  FileSignature,
  FileText,
  LockKeyhole,
  Plus,
  UserRound,
} from "lucide-react";
import { createBusinessDocumentAction } from "@/lib/documents/actions";
import {
  BUSINESS_DOCUMENT_TEMPLATES,
  documentBasePath,
  documentTypeLabel,
  documentTypePluralLabel,
  getDocumentTemplate,
  type BusinessDocumentType,
} from "@/lib/documents/templates";
import { getUserEffectiveLimits, limitLabel } from "@/lib/plans/limits";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMember } from "@/lib/workspaces/access";

type DocumentSearchParams = {
  error?: string;
  success?: string;
  clientId?: string;
  sourceSubmissionId?: string;
  template?: string;
};

function formatDate(date: Date | null | undefined) {
  if (!date) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
  }).format(date);
}

function formatAmount(value: unknown, currency: string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "Not set";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return String(value);
  }

  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: currency || "AUD",
  }).format(amount);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function snapshotValue(snapshot: unknown, key: string) {
  return isRecord(snapshot) ? String(snapshot[key] ?? "") : "";
}

function statusBadgeClass(status: string) {
  if (status === "COMPLETED" || status === "SIGNED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "VOID") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (status === "SENT") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function inputClass() {
  return "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
}

function labelClass() {
  return "grid gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500";
}

function Message({ error, success }: { error?: string; success?: string }) {
  if (success) {
    return (
      <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        {success}
      </p>
    );
  }

  if (error) {
    return (
      <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {error}
      </p>
    );
  }

  return null;
}

function LockedState({ type }: { type: BusinessDocumentType }) {
  return (
    <main className="min-h-screen px-4 py-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-4xl rounded-3xl border border-blue-100 bg-blue-50 p-6">
        <h1 className="text-2xl font-semibold text-slate-950">
          {documentTypePluralLabel(type)} are not included in your current plan.
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          Upgrade to create client-ready {documentTypePluralLabel(type).toLowerCase()}
          from your FormOS workspace.
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

function canUseType(
  type: BusinessDocumentType,
  limits: { allowContracts: boolean; allowAgreements: boolean },
) {
  return type === "CONTRACT" ? limits.allowContracts : limits.allowAgreements;
}

export async function BusinessDocumentListPage({
  type,
  searchParams,
}: {
  type: BusinessDocumentType;
  searchParams: DocumentSearchParams;
}) {
  const context = await requireWorkspaceMember();
  const limits = await getUserEffectiveLimits(context.ownerId);
  const basePath = documentBasePath(type);

  if (!canUseType(type, limits)) {
    return <LockedState type={type} />;
  }

  const documents = await prisma.businessDocument.findMany({
    where: {
      ownerId: context.ownerId,
      type,
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      title: true,
      status: true,
      type: true,
      documentNumber: true,
      clientSnapshot: true,
      createdAt: true,
      updatedAt: true,
      client: {
        select: {
          name: true,
          email: true,
          companyName: true,
        },
      },
    },
  });

  return (
    <main className="min-h-screen px-4 py-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-700">
                Documents
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                {documentTypePluralLabel(type)}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Create client-ready {documentTypePluralLabel(type).toLowerCase()}
                from saved clients and completed workflow context.
              </p>
            </div>
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              href={`${basePath}/new`}
            >
              <Plus className="h-4 w-4" />
              New {documentTypeLabel(type)}
            </Link>
          </div>
        </header>

        <Message error={searchParams.error} success={searchParams.success} />

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-950">
              {documents.length} {documents.length === 1 ? "document" : "documents"}
            </h2>
            <p className="text-xs text-slate-500">
              Monthly limit: {limitLabel(limits.maxDocumentsPerMonth)}
            </p>
          </div>

          {documents.length === 0 ? (
            <div className="grid place-items-center px-5 py-14 text-center">
              <FileSignature className="h-10 w-10 text-blue-600" />
              <h3 className="mt-4 text-lg font-semibold text-slate-950">
                No {documentTypePluralLabel(type).toLowerCase()} yet
              </h3>
              <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">
                Start from a client and create a draft {documentTypeLabel(type).toLowerCase()}
                with scope, terms, and payment details.
              </p>
              <Link
                className="mt-5 inline-flex rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
                href={`${basePath}/new`}
              >
                Create {documentTypeLabel(type)}
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {documents.map((document) => {
                const clientName =
                  document.client?.companyName ||
                  document.client?.name ||
                  snapshotValue(document.clientSnapshot, "companyName") ||
                  snapshotValue(document.clientSnapshot, "name") ||
                  snapshotValue(document.clientSnapshot, "email") ||
                  "No client";

                return (
                  <article
                    className="grid gap-4 px-5 py-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto] lg:items-center"
                    key={document.id}
                  >
                    <div className="min-w-0">
                      <Link
                        className="text-base font-semibold text-slate-950 hover:text-blue-700"
                        href={`${basePath}/${document.id}`}
                      >
                        {document.title}
                      </Link>
                      <p className="mt-1 text-xs text-slate-500">
                        {document.documentNumber || document.id}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                      <UserRound className="h-4 w-4 text-blue-600" />
                      <span>{clientName}</span>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusBadgeClass(
                          document.status,
                        )}`}
                      >
                        {document.status}
                      </span>
                      <span>Updated {formatDate(document.updatedAt)}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                        href={`${basePath}/${document.id}`}
                      >
                        View / Edit
                      </Link>
                      {limits.allowPdfGeneration ? (
                        <Link
                          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                          href={`${basePath}/${document.id}/pdf`}
                        >
                          <Download className="h-4 w-4" />
                          PDF
                        </Link>
                      ) : (
                        <Link
                          className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
                          href="/dashboard/settings/billing"
                        >
                          <LockKeyhole className="h-4 w-4" />
                          Upgrade for PDF
                        </Link>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export async function NewBusinessDocumentPage({
  type,
  searchParams,
}: {
  type: BusinessDocumentType;
  searchParams: DocumentSearchParams;
}) {
  const context = await requireWorkspaceMember();
  const limits = await getUserEffectiveLimits(context.ownerId);
  const basePath = documentBasePath(type);

  if (!canUseType(type, limits)) {
    return <LockedState type={type} />;
  }

  const template = getDocumentTemplate(searchParams.template);
  const [clients, selectedClient, sourceSubmission] = await Promise.all([
    prisma.client.findMany({
      where: { ownerId: context.ownerId },
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        companyName: true,
        abnOrBusinessId: true,
        address: true,
      },
    }),
    searchParams.clientId
      ? prisma.client.findFirst({
          where: {
            id: searchParams.clientId,
            ownerId: context.ownerId,
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            companyName: true,
            abnOrBusinessId: true,
            address: true,
          },
        })
      : Promise.resolve(null),
    searchParams.sourceSubmissionId
      ? prisma.formSubmission.findFirst({
          where: {
            id: searchParams.sourceSubmissionId,
            ownerId: context.ownerId,
          },
          select: {
            id: true,
            form: {
              select: {
                title: true,
              },
            },
          },
        })
      : Promise.resolve(null),
  ]);

  return (
    <main className="min-h-screen px-4 py-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700"
            href={basePath}
          >
            <ArrowLeft className="h-4 w-4" />
            {documentTypePluralLabel(type)}
          </Link>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-700">
                New {documentTypeLabel(type)}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                Create {documentTypeLabel(type)}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Select a client, define the scope, and save a draft document.
              </p>
            </div>
          </div>
        </header>

        <Message error={searchParams.error} success={searchParams.success} />

        {limits.allowDocumentTemplates ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-950">
                  Starter templates
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Templates are starting points only and should be reviewed before use.
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {BUSINESS_DOCUMENT_TEMPLATES.filter(
                (documentTemplate) => documentTemplate.type === type,
              ).map((documentTemplate) => (
                <Link
                  className={`rounded-2xl border p-4 transition hover:border-blue-200 hover:bg-blue-50 ${
                    template?.id === documentTemplate.id
                      ? "border-blue-300 bg-blue-50"
                      : "border-slate-200 bg-slate-50"
                  }`}
                  href={`${basePath}/new?template=${documentTemplate.id}${
                    searchParams.clientId ? `&clientId=${searchParams.clientId}` : ""
                  }${
                    searchParams.sourceSubmissionId
                      ? `&sourceSubmissionId=${searchParams.sourceSubmissionId}`
                      : ""
                  }`}
                  key={documentTemplate.id}
                >
                  <p className="text-sm font-semibold text-slate-950">
                    {documentTemplate.title}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {documentTemplate.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <form
          action={createBusinessDocumentAction}
          className="grid gap-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <input name="type" type="hidden" value={type} />
          <input name="sourceSubmissionId" type="hidden" value={sourceSubmission?.id ?? ""} />
          <input name="templateId" type="hidden" value={template?.id ?? ""} />

          {sourceSubmission ? (
            <p className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              Source submission: {sourceSubmission.form.title}
            </p>
          ) : null}

          <section className="grid gap-4">
            <div className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-blue-600" />
              <h2 className="text-base font-semibold text-slate-950">Client</h2>
            </div>
            <label className={labelClass()}>
              Select client
              <select className={inputClass()} defaultValue={selectedClient?.id ?? ""} name="clientId">
                <option value="">No linked client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.companyName || client.name} {client.email ? `(${client.email})` : ""}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className={labelClass()}>
                Client name
                <input
                  className={inputClass()}
                  defaultValue={selectedClient?.name ?? ""}
                  name="clientName"
                />
              </label>
              <label className={labelClass()}>
                Client email
                <input
                  className={inputClass()}
                  defaultValue={selectedClient?.email ?? ""}
                  name="clientEmail"
                  type="email"
                />
              </label>
              <label className={labelClass()}>
                Phone
                <input
                  className={inputClass()}
                  defaultValue={selectedClient?.phone ?? ""}
                  name="clientPhone"
                />
              </label>
              <label className={labelClass()}>
                Company
                <input
                  className={inputClass()}
                  defaultValue={selectedClient?.companyName ?? ""}
                  name="clientCompanyName"
                />
              </label>
              <label className={labelClass()}>
                ABN / Business ID
                <input
                  className={inputClass()}
                  defaultValue={selectedClient?.abnOrBusinessId ?? ""}
                  name="clientAbnOrBusinessId"
                />
              </label>
              <label className={`${labelClass()} md:col-span-2`}>
                Address
                <textarea
                  className={`${inputClass()} min-h-20`}
                  defaultValue={selectedClient?.address ?? ""}
                  name="clientAddress"
                />
              </label>
            </div>
          </section>

          <section className="grid gap-4">
            <div className="flex items-center gap-2">
              <BriefcaseBusiness className="h-4 w-4 text-blue-600" />
              <h2 className="text-base font-semibold text-slate-950">Document details</h2>
            </div>
            <label className={labelClass()}>
              Title
              <input
                className={inputClass()}
                defaultValue={template?.title ?? ""}
                name="title"
                required
              />
            </label>
            <label className={labelClass()}>
              Work scope
              <textarea
                className={`${inputClass()} min-h-36`}
                defaultValue={template?.scopeOfWork ?? ""}
                name="scopeOfWork"
                required
              />
            </label>
            <label className={labelClass()}>
              Terms
              <textarea
                className={`${inputClass()} min-h-44`}
                defaultValue={template?.terms ?? ""}
                name="terms"
                required
              />
            </label>
            <label className={labelClass()}>
              Payment terms
              <textarea
                className={`${inputClass()} min-h-28`}
                defaultValue={template?.paymentTerms ?? ""}
                name="paymentTerms"
              />
            </label>
            <div className="grid gap-3 md:grid-cols-4">
              <label className={labelClass()}>
                Amount
                <input className={inputClass()} min={0} name="totalAmount" step="0.01" type="number" />
              </label>
              <label className={labelClass()}>
                Currency
                <input className={inputClass()} defaultValue="AUD" name="currency" />
              </label>
              <label className={labelClass()}>
                Start date
                <input className={inputClass()} name="startDate" type="date" />
              </label>
              <label className={labelClass()}>
                End date
                <input className={inputClass()} name="endDate" type="date" />
              </label>
            </div>
          </section>

          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            type="submit"
          >
            <FileSignature className="h-4 w-4" />
            Save draft {documentTypeLabel(type).toLowerCase()}
          </button>
        </form>
      </div>
    </main>
  );
}

export async function BusinessDocumentDetailPage({
  type,
  documentId,
  searchParams,
}: {
  type: BusinessDocumentType;
  documentId: string;
  searchParams: DocumentSearchParams;
}) {
  const context = await requireWorkspaceMember();
  const limits = await getUserEffectiveLimits(context.ownerId);
  const basePath = documentBasePath(type);

  if (!canUseType(type, limits)) {
    return <LockedState type={type} />;
  }

  const document = await prisma.businessDocument.findFirst({
    where: {
      id: documentId,
      ownerId: context.ownerId,
      type,
    },
    select: {
      id: true,
      title: true,
      type: true,
      status: true,
      documentNumber: true,
      clientSnapshot: true,
      ownerSnapshot: true,
      scopeOfWork: true,
      terms: true,
      paymentTerms: true,
      startDate: true,
      endDate: true,
      totalAmount: true,
      currency: true,
      createdAt: true,
      updatedAt: true,
      completedAt: true,
      client: {
        select: {
          id: true,
          name: true,
        },
      },
      sourceSubmission: {
        select: {
          id: true,
          formId: true,
          form: {
            select: {
              title: true,
            },
          },
        },
      },
    },
  });

  if (!document) {
    notFound();
  }

  return (
    <main className="min-h-screen px-4 py-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700"
            href={basePath}
          >
            <ArrowLeft className="h-4 w-4" />
            {documentTypePluralLabel(type)}
          </Link>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                  {document.title}
                </h1>
                <span
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusBadgeClass(
                    document.status,
                  )}`}
                >
                  {document.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {document.documentNumber || document.id} - Updated{" "}
                {formatDate(document.updatedAt)}
              </p>
            </div>
            {limits.allowPdfGeneration ? (
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                href={`${basePath}/${document.id}/pdf`}
              >
                <Download className="h-4 w-4" />
                Generate / Download PDF
              </Link>
            ) : (
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 shadow-sm transition hover:bg-amber-100"
                href="/dashboard/settings/billing"
              >
                <LockKeyhole className="h-4 w-4" />
                Upgrade for PDF
              </Link>
            )}
          </div>
        </header>

        <Message error={searchParams.error} success={searchParams.success} />

        {!limits.allowPdfGeneration ? (
          <p className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
            PDF generation is not included in the owner's current plan. Upgrade to
            generate branded {documentTypeLabel(type).toLowerCase()} PDFs.
          </p>
        ) : null}

        <p className="rounded-3xl border border-slate-200 bg-white px-5 py-4 text-xs leading-5 text-slate-500 shadow-sm">
          Templates and generated documents are starting points and should be reviewed
          before use. FormOS does not provide legal advice.
        </p>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid gap-5">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <h2 className="text-base font-semibold text-slate-950">Scope of work</h2>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {document.scopeOfWork}
              </p>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <FileSignature className="h-4 w-4 text-blue-600" />
                <h2 className="text-base font-semibold text-slate-950">Terms</h2>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {document.terms}
              </p>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <BriefcaseBusiness className="h-4 w-4 text-blue-600" />
                <h2 className="text-base font-semibold text-slate-950">Payment terms</h2>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {document.paymentTerms || "Not set"}
              </p>
            </section>
          </div>

          <aside className="grid gap-5 lg:self-start">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-blue-600" />
                <h2 className="text-base font-semibold text-slate-950">Client snapshot</h2>
              </div>
              <dl className="mt-4 grid gap-3 text-sm">
                {["name", "companyName", "email", "phone", "abnOrBusinessId", "address"].map(
                  (key) => (
                    <div key={key}>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (char) => char.toUpperCase())}
                      </dt>
                      <dd className="mt-1 whitespace-pre-wrap font-medium text-slate-950">
                        {snapshotValue(document.clientSnapshot, key) || "Not set"}
                      </dd>
                    </div>
                  ),
                )}
              </dl>
              {document.client ? (
                <Link
                  className="mt-4 inline-flex rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800"
                  href={`/dashboard/clients/${document.client.id}`}
                >
                  View client
                </Link>
              ) : null}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-blue-600" />
                <h2 className="text-base font-semibold text-slate-950">Summary</h2>
              </div>
              <dl className="mt-4 grid gap-3 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Amount
                  </dt>
                  <dd className="mt-1 font-medium text-slate-950">
                    {formatAmount(document.totalAmount, document.currency)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Dates
                  </dt>
                  <dd className="mt-1 font-medium text-slate-950">
                    {formatDate(document.startDate)} - {formatDate(document.endDate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Future sending/signing
                  </dt>
                  <dd className="mt-1 text-slate-600">
                    Sending and external signing are planned future steps. For now,
                    generate the PDF and manage signatures manually.
                  </dd>
                </div>
              </dl>
              {document.sourceSubmission ? (
                <Link
                  className="mt-4 inline-flex rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800"
                  href={`/dashboard/forms/${document.sourceSubmission.formId}/submissions/${document.sourceSubmission.id}`}
                >
                  View source submission
                </Link>
              ) : null}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
