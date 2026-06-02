import Link from "next/link";
import type { ReactNode } from "react";
import { PlatformBrand } from "@/components/ui/platform-brand";
import { requireSuperAdmin } from "@/lib/admin/auth";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await requireSuperAdmin();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <PlatformBrand
              href="/admin"
              imageClassName="h-auto max-w-[110px] object-contain"
              textClassName="text-lg font-semibold text-slate-950"
            />
            <h1 className="mt-1 text-2xl font-semibold text-slate-950">
              Super Admin
            </h1>
            <p className="mt-1 text-sm text-slate-600">{user.email}</p>
          </div>
          <nav className="flex flex-wrap gap-2">
            <Link className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50" href="/admin">
              Admin Dashboard
            </Link>
            <Link className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50" href="/admin/users">
              Users
            </Link>
            <Link className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50" href="/admin/forms">
              Forms
            </Link>
            <Link className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50" href="/admin/plans">
              Plans
            </Link>
            <Link className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50" href="/admin/settings">
              Settings
            </Link>
            <Link className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50" href="/dashboard">
              Back to App Dashboard
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
