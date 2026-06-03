import Link from "next/link";
import { forgotPasswordAction } from "@/app/(auth)/verification-actions";
import { SubmitButton } from "@/components/ui/submit-button";

type ForgotPasswordPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const { error, success } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-950">
          Forgot password
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          Enter your email and we will send a reset link if an account exists.
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

        <form action={forgotPasswordAction} className="mt-8 flex flex-col gap-5">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
            Email
            <input
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              name="email"
              required
              type="email"
            />
          </label>
          <SubmitButton
            className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
            pendingText="Sending reset link..."
          >
            Send reset link
          </SubmitButton>
        </form>

        <p className="mt-6 text-sm text-slate-700">
          Remembered it?{" "}
          <Link className="font-medium text-blue-700 hover:text-blue-800" href="/login">
            Log in
          </Link>
        </p>
      </section>
    </main>
  );
}
