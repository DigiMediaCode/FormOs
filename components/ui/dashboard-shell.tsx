"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Settings, ShieldCheck, UserCircle } from "lucide-react";
import { logoutAction } from "@/app/(auth)/actions";
import { DashboardNav } from "@/components/ui/dashboard-nav";
import { SubmitButton } from "@/components/ui/submit-button";

export function DashboardShell({
  canManageOwnerSettings,
  children,
  isSuperAdmin = false,
  userEmail,
  userName,
}: {
  canManageOwnerSettings: boolean;
  children: React.ReactNode;
  isSuperAdmin?: boolean;
  userEmail: string;
  userName?: string | null;
}) {
  const pathname = usePathname();
  const isBuilder = /\/dashboard\/forms\/[^/]+\/builder/.test(pathname);

  if (isBuilder) {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="border-b border-slate-200 bg-white px-4 py-4 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
        <div className="flex items-center justify-between gap-4 lg:block">
          <Link href="/dashboard">
            <img
              alt="FormOS"
              className="h-auto max-w-[116px] object-contain"
              src="/formos-logo.png"
            />
          </Link>
          <Link
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm lg:hidden"
            href="/dashboard/forms/new"
          >
            New Form
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto pb-2 lg:mt-6 lg:overflow-visible lg:pb-0">
          <DashboardNav canManageOwnerSettings={canManageOwnerSettings} />
        </div>

        {isSuperAdmin ? (
          <Link
            className="mt-3 flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2.5 text-sm font-semibold text-indigo-800 transition hover:border-indigo-200 hover:bg-indigo-100"
            href="/admin"
          >
            <ShieldCheck className="h-4 w-4" />
            Admin Panel
          </Link>
        ) : null}

        <div className="group relative mt-4 hidden lg:mt-auto lg:block">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition group-hover:border-blue-200 group-hover:shadow-md">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <UserCircle className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-slate-950">
                  {userName || "FormOS User"}
                </span>
                <span className="block truncate text-xs text-slate-500">
                  {userEmail}
                </span>
              </span>
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-full left-0 right-0 z-10 mb-2 translate-y-1 opacity-0 transition group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
            <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-950/10">
              <Link
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                href="/dashboard/settings/profile"
              >
                <Settings className="h-4 w-4" />
                Profile
              </Link>
              <form action={logoutAction}>
                <SubmitButton
                  className="flex w-full items-center justify-start gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                  pendingText="Signing out..."
                  showStatus={false}
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </SubmitButton>
              </form>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="border-b border-slate-200 bg-white/80 px-5 py-4 backdrop-blur lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                FormOS Workspace
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {userName ? `${userName} (${userEmail})` : userEmail}
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                href="/dashboard/forms"
              >
                Forms
              </Link>
              <Link
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                href="/dashboard/forms/new"
              >
                New Form
              </Link>
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
