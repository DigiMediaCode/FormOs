import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { PlatformBrand } from "@/components/ui/platform-brand";

const navLinks = [
  { href: "/#features", label: "Features" },
  { href: "/#use-cases", label: "Use Cases" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#templates", label: "Templates" },
  { href: "/pricing", label: "Pricing" },
];

export async function PublicHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1088px] items-center justify-between gap-4 px-5 sm:px-8">
        <PlatformBrand
          href="/"
          imageClassName="h-auto max-w-[108px] object-contain"
          textClassName="text-base font-bold text-slate-950"
        />
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 xl:flex">
          {navLinks.map((link) => (
            <Link className="transition hover:text-slate-950" href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
              <Link
                className="rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600"
                href="/dashboard"
              >
              Dashboard
            </Link>
          ) : (
            <>
                <Link
                  className="hidden rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 sm:inline-flex"
                  href="/login"
                >
                Login
              </Link>
                <Link
                  className="rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600"
                  href="/signup"
                >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
