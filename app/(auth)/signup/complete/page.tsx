import Link from "next/link";
import { AuthTokenType } from "@prisma/client";
import { CircleAlert, CircleCheck, LockKeyhole } from "lucide-react";
import { completeSignupAction } from "@/app/(auth)/signup/complete/actions";
import { PlatformBrand } from "@/components/ui/platform-brand";
import { SubmitButton } from "@/components/ui/submit-button";
import { findValidAuthToken } from "@/lib/auth/tokens";
import { prisma } from "@/lib/prisma";

type CompleteSignupPageProps = {
  searchParams: Promise<{
    token?: string;
    plan?: string;
    error?: string;
  }>;
};

export default async function CompleteSignupPage({
  searchParams,
}: CompleteSignupPageProps) {
  const { token = "", plan, error } = await searchParams;
  const validToken = token
    ? await findValidAuthToken(token, AuthTokenType.PASSWORD_RESET)
    : null;
  const user = validToken?.userId
    ? await prisma.user.findUnique({
        where: { id: validToken.userId },
        select: {
          firstName: true,
          lastName: true,
          name: true,
          email: true,
        },
      })
    : null;
  const [firstName, ...lastNameParts] = String(user?.name ?? "").split(/\s+/);
  const defaultFirstName = user?.firstName ?? firstName ?? "";
  const defaultLastName = user?.lastName ?? lastNameParts.join(" ") ?? "";

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 font-sans text-slate-950">
      <section className="mx-auto flex w-full max-w-md flex-col items-center">
        <PlatformBrand
          href="/"
          className="flex items-center justify-center"
          imageClassName="h-auto max-w-[160px] object-contain"
          textClassName="text-2xl font-bold tracking-tight text-slate-950"
        />

        <div className="mt-10 w-full rounded-2xl bg-white p-8 shadow-lg shadow-blue-950/5">
          <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950">
            Complete your signup
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {plan
              ? `Your ${plan} trial is ready. Set your password to continue.`
              : "Set your password to continue to FormOS."}
          </p>

          {error ? (
            <div className="mt-6 flex gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="text-sm leading-5">{error}</p>
            </div>
          ) : null}

          {!validToken || !user ? (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">
              This signup completion link is invalid, expired, or already used.
              Please log in or contact support if your Stripe checkout already
              succeeded.
              <div className="mt-4">
                <Link
                  className="inline-flex rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                  href="/login"
                >
                  Log in
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-6 flex gap-3 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-emerald-800">
                <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">Trial activated</p>
                  <p className="mt-0.5 text-xs leading-5">
                    We found your Stripe checkout for {user.email}.
                  </p>
                </div>
              </div>

              <form action={completeSignupAction} className="mt-6 grid gap-4">
                <input name="token" type="hidden" value={token} />
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid min-w-0 gap-2 text-sm font-medium text-slate-950">
                    First Name
                    <input
                      className="min-w-0 rounded-lg border border-slate-200 bg-white px-4 py-3 text-base text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      defaultValue={defaultFirstName}
                      name="firstName"
                      type="text"
                    />
                  </label>
                  <label className="grid min-w-0 gap-2 text-sm font-medium text-slate-950">
                    Last Name
                    <input
                      className="min-w-0 rounded-lg border border-slate-200 bg-white px-4 py-3 text-base text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      defaultValue={defaultLastName}
                      name="lastName"
                      type="text"
                    />
                  </label>
                </div>
                <label className="grid gap-2 text-sm font-medium text-slate-950">
                  Password
                  <input
                    className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-base text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    minLength={8}
                    name="password"
                    placeholder="Create a password"
                    required
                    type="password"
                  />
                </label>
                <SubmitButton
                  className="mt-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                  pendingText="Opening your dashboard..."
                  showStatus={false}
                >
                  Continue to dashboard
                </SubmitButton>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
