"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeDollarSign,
  Brush,
  FileText,
  Gauge,
  Plug,
  Users,
} from "lucide-react";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: Gauge,
  },
  {
    href: "/dashboard/forms",
    label: "Forms",
    icon: FileText,
  },
  {
    href: "/dashboard/settings/integrations",
    label: "Integrations",
    ownerOnly: true,
    icon: Plug,
  },
  {
    href: "/dashboard/settings/billing",
    label: "Billing",
    ownerOnly: true,
    icon: BadgeDollarSign,
  },
  {
    href: "/dashboard/settings/team",
    label: "Team",
    ownerOnly: true,
    icon: Users,
  },
  {
    href: "/dashboard/settings/branding",
    label: "Branding",
    ownerOnly: true,
    icon: Brush,
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  if (href === "/dashboard/forms") {
    return pathname === href || pathname.startsWith("/dashboard/forms/");
  }

  return pathname === href;
}

export function DashboardNav({
  canManageOwnerSettings = true,
}: {
  canManageOwnerSettings?: boolean;
}) {
  const pathname = usePathname();
  const isBuilder = /\/dashboard\/forms\/[^/]+\/builder/.test(pathname);

  if (isBuilder) {
    return null;
  }

  return (
    <nav className="grid gap-1" aria-label="Dashboard navigation">
      {NAV_ITEMS.filter(
        (item) => canManageOwnerSettings || !item.ownerOnly,
      ).map((item) => {
        const isActive = isActivePath(pathname, item.href);
        const Icon = item.icon;

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              isActive
                ? "bg-blue-600 text-white shadow-sm shadow-blue-950/20"
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
  );
}
