import Link from "next/link";
import { loginAction } from "@/app/(auth)/actions";
import { SubmitButton } from "@/components/ui/submit-button";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, success } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <section className="w-full max-w-md">
        <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
          FormOS
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">Log in</h1>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          Continue to your FormOS dashboard.
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

        <form action={loginAction} className="mt-8 flex flex-col gap-5">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
            Email
            <input
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              name="email"
              required
              type="email"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
            Password
            <input
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              name="password"
              required
              type="password"
            />
          </label>

          <SubmitButton
            className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            pendingText="Signing you in..."
          >
            Log in
          </SubmitButton>
        </form>

        <p className="mt-6 text-sm text-slate-700">
          No account yet?{" "}
          <Link className="font-medium text-teal-700 hover:text-teal-800" href="/signup">
            Sign up
          </Link>
        </p>
      </section>
    </main>
  );
}
