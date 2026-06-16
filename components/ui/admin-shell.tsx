"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  BookOpen,
  CircleHelp,
  CreditCard,
  FileText,
  Files,
  Image,
  LayoutDashboard,
  Mail,
  Menu,
  MessageSquare,
  Settings,
  Users,
  X,
} from "lucide-react";

const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/forms", label: "Forms", icon: FileText },
  { href: "/admin/pages", label: "Pages", icon: Files },
  { href: "/admin/blog", label: "Blog", icon: BookOpen },
  { href: "/admin/knowledge-base", label: "Knowledge Base", icon: CircleHelp },
  { href: "/admin/media", label: "Media", icon: Image },
  { href: "/admin/email-notifications", label: "Emails", icon: Mail },
  { href: "/admin/support", label: "Support", icon: MessageSquare },
  { href: "/admin/plans", label: "Plans", icon: CreditCard },
  { href: "/admin/billing/events", label: "Billing Events", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname.startsWith(href);
}

export function AdminShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail: string;
}) {
  const pathname = usePathname();
  const isBuilder = /\/admin\/forms\/[^/]+\/builder/.test(pathname);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (isBuilder) {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  const nav = (
    <nav className="grid gap-1.5" aria-label="Super Admin navigation">
      {ADMIN_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
              active
                ? "bg-slate-950 text-white shadow-sm shadow-slate-950/20"
                : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-800"
            }`}
            href={item.href}
            key={item.href}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#f6f8fb] lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="hidden border-r border-slate-200/80 bg-white/95 px-5 py-6 shadow-sm lg:sticky lg:top-0 lg:block lg:h-screen">
        <Link href="/admin">
          <img
            alt="FormOS"
            className="h-auto max-w-[116px] object-contain"
            src="/formos-logo.png"
          />
        </Link>

        <div className="mt-6 rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
            Super Admin
          </p>
          <p className="mt-2 truncate text-sm font-semibold text-slate-950">
            Platform control
          </p>
          <p className="mt-1 truncate text-xs text-slate-500">{userEmail}</p>
        </div>

        <div className="mt-6">{nav}</div>

        <Link
          className="mt-6 flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-800"
          href="/dashboard"
        >
          Back to App Dashboard
        </Link>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-xl lg:px-8 lg:py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                FormOS Admin
              </p>
              <h1 className="mt-1 text-xl font-semibold text-slate-950">
                Super Admin
              </h1>
            </div>
            <button
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Close admin menu" : "Open admin menu"}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 lg:hidden"
              onClick={() => setMobileMenuOpen((open) => !open)}
              type="button"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
          {mobileMenuOpen ? (
            <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
              <button
                aria-label="Close admin menu"
                className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]"
                onClick={() => setMobileMenuOpen(false)}
                type="button"
              />
              <div className="relative flex h-full w-[min(21rem,calc(100vw-2rem))] flex-col border-r border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                  <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                    <img
                      alt="FormOS"
                      className="h-auto max-w-[112px] object-contain"
                      src="/formos-logo.png"
                    />
                  </Link>
                  <button
                    aria-label="Close admin menu"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                    onClick={() => setMobileMenuOpen(false)}
                    type="button"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4">
                  <div className="mb-4 rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                      Super Admin
                    </p>
                    <p className="mt-2 truncate text-sm font-semibold text-slate-950">
                      Platform control
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500">{userEmail}</p>
                  </div>
                  {nav}
                </div>

                <div className="border-t border-slate-200 p-4">
                  <Link
                    className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-800"
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Back to App Dashboard
                  </Link>
                </div>
              </div>
            </div>
          ) : null}
        </header>
        {children}
      </div>
    </div>
  );
}
