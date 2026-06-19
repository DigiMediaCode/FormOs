import Link from "next/link";
import { notFound } from "next/navigation";
import {
  deleteSubscriptionPlan,
  syncPlanToStripeAction,
  toggleSubscriptionPlanStatus,
  updatePlanAction,
} from "@/app/admin/plans/actions";
import { PlanForm } from "@/app/admin/plans/plan-form";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Power, RefreshCw, Trash2 } from "lucide-react";

type EditPlanPageProps = {
  params: Promise<{
    planId: string;
  }>;
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function EditPlanPage({
  params,
  searchParams,
}: EditPlanPageProps) {
  await requireSuperAdmin();
  const { planId } = await params;
  const { error, success } = await searchParams;
  const plan = await prisma.subscriptionPlan.findUnique({
    where: {
      id: planId,
    },
    include: {
      _count: {
        select: {
          subscriptions: true,
        },
      },
    },
  });

  if (!plan) {
    notFound();
  }

  const editPath = `/admin/plans/${plan.id}`;

  return (
    <main className="px-4 py-6 lg:px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Super Admin / Plans / Edit Plan
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950">
              Edit {plan.name}
            </h1>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Update plan pricing, features, limits, and Stripe sync settings.
            </p>
          </div>
          <Link
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
            href="/admin/plans"
          >
            <ArrowLeft className="size-4" />
            Back to Plans
          </Link>
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

        <section className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <form action={syncPlanToStripeAction.bind(null, plan.id, editPath)}>
            <SubmitButton
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              pendingText="Syncing..."
              showStatus={false}
            >
              <RefreshCw className="size-4" />
              Sync to Stripe
            </SubmitButton>
          </form>
          <form action={toggleSubscriptionPlanStatus.bind(null, plan.id, editPath)}>
            <SubmitButton
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
              pendingText={plan.isActive ? "Deactivating..." : "Activating..."}
              showStatus={false}
            >
              <Power className="size-4" />
              {plan.isActive ? "Deactivate" : "Activate"}
            </SubmitButton>
          </form>
          <form action={deleteSubscriptionPlan.bind(null, plan.id, editPath)}>
            <ConfirmSubmitButton
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              confirmMessage="Are you sure you want to delete this plan? This cannot be undone."
              disabled={plan._count.subscriptions > 0}
              pendingText="Deleting..."
            >
              <Trash2 className="size-4" />
              Delete
            </ConfirmSubmitButton>
          </form>
          {plan._count.subscriptions > 0 ? (
            <p className="text-xs text-slate-500">
              This plan is assigned to {plan._count.subscriptions} user
              {plan._count.subscriptions === 1 ? "" : "s"} and cannot be deleted.
            </p>
          ) : null}
        </section>

        <PlanForm
          action={updatePlanAction.bind(null, plan.id)}
          defaults={plan}
          redirectTo={editPath}
          submitLabel="Save Plan"
        />
      </div>
    </main>
  );
}
