import Link from "next/link";
import {
  isPasswordResetTokenValid,
  resetPasswordAction,
} from "@/app/(auth)/verification-actions";
import { SubmitButton } from "@/components/ui/submit-button";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    error?: string;
    token?: string;
  }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { error, token } = await searchParams;
  const isValidToken = token ? await isPasswordResetTokenValid(token) : false;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-950">
          Reset password
        </h1>

        {!isValidToken ? (
          <>
            <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              This reset link is invalid, expired, or already used.
            </p>
            <Link
              className="mt-6 inline-flex rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
              href="/forgot-password"
            >
              Request a new link
            </Link>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Enter a new password with at least 8 characters.
            </p>
            {error ? (
              <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </p>
            ) : null}
            <form action={resetPasswordAction} className="mt-8 flex flex-col gap-5">
              <input name="token" type="hidden" value={token} />
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
                New password
                <input
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  minLength={8}
                  name="password"
                  required
                  type="password"
                />
              </label>
              <SubmitButton
                className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
                pendingText="Updating password..."
              >
                Update password
              </SubmitButton>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
