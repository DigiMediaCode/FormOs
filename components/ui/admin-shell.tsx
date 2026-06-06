"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Settings,
  Users,
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

  if (isBuilder) {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="border-b border-slate-200 bg-white px-4 py-4 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
        <Link href="/admin">
          <img
            alt="FormOS"
            className="h-auto max-w-[116px] object-contain"
            src="/formos-logo.png"
          />
        </Link>

        <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
            Super Admin
          </p>
          <p className="mt-2 truncate text-sm font-semibold text-slate-950">
            Platform control
          </p>
          <p className="mt-1 truncate text-xs text-slate-500">{userEmail}</p>
        </div>

        <nav className="mt-6 grid gap-1" aria-label="Super Admin navigation">
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "bg-slate-950 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
                href={item.href}
                key={item.href}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Link
          className="mt-6 flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          href="/dashboard"
        >
          Back to App Dashboard
        </Link>
      </aside>

      <div className="min-w-0">
        <header className="border-b border-slate-200 bg-white/80 px-5 py-4 backdrop-blur lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
            FormOS Admin
          </p>
          <h1 className="mt-1 text-xl font-semibold text-slate-950">
            Super Admin
          </h1>
        </header>
        {children}
      </div>
    </div>
  );
}
