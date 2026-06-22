import Link from "next/link";
import { verifyEmailToken } from "@/app/(auth)/verification-actions";
import { getSessionUserId } from "@/lib/auth/session";

type VerifyEmailPageProps = {
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const { token } = await searchParams;
  const result = token
    ? await verifyEmailToken(token)
    : {
        ok: false,
        message: "Verification token is missing.",
      };
  const userId = await getSessionUserId();

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p
          className={`rounded-md border px-4 py-3 text-sm ${
            result.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {result.message}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {userId ? (
            <Link
              className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
              href="/dashboard"
            >
              Dashboard
            </Link>
          ) : null}
          <Link
            className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
            href="/login"
          >
            Log in
          </Link>
        </div>
      </section>
    </main>
  );
}
