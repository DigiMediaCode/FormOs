import Link from "next/link";
import { createPlanAction, seedDefaultPlansAction } from "@/app/admin/plans/actions";
import { PlanForm } from "@/app/admin/plans/plan-form";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { DEFAULT_PLAN_DEFINITIONS } from "@/lib/plans/limits";
import { ArrowLeft, Sparkles } from "lucide-react";

type NewPlanPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function NewPlanPage({ searchParams }: NewPlanPageProps) {
  await requireSuperAdmin();
  const { error, success } = await searchParams;
  const starterDefaults = DEFAULT_PLAN_DEFINITIONS[1];

  return (
    <main className="px-4 py-6 lg:px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Super Admin / Plans / Create a Plan
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950">
              Create Plan
            </h1>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Create a new plan for your users.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
              href="/admin/plans"
            >
              <ArrowLeft className="size-4" />
              Back to Plans
            </Link>
            <form action={seedDefaultPlansAction}>
              <SubmitButton
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
                pendingText="Checking..."
                showStatus={false}
              >
                <Sparkles className="size-4 text-blue-600" />
                Add Default Plans
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

        <PlanForm
          action={createPlanAction}
          defaults={{
            ...starterDefaults,
            description: starterDefaults.description,
            limits: starterDefaults.limits,
          }}
          submitLabel="Create Plan"
        />
      </div>
    </main>
  );
}
