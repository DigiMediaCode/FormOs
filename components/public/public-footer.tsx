import Link from "next/link";
import { PlatformBrand } from "@/components/ui/platform-brand";
import { getPlatformSettings } from "@/lib/platform/settings";

export async function PublicFooter() {
  const settings = await getPlatformSettings();

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
          <p className="mt-3 text-sm text-slate-600">
            Project by DigiMedia Code LLC
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#071124]">Product</h3>
          <div className="mt-3 grid gap-2 text-sm text-slate-600">
            <Link className="hover:text-blue-600" href="/#features">Features</Link>
            <Link className="hover:text-blue-600" href="/#use-cases">Use Cases</Link>
            <Link className="hover:text-blue-600" href="/pricing">Pricing</Link>
            <Link className="hover:text-blue-600" href="/login">Login</Link>
            <Link className="hover:text-blue-600" href="/signup">Signup</Link>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#071124]">Legal</h3>
          <div className="mt-3 grid gap-2 text-sm text-slate-600">
            <Link className="hover:text-blue-600" href="/privacy-policy">Privacy Policy</Link>
            <Link className="hover:text-blue-600" href="/terms-of-service">Terms</Link>
            <Link className="hover:text-blue-600" href="/data-security">Data Security</Link>
            <Link className="hover:text-blue-600" href="/contact">Contact</Link>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-[1088px] flex-col gap-3 border-t border-blue-100 pt-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; 2025 {settings.siteName}. All rights reserved.</p>
        <p className="text-blue-700">Secure document handling</p>
      </div>
    </footer>
  );
}
