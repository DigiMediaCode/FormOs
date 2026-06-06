import Link from "next/link";
import { PlatformBrand } from "@/components/ui/platform-brand";
import { getCmsFooterPages } from "@/lib/cms/pages";
import { getPlatformSettings } from "@/lib/platform/settings";

export async function PublicFooter() {
  const [settings, cmsPages] = await Promise.all([
    getPlatformSettings(),
    getCmsFooterPages(),
  ]);

  return (
    <footer className="border-t border-blue-100 bg-white px-5 py-10 sm:px-8">
      <div className="mx-auto grid max-w-[1088px] gap-10 lg:grid-cols-[1fr_140px_140px]">
        <div>
          <PlatformBrand
            href="/"
            imageClassName="h-auto max-w-[108px] object-contain"
            textClassName="text-base font-bold text-[#071124]"
          />
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-600">
            The modern way to build forms, agreements, and signed workflows that
            deliver finished PDFs automatically.
          </p>
          {settings.footerProjectText ? (
            <p className="mt-3 text-sm text-slate-600">
              {settings.footerProjectText}
            </p>
          ) : null}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#071124]">Product</h3>
          <div className="mt-3 grid gap-2 text-sm text-slate-600">
            <Link className="hover:text-blue-600" href="/#features">Features</Link>
            <Link className="hover:text-blue-600" href="/#use-cases">Use Cases</Link>
            <Link className="hover:text-blue-600" href="/blog">Blog</Link>
            <Link className="hover:text-blue-600" href="/help">Help Center</Link>
            <Link className="hover:text-blue-600" href="/pricing">Pricing</Link>
            <Link className="hover:text-blue-600" href="/login">Login</Link>
            <Link className="hover:text-blue-600" href="/signup">Signup</Link>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#071124]">Legal</h3>
          <div className="mt-3 grid gap-2 text-sm text-slate-600">
            <Link className="hover:text-blue-600" href={settings.privacyPolicyUrl}>Privacy Policy</Link>
            <Link className="hover:text-blue-600" href={settings.termsUrl}>Terms</Link>
            <Link className="hover:text-blue-600" href={settings.dataSecurityUrl}>Data Security</Link>
            <Link className="hover:text-blue-600" href={settings.contactUrl}>Contact</Link>
            {cmsPages
              .filter(
                (page) =>
                  ![
                    "privacy-policy",
                    "terms-of-service",
                    "data-security",
                    "contact",
                  ].includes(page.slug),
              )
              .map((page) => (
                <Link
                  className="hover:text-blue-600"
                  href={`/p/${page.slug}`}
                  key={page.id}
                >
                  {page.menuLabel || page.title}
                </Link>
              ))}
          </div>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-[1088px] flex-col gap-3 border-t border-blue-100 pt-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; 2025 {settings.siteName}. All rights reserved.</p>
        {settings.enablePoweredByBranding ? (
          <p className="text-blue-700">Secure document handling</p>
        ) : null}
      </div>
    </footer>
  );
}
