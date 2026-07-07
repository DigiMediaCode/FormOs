import Link from "next/link";
import { CircleAlert, ShieldCheck, UserPlus } from "lucide-react";
import { signupAction } from "@/app/(auth)/actions";
import { OAuthLoginButtons } from "@/components/ui/oauth-login-buttons";
import { PlatformBrand } from "@/components/ui/platform-brand";
import { PendingLink } from "@/components/ui/pending-link";
import { SubmitButton } from "@/components/ui/submit-button";
import { getPlatformSettings } from "@/lib/platform/settings";

type SignupPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
    template?: string;
    plan?: string;
    checkout_cancelled?: string;
  }>;
};

function safeTemplateParam(value: string | undefined) {
  return value && /^[a-z0-9-]+$/.test(value) ? value : "";
}

function safePlanParam(value: string | undefined) {
  return value && /^[a-z0-9-]+$/.test(value) ? value.toLowerCase() : "";
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { error, success, template, plan, checkout_cancelled } = await searchParams;
  const templateParam = safeTemplateParam(template);
  const planParam = safePlanParam(plan);
  const isFreeSignup = !planParam || planParam === "free";
  const paidPlanParam = planParam && planParam !== "free" ? planParam : "";
  const contextQuery = new URLSearchParams();

  if (templateParam) {
    contextQuery.set("template", templateParam);
  }

  if (planParam === "free") {
    contextQuery.set("plan", "free");
  }

  const contextQueryString = contextQuery.toString();
  const contextSuffix = contextQueryString ? `?${contextQueryString}` : "";
  const settings = await getPlatformSettings();

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 font-sans text-zinc-950">
      <section className="mx-auto flex w-full max-w-md flex-col items-center">
        <PlatformBrand
          href="/"
          className="flex items-center justify-center"
          imageClassName="h-auto max-w-[160px] object-contain"
          textClassName="text-2xl font-bold tracking-tight text-zinc-950"
        />
        <p className="mt-3 text-sm leading-5 text-zinc-500">
          {isFreeSignup ? "Create your free account" : "Start your paid trial with Stripe first"}
        </p>

        <div className="mt-10 w-full rounded-2xl bg-white p-8 shadow-lg shadow-blue-950/5">
          <header>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-950">
              Get started
            </h1>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Build forms and agreements in minutes with {settings.siteName}.
            </p>
          </header>

          {error ? (
            <div className="mt-6 flex gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="text-sm font-semibold">Signup failed</p>
                <p className="mt-0.5 text-xs leading-5">{error}</p>
              </div>
            </div>
          ) : null}

          {checkout_cancelled ? (
            <div className="mt-6 flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-800">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="text-sm font-semibold">Checkout was cancelled</p>
                <p className="mt-0.5 text-xs leading-5">
                  You can still start with the Free plan.
                </p>
              </div>
            </div>
          ) : null}

          {success ? (
            <div className="mt-6 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm leading-5 text-emerald-800">
              {success}
            </div>
          ) : null}

          {paidPlanParam ? (
            <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
              Paid trials start in Stripe so your payment method can be
              authorized for billing after the trial.
              <PendingLink
                className="mt-3 inline-flex rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                href={`/api/billing/public-checkout?plan=${encodeURIComponent(paidPlanParam)}&interval=monthly&source=signup_context${
                  templateParam ? `&template=${encodeURIComponent(templateParam)}` : ""
                }`}
                pendingText="Opening Stripe..."
              >
                Continue to Stripe Checkout
              </PendingLink>
            </div>
          ) : null}

          <OAuthLoginButtons contextSuffix={contextSuffix} />

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-200" />
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              or create with email
            </span>
            <div className="h-px flex-1 bg-zinc-200" />
          </div>

          <form action={signupAction} className="grid gap-4">
            {templateParam ? (
              <input name="template" type="hidden" value={templateParam} />
            ) : null}
            {planParam === "free" ? (
              <input name="plan" type="hidden" value="free" />
            ) : null}
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid min-w-0 gap-2 text-sm font-medium text-zinc-950">
                First Name
                <input
                  className="min-w-0 rounded-lg border border-zinc-100 bg-white px-4 py-3 text-base text-zinc-950 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  name="firstName"
                  placeholder="Jane"
                  type="text"
                />
              </label>

              <label className="grid min-w-0 gap-2 text-sm font-medium text-zinc-950">
                Last Name
                <input
                  className="min-w-0 rounded-lg border border-zinc-100 bg-white px-4 py-3 text-base text-zinc-950 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  name="lastName"
                  placeholder="Cooper"
                  type="text"
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm font-medium text-zinc-950">
              Email
              <input
                className="rounded-lg border border-zinc-100 bg-white px-4 py-3 text-base text-zinc-950 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                name="email"
                placeholder="you@company.com"
                required
                type="email"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-zinc-950">
              Password
              <input
                className="rounded-lg border border-zinc-100 bg-white px-4 py-3 text-base text-zinc-950 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                minLength={8}
                name="password"
                placeholder="Create a password"
                required
                type="password"
              />
            </label>

            <SubmitButton
              className="mt-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              pendingText="Creating your account..."
              showStatus={false}
            >
              <span className="flex items-center justify-center gap-2">
                <UserPlus className="h-4 w-4" />
                Create Account
              </span>
            </SubmitButton>
          </form>

          <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs leading-5 text-zinc-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            No credit card required. Free to get started.
          </p>

          <p className="mt-4 text-center text-sm leading-6 text-zinc-500">
            Already have an account?{" "}
            <Link
              className="font-semibold text-blue-600 hover:text-blue-700"
              href={`/login${contextSuffix}`}
            >
              Log in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
