"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeDollarSign,
  Brush,
  Code2,
  KeyRound,
  FileText,
  FileSignature,
  Gauge,
  HelpCircle,
  Plug,
  ScrollText,
  UserRound,
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
    href: "/dashboard/widgets",
    label: "Widget",
    icon: Code2,
  },
  {
    href: "/dashboard/clients",
    label: "Clients",
    icon: UserRound,
  },
  {
    href: "/dashboard/contracts",
    label: "Contracts",
    icon: FileSignature,
  },
  {
    href: "/dashboard/agreements",
    label: "Agreements",
    icon: ScrollText,
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
  {
    href: "/dashboard/settings/api-tokens",
    label: "API Tokens",
    ownerOnly: true,
    icon: KeyRound,
  },
  {
    href: "/help",
    label: "Support / Help",
    icon: HelpCircle,
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  if (href === "/dashboard/forms") {
    return pathname === href || pathname.startsWith("/dashboard/forms/");
  }

  if (href === "/dashboard/clients") {
    return pathname === href || pathname.startsWith("/dashboard/clients/");
  }

  if (href === "/dashboard/contracts") {
    return pathname === href || pathname.startsWith("/dashboard/contracts/");
  }

  if (href === "/dashboard/agreements") {
    return pathname === href || pathname.startsWith("/dashboard/agreements/");
  }

  return pathname === href;
}

export function DashboardNav({
  canManageOwnerSettings = true,
  onNavigate,
}: {
  canManageOwnerSettings?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isBuilder = /\/dashboard\/forms\/[^/]+\/builder/.test(pathname);

  if (isBuilder) {
    return null;
  }

  return (
    <nav className="grid gap-1.5" aria-label="Dashboard navigation">
      {NAV_ITEMS.filter(
        (item) => canManageOwnerSettings || !item.ownerOnly,
      ).map((item) => {
        const isActive = isActivePath(pathname, item.href);
        const Icon = item.icon;

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
              isActive
                ? "bg-blue-600 text-white shadow-sm shadow-blue-950/20"
                : "text-slate-600 hover:bg-blue-50 hover:text-blue-800"
            }`}
            href={item.href}
            key={item.href}
            onClick={onNavigate}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
