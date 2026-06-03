"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    section: "dashboard",
  },
  {
    href: "/dashboard/forms",
    label: "Forms",
    section: "forms",
  },
  {
    href: "/dashboard/settings/integrations",
    label: "Settings / Integrations",
    section: "settings",
  },
  {
    href: "/dashboard/settings/profile",
    label: "Profile / Business Profile",
    section: "settings",
  },
  {
    href: "/dashboard/settings/billing",
    label: "Billing",
    section: "settings",
  },
];

function activeSection(pathname: string) {
  if (pathname.startsWith("/dashboard/forms")) {
    return "forms";
  }

  if (pathname.startsWith("/dashboard/settings")) {
    return "settings";
  }

  return "dashboard";
}

export function DashboardNav() {
  const pathname = usePathname();
  const currentSection = activeSection(pathname);

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Dashboard navigation">
      {NAV_ITEMS.map((item) => {
        const isActive = item.section === currentSection;

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={`rounded-md px-3 py-2 text-sm font-medium transition ${
              isActive
                ? "bg-slate-950 text-white"
                : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
            }`}
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
