import Link from "next/link";
import { signupAction } from "@/app/(auth)/actions";
import { PlatformBrand } from "@/components/ui/platform-brand";
import { SubmitButton } from "@/components/ui/submit-button";
import { getPlatformSettings } from "@/lib/platform/settings";

type SignupPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { error } = await searchParams;
  const settings = await getPlatformSettings();

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <PlatformBrand
          href="/"
          imageClassName="h-auto max-w-[130px] object-contain"
          textClassName="text-lg font-semibold text-slate-950"
        />
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Create account
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          Start building forms with your own {settings.siteName} account.
        </p>

        {error ? (
          <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <form action={signupAction} className="mt-8 flex flex-col gap-5">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
            Name
            <input
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              name="name"
              type="text"
            />
          </label>

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
              minLength={8}
              name="password"
              required
              type="password"
            />
          </label>

          <SubmitButton
            className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
            pendingText="Creating your account..."
          >
            Create account
          </SubmitButton>
        </form>

        <p className="mt-6 text-sm text-slate-700">
          Already have an account?{" "}
          <Link className="font-medium text-blue-700 hover:text-blue-800" href="/login">
            Log in
          </Link>
        </p>
      </section>
    </main>
  );
}
