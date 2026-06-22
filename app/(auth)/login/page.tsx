import Link from "next/link";
import { CircleAlert, CircleCheck, LogIn } from "lucide-react";
import { loginAction } from "@/app/(auth)/actions";
import { GoogleLogo, LarkLogo } from "@/components/ui/oauth-provider-icons";
import { PlatformBrand } from "@/components/ui/platform-brand";
import { PendingLink } from "@/components/ui/pending-link";
import { SubmitButton } from "@/components/ui/submit-button";
import { getPlatformSettings } from "@/lib/platform/settings";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
    template?: string;
    plan?: string;
  }>;
};

function safeTemplateParam(value: string | undefined) {
  return value && /^[a-z0-9-]+$/.test(value) ? value : "";
}

function safePlanParam(value: string | undefined) {
  return value && /^[a-z0-9-]+$/.test(value) ? value.toLowerCase() : "";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, success, template, plan } = await searchParams;
  const templateParam = safeTemplateParam(template);
  const planParam = safePlanParam(plan);
  const paidTrialPlan = planParam && planParam !== "free" ? planParam : "";
  const contextQuery = new URLSearchParams();

  if (templateParam) {
    contextQuery.set("template", templateParam);
  }

  if (paidTrialPlan) {
    contextQuery.set("plan", paidTrialPlan);
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
          Sign in to your account
        </p>

        <div className="mt-10 w-full rounded-2xl bg-white p-8 shadow-lg shadow-blue-950/5">
          <header>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-950">
              Welcome back
            </h1>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Enter your credentials to continue to {settings.siteName}.
            </p>
          </header>

          {success ? (
            <div className="mt-6 flex gap-3 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-emerald-800">
              <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="text-sm font-semibold">Success</p>
                <p className="mt-0.5 text-xs leading-5">{success}</p>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="mt-6 flex gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="text-sm font-semibold">Login failed</p>
                <p className="mt-0.5 text-xs leading-5">{error}</p>
              </div>
            </div>
          ) : null}

          <div className="mt-6 grid gap-3">
            <PendingLink
              className="flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
              href={`/api/auth/google/login${contextSuffix}`}
              pendingText="Redirecting to Google..."
            >
              <GoogleLogo />
              Continue with Google
            </PendingLink>
            <PendingLink
              className="flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
              href={`/api/auth/lark/login${contextSuffix}`}
              pendingText="Redirecting to Lark..."
            >
              <LarkLogo />
              Continue with Lark
            </PendingLink>
          </div>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-200" />
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              or
            </span>
            <div className="h-px flex-1 bg-zinc-200" />
          </div>

          <form action={loginAction} className="grid gap-4">
            {templateParam ? (
              <input name="template" type="hidden" value={templateParam} />
            ) : null}
            {paidTrialPlan ? (
              <input name="plan" type="hidden" value={paidTrialPlan} />
            ) : null}
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
              <span className="flex items-center justify-between gap-3">
                Password
                <Link
                  className="text-xs font-semibold text-blue-600 transition hover:text-blue-700"
                  href="/forgot-password"
                >
                  Forgot password?
                </Link>
              </span>
              <input
                className="rounded-lg border border-zinc-100 bg-white px-4 py-3 text-base text-zinc-950 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                name="password"
                placeholder="Enter your password"
                required
                type="password"
              />
            </label>

            <SubmitButton
              className="mt-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              pendingText="Signing you in..."
              showStatus={false}
            >
              <span className="flex items-center justify-center gap-2">
                <LogIn className="h-4 w-4" />
                Log In
              </span>
            </SubmitButton>
          </form>

          <p className="mt-6 text-center text-sm leading-6 text-zinc-500">
            Don&apos;t have an account?{" "}
            <Link
              className="font-semibold text-blue-600 hover:text-blue-700"
              href={`/signup${contextSuffix}`}
            >
              Sign up
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
