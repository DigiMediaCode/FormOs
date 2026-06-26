import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, FileSignature } from "lucide-react";
import { SignaturePadField } from "@/components/forms/signature-pad-field";
import { signBusinessDocumentAsClientAction } from "@/lib/documents/signing-actions";
import {
  hashDocumentSigningToken,
  snapshotDisplayName,
  snapshotEmail,
  snapshotString,
} from "@/lib/documents/signing";
import { prisma } from "@/lib/prisma";

type SignDocumentPageProps = {
  params: Promise<{
    token: string;
  }>;
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
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

export default async function SignDocumentPage({
  params,
  searchParams,
}: SignDocumentPageProps) {
  const { token } = await params;
  const messages = await searchParams;

  if (!token || token.length < 20) {
    notFound();
  }

  const document = await prisma.businessDocument.findUnique({
    where: {
      signingTokenHash: hashDocumentSigningToken(token),
    },
    select: {
      id: true,
      type: true,
      title: true,
      documentNumber: true,
      status: true,
      clientSnapshot: true,
      ownerSnapshot: true,
      scopeOfWork: true,
      terms: true,
      paymentTerms: true,
      startDate: true,
      endDate: true,
      totalAmount: true,
      currency: true,
      sentForSigningAt: true,
      signingTokenExpiresAt: true,
      clientSignedAt: true,
      ownerSignedAt: true,
      completedAt: true,
    },
  });

  if (!document) {
    notFound();
  }

  const expired =
    document.signingTokenExpiresAt !== null &&
    document.signingTokenExpiresAt.getTime() < Date.now();
  const clientName = snapshotDisplayName(document.clientSnapshot);
  const ownerName =
    snapshotString(document.ownerSnapshot, "companyName") ||
    snapshotDisplayName(document.ownerSnapshot, "Business");
  const clientEmail = snapshotEmail(document.clientSnapshot);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:py-10">
      <div className="mx-auto grid max-w-5xl gap-5">
        <Link
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-blue-700"
          href="/"
        >
          <ArrowLeft className="h-4 w-4" />
          FormOS
        </Link>

        <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-700">
                Signature request
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                {document.title}
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Sent by {ownerName}. Document {document.documentNumber || document.id}.
              </p>
            </div>
            <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
              {document.type.toLowerCase()}
            </span>
          </div>
        </header>

        <Message error={messages.error} success={messages.success} />

        {expired ? (
          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
            <h2 className="text-xl font-semibold">This signing link has expired.</h2>
            <p className="mt-2 text-sm leading-6">
              Please contact {ownerName} and ask them to send a new signing link.
            </p>
          </section>
        ) : document.clientSignedAt ? (
          <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6" />
              <h2 className="text-xl font-semibold">Signature received</h2>
            </div>
            <p className="mt-2 text-sm leading-6">
              Thank you. Your signature was saved on {formatDate(document.clientSignedAt)}.
              The final PDF will be emailed to both parties once all required signatures are
              complete.
            </p>
          </section>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="grid gap-5">
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-semibold">Scope</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {document.scopeOfWork}
                </p>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-semibold">Terms & Conditions</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {document.terms}
                </p>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-semibold">Payment terms</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {document.paymentTerms || "Not set"}
                </p>
              </section>
            </div>

            <aside className="grid gap-5 lg:self-start">
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-semibold">Document details</h2>
                <dl className="mt-4 grid gap-3 text-sm">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Client
                    </dt>
                    <dd className="mt-1 font-medium">{clientName}</dd>
                    {clientEmail ? <dd className="text-slate-600">{clientEmail}</dd> : null}
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Dates
                    </dt>
                    <dd className="mt-1 font-medium">
                      {formatDate(document.startDate)} - {formatDate(document.endDate)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Amount
                    </dt>
                    <dd className="mt-1 font-medium">
                      {formatAmount(document.totalAmount, document.currency)}
                    </dd>
                  </div>
                </dl>
              </section>

              <form
                action={signBusinessDocumentAsClientAction}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <input name="token" type="hidden" value={token} />
                <div className="flex items-center gap-2">
                  <FileSignature className="h-4 w-4 text-blue-600" />
                  <h2 className="text-base font-semibold">Sign document</h2>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Draw your signature below. Once both parties sign, FormOS will send the
                  completed PDF to both email addresses.
                </p>
                <div className="mt-4">
                  <SignaturePadField
                    fieldId="clientSignature"
                    label="Your signature"
                    required
                    variant="signature"
                  />
                </div>
                <button
                  className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                  type="submit"
                >
                  Submit signature
                </button>
              </form>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
