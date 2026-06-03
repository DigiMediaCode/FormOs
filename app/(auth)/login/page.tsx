import Link from "next/link";
import { loginAction } from "@/app/(auth)/actions";
import { PlatformBrand } from "@/components/ui/platform-brand";
import { SubmitButton } from "@/components/ui/submit-button";
import { getPlatformSettings } from "@/lib/platform/settings";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, success } = await searchParams;
  const settings = await getPlatformSettings();

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <PlatformBrand
          href="/"
          imageClassName="h-auto max-w-[130px] object-contain"
          textClassName="text-lg font-semibold text-slate-950"
        />
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">Log in</h1>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          Continue to your {settings.siteName} dashboard.
        </p>

        {success ? (
          <p className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {success}
          </p>
        ) : null}

        {error ? (
          <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <div className="mt-8 grid gap-3">
          <Link
            className="flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
            href="/api/auth/google/login"
          >
            Continue with Google
          </Link>
          <Link
            className="flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
            href="/api/auth/lark/login"
          >
            Continue with Lark
          </Link>
        </div>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
            or log in with email
          </span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <form action={loginAction} className="flex flex-col gap-5">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
            Email
            <input
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              name="email"
              required
              type="email"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
            Password
            <input
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              name="password"
              required
              type="password"
            />
          </label>

          <Link
            className="w-fit text-sm font-medium text-blue-700 hover:text-blue-800"
            href="/forgot-password"
          >
            Forgot password?
          </Link>

          <SubmitButton
            className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
            pendingText="Signing you in..."
          >
            Log in
          </SubmitButton>
        </form>

        <p className="mt-6 text-sm text-slate-700">
          No account yet?{" "}
          <Link className="font-medium text-blue-700 hover:text-blue-800" href="/signup">
            Sign up
          </Link>
        </p>
      </section>
    </main>
  );
}
