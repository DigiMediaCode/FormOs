import Link from "next/link";
import { SubmitButton } from "@/components/ui/submit-button";
import { getPlatformSettings } from "@/lib/platform/settings";
import {
  BadgeDollarSign,
  Building2,
  Globe,
  LifeBuoy,
  Palette,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  ToggleLeft,
} from "lucide-react";
import { savePlatformSettingsAction } from "./actions";

type AdminSettingsPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

function inputClass() {
  return "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
}

function Section({
  children,
  icon: Icon,
  title,
}: {
  children: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon className="size-4" />
        </span>
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      </div>
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
    <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
      <span>{label}</span>
      <input
        className={inputClass()}
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
        type="text"
      />
      {help ? (
        <span className="text-[11px] font-normal leading-4 text-slate-500">
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
    <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
      <input
        className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        defaultChecked={checked}
        name={name}
        type="checkbox"
      />
      <span>{label}</span>
    </label>
  );
}

export default async function AdminSettingsPage({
  searchParams,
}: AdminSettingsPageProps) {
  const { error, success } = await searchParams;
  const settings = await getPlatformSettings();

  return (
    <main className="px-4 py-6 lg:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
            Super Admin
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-950">
            Platform Settings
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            Manage global branding, SEO, public toggles, and safe AdSense settings.
          </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
            <ShieldCheck className="size-3.5" />
            Protected controls
          </span>
        </header>

        {success ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {success}
          </p>
        ) : null}

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <form action={savePlatformSettingsAction} className="grid gap-4">
          <div className="grid gap-4 xl:grid-cols-2">
          <Section icon={Palette} title="Branding">
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-800">
              Upload here or manage files in{" "}
              <Link className="font-semibold underline" href="/admin/media">
                Media Library
              </Link>
              , then paste the generated <code>/media/...</code> path here.
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <TextField defaultValue={settings.siteName} label="Site Name" name="siteName" />
              <TextField defaultValue={settings.logoUrl} help="Use a public path like /media/... or an HTTPS URL." label="Logo URL / Path" name="logoUrl" placeholder="/media/..." />
              <TextField defaultValue={settings.faviconUrl} help="Use a public path like /media/... or /favicon.ico." label="Favicon URL / Path" name="faviconUrl" placeholder="/media/..." />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
                Upload Logo
                <input
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-blue-700"
                  name="logoFile"
                  type="file"
                />
                <span className="text-[11px] font-normal leading-4 text-slate-500">
                  Uploading replaces the Logo URL with the new Media Library path.
                </span>
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
                Upload Favicon
                <input
                  accept="image/png,image/jpeg,image/webp,image/gif,image/x-icon,image/vnd.microsoft.icon"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-blue-700"
                  name="faviconFile"
                  type="file"
                />
                <span className="text-[11px] font-normal leading-4 text-slate-500">
                  Uploading replaces the Favicon URL with the new Media Library path.
                </span>
              </label>
            </div>
          </Section>

          <Section icon={Search} title="SEO">
            <TextField defaultValue={settings.metaTitle} label="Meta Title" name="metaTitle" />
            <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
              Meta Description
              <textarea
                className="min-h-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                defaultValue={settings.metaDescription}
                name="metaDescription"
              />
            </label>
            <TextField
              defaultValue={settings.socialImageUrl}
              help="Recommended size: 1200 x 630 px. Used for social sharing previews on Facebook, LinkedIn, WhatsApp, and X."
              label="Social Share Image URL / Path"
              name="socialImageUrl"
              placeholder="/media/... or https://example.com/social-share.png"
            />
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
              <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
                Upload Social Share Image
                <input
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-blue-700"
                  name="socialImageFile"
                  type="file"
                />
                <span className="text-[11px] font-normal leading-4 text-slate-500">
                  Uploading saves the image to the Media Library and replaces the
                  social image path.
                </span>
              </label>
              {settings.socialImageUrl ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
                    Preview
                  </p>
                  <img
                    alt="Social share preview"
                    className="aspect-[1200/630] w-full rounded-lg border border-slate-200 bg-white object-cover"
                    src={settings.socialImageUrl}
                  />
                </div>
              ) : null}
            </div>
          </Section>

          <Section icon={Building2} title="Company / Footer">
            <div className="grid gap-3 md:grid-cols-2">
              <TextField defaultValue={settings.companyName} label="Company Name" name="companyName" />
              <TextField defaultValue={settings.footerProjectText} label="Footer Project Text" name="footerProjectText" />
            </div>
          </Section>

          <Section icon={LifeBuoy} title="Contact / Support">
            <div className="grid gap-3 md:grid-cols-2">
              <TextField defaultValue={settings.supportEmail} label="Support Email" name="supportEmail" />
              <TextField defaultValue={settings.contactEmail} label="Contact Email" name="contactEmail" />
            </div>
          </Section>

          <Section icon={Globe} title="Legal URLs">
            <div className="grid gap-3 md:grid-cols-2">
              <TextField defaultValue={settings.privacyPolicyUrl} label="Privacy Policy URL" name="privacyPolicyUrl" />
              <TextField defaultValue={settings.termsUrl} label="Terms URL" name="termsUrl" />
              <TextField defaultValue={settings.dataSecurityUrl} label="Data Security URL" name="dataSecurityUrl" />
              <TextField defaultValue={settings.contactUrl} label="Contact URL" name="contactUrl" />
            </div>
          </Section>

          <Section icon={ToggleLeft} title="Public Site Toggles">
            <div className="grid gap-3 md:grid-cols-3">
              <Toggle checked={settings.showLandingPageAds} label="Show Landing Page Ads" name="showLandingPageAds" />
              <Toggle checked={settings.showPublicFormAds} label="Show Public Form Ads" name="showPublicFormAds" />
              <Toggle checked={settings.enablePoweredByBranding} label="Enable Powered by FormOS branding" name="enablePoweredByBranding" />
            </div>
          </Section>

          <Section icon={Sparkles} title="Paid Plan Trial">
            <p className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-800">
              Controls the Stripe subscription trial for paid plans. Trialing
              users receive the selected plan limits until the trial ends,
              cancels, or payment fails.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <Toggle checked={settings.trialEnabled} label="Enable paid plan trials" name="trialEnabled" />
              <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
                Trial Days
                <input
                  className={inputClass()}
                  defaultValue={settings.trialDays}
                  max={365}
                  min={1}
                  name="trialDays"
                  type="number"
                />
                <span className="text-[11px] font-normal leading-4 text-slate-500">
                  Default paid-plan trial length for eligible users.
                </span>
              </label>
            </div>
          </Section>
          </div>

          <Section icon={BadgeDollarSign} title="Google AdSense">
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
              Store only AdSense IDs and slot IDs. Do not paste script tags or HTML.
              Keep ads disabled until AdSense approval. Google may reject new
              SaaS/product sites for low-value content until enough unique
              public content is available.
            </p>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Toggle checked={settings.adsEnabled} label="Ads Enabled" name="adsEnabled" />
              <TextField defaultValue={settings.adsenseClientId} label="AdSense Client ID" name="adsenseClientId" placeholder="ca-pub-..." />
              <TextField defaultValue={settings.landingTopAdSlot} label="Landing Top Ad Slot" name="landingTopAdSlot" />
              <TextField defaultValue={settings.landingMiddleAdSlot} label="Landing Middle Ad Slot" name="landingMiddleAdSlot" />
              <TextField defaultValue={settings.landingBottomAdSlot} label="Landing Bottom Ad Slot" name="landingBottomAdSlot" />
              <TextField defaultValue={settings.publicFormAdSlot} label="Public Form Ad Slot" name="publicFormAdSlot" />
              <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
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
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            pendingText="Saving settings..."
          >
            <Save className="size-4" />
            Save Settings
          </SubmitButton>
        </form>
      </div>
    </main>
  );
}
