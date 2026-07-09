import Link from "next/link";
import { redirect } from "next/navigation";
import { CircleAlert, CircleCheck } from "lucide-react";
import { completePublicTrialCheckout } from "@/lib/billing/public-trial-onboarding";
import { getSessionUserId } from "@/lib/auth/session";
import { createTemplateFormForOwner } from "@/lib/forms/templates/apply-template";

type CheckoutSuccessPageProps = {
  searchParams: Promise<{
    session_id?: string;
  }>;
};

export default async function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessPageProps) {
  const { session_id: sessionId } = await searchParams;

  if (!sessionId) {
    return (
      <CheckoutMessage
        message="Stripe Checkout session is missing. Please start again from pricing."
        tone="error"
      />
    );
  }

  let result: Awaited<ReturnType<typeof completePublicTrialCheckout>>;

  try {
    const currentUserId = await getSessionUserId();
    result = await completePublicTrialCheckout({
      sessionId,
      currentUserId,
    });
  } catch (error) {
    return (
      <CheckoutMessage
        message={
          error instanceof Error
            ? error.message
            : "Unable to complete trial checkout. Please contact support."
        }
        tone="error"
      />
    );
  }

  if (result.status === "complete_signup") {
    redirect(
      `/signup/complete?token=${encodeURIComponent(result.rawToken)}&plan=${encodeURIComponent(result.planName)}`,
    );
  }

  if (result.status === "ready") {
    if (result.templateSlug) {
      const userId = await getSessionUserId();

      if (userId) {
        const applied = await createTemplateFormForOwner({
          ownerId: userId,
          templateSlug: result.templateSlug,
        });

        if (applied.ok) {
          redirect(
            `/dashboard/forms?success=${encodeURIComponent(`Your ${result.planName} trial is active and your template is ready in Drafts.`)}`,
          );
        }
      }
    }

    const params = new URLSearchParams({
      success: `Your ${result.planName} trial is active.`,
    });

    if (result.templateSlug) {
      params.set("template", result.templateSlug);
    }

    redirect(`/dashboard?${params.toString()}`);
  }

  if (result.status === "trial_ineligible") {
    redirect(
      `/login?error=${encodeURIComponent(
        "This email has already used a paid-plan trial or already has paid access. Please log in to manage billing.",
      )}`,
    );
  }

  redirect(
    `/login?success=${encodeURIComponent(
      `Your ${result.planName} trial is active. Please log in to continue.`,
    )}`,
  );
}

function CheckoutMessage({
  message,
  tone,
}: {
  message: string;
  tone: "success" | "error";
}) {
  const isError = tone === "error";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg shadow-blue-950/5">
        <div
          className={`inline-flex size-12 items-center justify-center rounded-2xl ${
            isError ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
          }`}
        >
          {isError ? (
            <CircleAlert className="h-6 w-6" />
          ) : (
            <CircleCheck className="h-6 w-6" />
          )}
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
          {isError ? "Checkout needs attention" : "Trial ready"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            href="/pricing"
          >
            Back to pricing
          </Link>
          <Link
            className="rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            href="/contact"
          >
            Contact support
          </Link>
        </div>
      </section>
    </main>
  );
}
