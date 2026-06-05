import { SubmitButton } from "@/components/ui/submit-button";
import { getPlatformSettings } from "@/lib/platform/settings";
import { savePlatformSettingsAction } from "./actions";

type AdminSettingsPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

function inputClass() {
  return "rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";
}

function Section({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="grid gap-5 rounded-md border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
      {children}
    </section>
  );
}

function TextField({
  defaultValue,
  help,
  label,
  name,
  placeholder,
}: {
  defaultValue: string;
  help?: string;
  label: string;
  name: string;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
      {label}
      <input
        className={inputClass()}
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
        type="text"
      />
      {help ? (
        <span className="text-xs font-normal leading-5 text-slate-500">
          {help}
        </span>
      ) : null}
    </label>
  );
}

function Toggle({
  checked,
  label,
  name,
}: {
  checked: boolean;
  label: string;
  name: string;
}) {
  return (
    <label className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">
      <input defaultChecked={checked} name={name} type="checkbox" />
      {label}
    </label>
  );
}

export default async function AdminSettingsPage({
  searchParams,
}: AdminSettingsPageProps) {
  const { error, success } = await searchParams;
  const settings = await getPlatformSettings();

  return (
    <main className="px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="border-b border-slate-200 pb-6">
          <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
            Super Admin
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">
            Platform Settings
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
            Manage global branding, SEO, public toggles, and safe AdSense settings.
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

        <form action={savePlatformSettingsAction} className="grid gap-6">
          <Section title="Branding">
            <div className="grid gap-5 md:grid-cols-2">
              <TextField defaultValue={settings.siteName} label="Site Name" name="siteName" />
              <TextField defaultValue={settings.logoUrl} help="Use a public path like /pdf-logo.png or an HTTPS URL." label="Logo URL / Path" name="logoUrl" placeholder="/pdf-logo.png" />
              <TextField defaultValue={settings.faviconUrl} label="Favicon URL / Path" name="faviconUrl" placeholder="/favicon.ico" />
            </div>
          </Section>

          <Section title="SEO">
            <TextField defaultValue={settings.metaTitle} label="Meta Title" name="metaTitle" />
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
              Meta Description
              <textarea
                className="min-h-28 rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                defaultValue={settings.metaDescription}
                name="metaDescription"
              />
            </label>
          </Section>

          <Section title="Company / Footer">
            <div className="grid gap-5 md:grid-cols-2">
              <TextField defaultValue={settings.companyName} label="Company Name" name="companyName" />
              <TextField defaultValue={settings.footerProjectText} label="Footer Project Text" name="footerProjectText" />
            </div>
          </Section>

          <Section title="Contact / Support">
            <div className="grid gap-5 md:grid-cols-2">
              <TextField defaultValue={settings.supportEmail} label="Support Email" name="supportEmail" />
              <TextField defaultValue={settings.contactEmail} label="Contact Email" name="contactEmail" />
            </div>
          </Section>

          <Section title="Legal URLs">
            <div className="grid gap-5 md:grid-cols-2">
              <TextField defaultValue={settings.privacyPolicyUrl} label="Privacy Policy URL" name="privacyPolicyUrl" />
              <TextField defaultValue={settings.termsUrl} label="Terms URL" name="termsUrl" />
              <TextField defaultValue={settings.dataSecurityUrl} label="Data Security URL" name="dataSecurityUrl" />
              <TextField defaultValue={settings.contactUrl} label="Contact URL" name="contactUrl" />
            </div>
          </Section>

          <Section title="Public Site Toggles">
            <div className="grid gap-3 md:grid-cols-3">
              <Toggle checked={settings.showLandingPageAds} label="Show Landing Page Ads" name="showLandingPageAds" />
              <Toggle checked={settings.showPublicFormAds} label="Show Public Form Ads" name="showPublicFormAds" />
              <Toggle checked={settings.enablePoweredByBranding} label="Enable Powered by FormOS branding" name="enablePoweredByBranding" />
            </div>
          </Section>

          <Section title="Google AdSense">
            <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
              Store only AdSense IDs and slot IDs. Do not paste script tags or HTML.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <Toggle checked={settings.adsEnabled} label="Ads Enabled" name="adsEnabled" />
              <TextField defaultValue={settings.adsenseClientId} label="AdSense Client ID" name="adsenseClientId" placeholder="ca-pub-..." />
              <TextField defaultValue={settings.landingTopAdSlot} label="Landing Top Ad Slot" name="landingTopAdSlot" />
              <TextField defaultValue={settings.landingMiddleAdSlot} label="Landing Middle Ad Slot" name="landingMiddleAdSlot" />
              <TextField defaultValue={settings.landingBottomAdSlot} label="Landing Bottom Ad Slot" name="landingBottomAdSlot" />
              <TextField defaultValue={settings.publicFormAdSlot} label="Public Form Ad Slot" name="publicFormAdSlot" />
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
                Public Form Ad Frequency
                <input
                  className={inputClass()}
                  defaultValue={settings.publicFormAdFrequency}
                  max={10}
                  min={3}
                  name="publicFormAdFrequency"
                  type="number"
                />
              </label>
              <TextField defaultValue={settings.publicFormAdLabel} label="Public Form Ad Label" name="publicFormAdLabel" placeholder="Sponsored" />
            </div>
          </Section>

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
