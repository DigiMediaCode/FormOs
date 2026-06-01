import { SubmitButton } from "@/components/ui/submit-button";
import { getPlatformSettings } from "@/lib/platform/settings";
import { savePlatformSettingsAction } from "./actions";

type AdminSettingsPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function AdminSettingsPage({
  searchParams,
}: AdminSettingsPageProps) {
  const { error, success } = await searchParams;
  const settings = await getPlatformSettings();

  return (
    <main className="px-6 py-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <header className="border-b border-slate-200 pb-6">
          <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
            Super Admin
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">
            Platform Settings
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
            Manage global FormOS branding and basic SEO defaults.
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

        <form
          action={savePlatformSettingsAction}
          className="flex flex-col gap-5 rounded-md border border-slate-200 bg-white p-6"
        >
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
            Site Name
            <input
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              defaultValue={settings.siteName}
              name="siteName"
              type="text"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
            Meta Title
            <input
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              defaultValue={settings.metaTitle}
              name="metaTitle"
              type="text"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
            Meta Description
            <textarea
              className="min-h-28 rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              defaultValue={settings.metaDescription}
              name="metaDescription"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
            Logo URL / Path
            <input
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              defaultValue={settings.logoUrl}
              name="logoUrl"
              placeholder="/pdf-logo.png"
              type="text"
            />
            <span className="text-xs font-normal leading-5 text-slate-500">
              Use a public path like /pdf-logo.png or an HTTPS URL.
            </span>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
            Favicon URL / Path
            <input
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              defaultValue={settings.faviconUrl}
              name="faviconUrl"
              placeholder="/favicon.ico"
              type="text"
            />
            <span className="text-xs font-normal leading-5 text-slate-500">
              Dynamic favicon support is applied through metadata icons when set.
            </span>
          </label>

          <SubmitButton
            className="w-fit rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            pendingText="Saving settings..."
          >
            Save Settings
          </SubmitButton>
        </form>
      </div>
    </main>
  );
}
