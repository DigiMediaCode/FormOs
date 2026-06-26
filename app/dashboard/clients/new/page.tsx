import Link from "next/link";
import { ArrowLeft, UserRound } from "lucide-react";
import { SubmitButton } from "@/components/ui/submit-button";
import { createManualClientAction } from "@/lib/clients/actions";
import { getUserEffectiveLimits } from "@/lib/plans/limits";
import { requireWorkspaceMember } from "@/lib/workspaces/access";

type NewClientPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

function inputClass() {
  return "w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
}

function labelClass() {
  return "grid gap-1.5 text-sm font-semibold text-slate-700";
}

export default async function NewClientPage({ searchParams }: NewClientPageProps) {
  const context = await requireWorkspaceMember();
  const { error } = await searchParams;
  const limits = await getUserEffectiveLimits(context.ownerId);

  if (!limits.allowClients) {
    return (
      <main className="min-h-screen px-4 py-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-blue-100 bg-blue-50 p-6">
          <h1 className="text-2xl font-semibold text-slate-950">
            Clients are available on Pro and Business plans.
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Upgrade your plan to create and manage reusable client records.
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

  return (
    <main className="min-h-screen px-4 py-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-5">
        <header className="flex items-start justify-between gap-3">
          <div>
            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800"
              href="/dashboard/clients"
            >
              <ArrowLeft className="h-4 w-4" />
              Clients
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Create Client
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Add a person or business client manually.
            </p>
          </div>
          <span className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 sm:flex">
            <UserRound className="h-6 w-6" />
          </span>
        </header>

        {error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <form
          action={createManualClientAction}
          className="grid gap-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass()}>
              Client type
              <select className={inputClass()} name="type" defaultValue="PERSON">
                <option value="PERSON">Person</option>
                <option value="BUSINESS">Business</option>
              </select>
            </label>
            <label className={labelClass()}>
              Name
              <input className={inputClass()} name="name" placeholder="Jane Cooper" />
            </label>
            <label className={labelClass()}>
              Email
              <input
                className={inputClass()}
                name="email"
                placeholder="jane@example.com"
                type="email"
              />
            </label>
            <label className={labelClass()}>
              Phone
              <input className={inputClass()} name="phone" placeholder="+61..." />
            </label>
            <label className={labelClass()}>
              Company name
              <input className={inputClass()} name="companyName" placeholder="ACME Pty Ltd" />
            </label>
            <label className={labelClass()}>
              ABN / Business ID
              <input className={inputClass()} name="abnOrBusinessId" />
            </label>
            <label className={`${labelClass()} sm:col-span-2`}>
              Address
              <textarea className={`${inputClass()} min-h-24`} name="address" />
            </label>
            <label className={`${labelClass()} sm:col-span-2`}>
              Notes
              <textarea className={`${inputClass()} min-h-28`} name="notes" />
            </label>
          </div>
          <SubmitButton
            className="w-fit rounded-2xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            pendingText="Creating client..."
          >
            Create Client
          </SubmitButton>
        </form>
      </div>
    </main>
  );
}
