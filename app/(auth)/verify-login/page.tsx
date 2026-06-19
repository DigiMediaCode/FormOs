import Link from "next/link";
import { CircleAlert, CircleCheck, MailCheck, RefreshCw } from "lucide-react";
import {
  resendLoginCodeAction,
  verifyLoginCodeAction,
} from "@/app/(auth)/actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { PlatformBrand } from "@/components/ui/platform-brand";
import { getPendingLoginVerification } from "@/lib/auth/login-verification";
import { getPlatformSettings } from "@/lib/platform/settings";

type VerifyLoginPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function VerifyLoginPage({
  searchParams,
}: VerifyLoginPageProps) {
  const { error, success } = await searchParams;
  const pendingLogin = await getPendingLoginVerification();
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

        <div className="mt-10 w-full rounded-2xl bg-white p-8 shadow-lg shadow-blue-950/5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <MailCheck className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-zinc-950">
            Check your email
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Enter the 6-digit code we sent to{" "}
            <span className="font-semibold text-zinc-800">
              {pendingLogin?.maskedEmail ?? "your email address"}
            </span>{" "}
            to finish signing in to {settings.siteName}.
          </p>

          {success ? (
            <div className="mt-6 flex gap-3 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-emerald-800">
              <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="text-sm leading-5">{success}</p>
            </div>
          ) : null}

          {error ? (
            <div className="mt-6 flex gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="text-sm leading-5">{error}</p>
            </div>
          ) : null}

          {pendingLogin ? (
            <>
              <form action={verifyLoginCodeAction} className="mt-6 grid gap-4">
                <label className="grid gap-2 text-sm font-medium text-zinc-950">
                  Login code
                  <input
                    autoComplete="one-time-code"
                    autoFocus
                    className="rounded-lg border border-zinc-100 bg-white px-4 py-3 text-center text-2xl font-bold tracking-[0.35em] text-zinc-950 shadow-sm outline-none transition placeholder:text-zinc-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    inputMode="numeric"
                    maxLength={6}
                    name="code"
                    pattern="[0-9]{6}"
                    placeholder="000000"
                    required
                    type="text"
                  />
                </label>

                <SubmitButton
                  className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                  pendingText="Verifying code..."
                  showStatus={false}
                >
                  Verify and continue
                </SubmitButton>
              </form>

              <form action={resendLoginCodeAction} className="mt-3">
                <SubmitButton
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
                  pendingText="Sending a new code..."
                  showStatus={false}
                >
                  <RefreshCw className="h-4 w-4" />
                  Send a new code
                </SubmitButton>
              </form>
            </>
          ) : (
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              Your login verification session has expired. Please start again.
            </div>
          )}

          <p className="mt-6 text-center text-sm leading-6 text-zinc-500">
            Need to use a different account?{" "}
            <Link
              className="font-semibold text-blue-600 hover:text-blue-700"
              href="/login"
            >
              Back to login
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
