import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { GOOGLE_DRIVE_SCOPE, getGoogleDriveIntegrationStatus } from "@/lib/integrations/google-drive/client";

type IntegrationsPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

function formatDate(date: Date | null) {
  if (!date) {
    return null;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function IntegrationsPage({
  searchParams,
}: IntegrationsPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { error, success } = await searchParams;
  const googleDrive = await getGoogleDriveIntegrationStatus(user.id);

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <header className="border-b border-slate-200 pb-6">
          <Link className="text-sm font-medium text-teal-700 hover:text-teal-800" href="/dashboard">
            Dashboard
          </Link>
          <p className="mt-3 text-sm font-medium uppercase tracking-wide text-teal-700">
            Settings
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">
            Integrations
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
            Connect external services used by your forms.
          </p>
        </header>

        {success ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {success}
          </p>
        ) : null}

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <section className="rounded-md border border-slate-200 bg-white p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold text-slate-950">
                  Google Drive
                </h2>
                <span
                  className={`rounded-md border px-2 py-1 text-xs font-medium ${
                    googleDrive.connected
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 bg-slate-100 text-slate-700"
                  }`}
                >
                  {googleDrive.connected ? "Connected" : "Not connected"}
                </span>
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
                Files uploaded through your forms can be saved to your Google
                Drive instead of FormOS storage.
              </p>
              <p className="mt-3 text-xs text-slate-500">
                Requested scope: {GOOGLE_DRIVE_SCOPE}
              </p>
              {googleDrive.connected ? (
                <p className="mt-3 text-xs text-slate-500">
                  Connected {formatDate(googleDrive.connectedAt) ?? "recently"}.
                </p>
              ) : null}
            </div>

            {googleDrive.connected ? (
              <form action="/api/integrations/google-drive/disconnect" method="post">
                <button
                  className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
                  type="submit"
                >
                  Disconnect
                </button>
              </form>
            ) : (
              <Link
                className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                href="/api/integrations/google-drive/connect"
              >
                Connect
              </Link>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
