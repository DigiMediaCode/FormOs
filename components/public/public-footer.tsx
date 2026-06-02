import Link from "next/link";
import { PlatformBrand } from "@/components/ui/platform-brand";
import { getPlatformSettings } from "@/lib/platform/settings";

export async function PublicFooter() {
  const settings = await getPlatformSettings();

  return (
    <footer className="border-t border-slate-200 bg-white px-5 py-10 sm:px-8">
      <div className="mx-auto grid max-w-[1088px] gap-10 lg:grid-cols-[1fr_140px_140px]">
        <div>
          <PlatformBrand
            href="/"
            imageClassName="h-auto max-w-[108px] object-contain"
            textClassName="text-base font-bold text-slate-950"
          />
          <p className="mt-4 max-w-md text-sm leading-6 text-slate-600">
            The modern way to build forms, agreements, and signed workflows that
            deliver finished PDFs automatically.
          </p>
          <p className="mt-3 text-sm text-slate-600">
            FormOS is a project of DigiMedia Code LLC.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-950">Product</h3>
          <div className="mt-3 grid gap-2 text-sm text-slate-600">
            <Link className="hover:text-slate-950" href="/#features">Features</Link>
            <Link className="hover:text-slate-950" href="/#use-cases">Use Cases</Link>
            <Link className="hover:text-slate-950" href="/pricing">Pricing</Link>
            <Link className="hover:text-slate-950" href="/login">Login</Link>
            <Link className="hover:text-slate-950" href="/signup">Signup</Link>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-950">Legal</h3>
          <div className="mt-3 grid gap-2 text-sm text-slate-600">
            <Link className="hover:text-slate-950" href="/privacy-policy">Privacy Policy</Link>
            <Link className="hover:text-slate-950" href="/terms-of-service">Terms</Link>
            <Link className="hover:text-slate-950" href="/data-security">Data Security</Link>
            <Link className="hover:text-slate-950" href="/contact">Contact</Link>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-[1088px] flex-col gap-3 border-t border-slate-200 pt-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; 2025 {settings.siteName}. All rights reserved.</p>
        <p>Secure document handling</p>
      </div>
    </footer>
  );
}
