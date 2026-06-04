import Link from "next/link";
import { SubmitButton } from "@/components/ui/submit-button";
import { getUserPlanAccess } from "@/lib/plans/limits";
import {
  DEFAULT_WORKSPACE_BRANDING,
  getWorkspaceBranding,
} from "@/lib/workspaces/branding";
import {
  getOrCreateUserWorkspace,
  requireWorkspaceOwner,
} from "@/lib/workspaces/access";
import { updateBrandingSettings } from "./actions";

type BrandingPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

function inputClass() {
  return "rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";
}

export default async function BrandingPage({ searchParams }: BrandingPageProps) {
  const context = await requireWorkspaceOwner();
  const { error, success } = await searchParams;
  const [workspace, access, branding] = await Promise.all([
    getOrCreateUserWorkspace(context.ownerId),
    getUserPlanAccess(context.ownerId),
    getWorkspaceBranding(context.ownerId),
  ]);
  const allowed = access.limits.allowCustomBranding;

  return (
    <main className="px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header>
          <h1 className="text-3xl font-semibold text-slate-950">Branding</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Configure owner branding for public forms in {workspace.name || "My Workspace"}.
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

        {!allowed ? (
          <section className="rounded-md border border-amber-200 bg-amber-50 p-6">
            <h2 className="text-xl font-semibold text-amber-950">
              Custom branding is available on plans that include branding.
            </h2>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              Your current plan is {access.plan.name}. Upgrade or ask Super Admin
              to grant a custom branding override.
            </p>
            <Link
              className="mt-5 inline-flex rounded-md bg-amber-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-800"
              href="/dashboard/settings/billing"
            >
              Go to Billing
            </Link>
          </section>
        ) : (
          <form action={updateBrandingSettings} className="grid gap-6">
            <section className="grid gap-5 rounded-md border border-slate-200 bg-white p-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">
                  Public Form Branding
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  These settings apply to public forms owned by this workspace.
                </p>
              </div>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
                Logo URL / Path
                <input
                  className={inputClass()}
                  defaultValue={branding.logoUrl}
                  name="logoUrl"
                  placeholder="/formos-logo-v2.png or https://example.com/logo.png"
                />
                <span className="text-xs leading-5 text-slate-500">
                  Use a public path starting with / or an HTTPS URL. Local public
                  files must exist under the FormOS public folder.
                </span>
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
                Brand color
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    className="h-11 w-16 rounded-md border border-slate-300 bg-white p-1"
                    defaultValue={branding.primaryColor || DEFAULT_WORKSPACE_BRANDING.primaryColor}
                    name="primaryColor"
                    type="color"
                  />
                  <input
                    className={`${inputClass()} sm:max-w-xs`}
                    defaultValue={branding.primaryColor || DEFAULT_WORKSPACE_BRANDING.primaryColor}
                    name="primaryColorText"
                    readOnly
                    type="hidden"
                  />
                  <span className="text-sm text-slate-600">
                    Used as the public form accent color.
                  </span>
                </div>
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
                Public footer text
                <input
                  className={inputClass()}
                  defaultValue={branding.publicFooterText}
                  maxLength={120}
                  name="publicFooterText"
                  placeholder="Example: Powered by Your Business"
                />
              </label>

              <label className="flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <input
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                  defaultChecked={branding.hidePoweredBy}
                  name="hidePoweredBy"
                  type="checkbox"
                />
                <span>
                  Hide default "Powered by FormOS" footer when custom footer text
                  is empty.
                </span>
              </label>
            </section>

            <SubmitButton
              className="w-fit rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
              pendingText="Saving branding..."
            >
              Save Branding
            </SubmitButton>
          </form>
        )}
      </div>
    </main>
  );
}
