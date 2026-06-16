"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  KeyRound,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  UserCircle,
  X,
} from "lucide-react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (isBuilder) {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  const profileMenu = (
    <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-950/10">
      <Link
        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
        href="/dashboard/settings/profile"
        onClick={() => setMobileMenuOpen(false)}
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
  );

  const navContent = (
    <>
      <DashboardNav
        canManageOwnerSettings={canManageOwnerSettings}
        onNavigate={() => setMobileMenuOpen(false)}
      />
      {isSuperAdmin ? (
        <Link
          className="mt-3 flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2.5 text-sm font-semibold text-indigo-800 transition hover:border-indigo-200 hover:bg-indigo-100"
          href="/admin"
          onClick={() => setMobileMenuOpen(false)}
        >
          <ShieldCheck className="h-4 w-4" />
          Admin Panel
        </Link>
      ) : null}
    </>
  );

  return (
    <div className="min-h-screen bg-[#f6f8fb] lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="hidden border-r border-slate-200/80 bg-white/95 px-5 py-6 shadow-sm lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div>
          <Link href="/dashboard">
            <img
              alt="FormOS"
              className="h-auto max-w-[116px] object-contain"
              src="/formos-logo.png"
            />
          </Link>
        </div>

        <div className="mt-7">{navContent}</div>

        <div className="group relative mt-4 hidden lg:mt-auto lg:block">
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-3 shadow-sm transition group-hover:border-blue-200 group-hover:shadow-md">
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
            {profileMenu}
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-xl lg:px-8 lg:py-4">
          <div className="mb-3 flex items-center justify-between gap-3 lg:hidden">
            <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
              <img
                alt="FormOS"
                className="h-auto max-w-[112px] object-contain"
                src="/formos-logo.png"
              />
            </Link>
            <button
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
              onClick={() => setMobileMenuOpen((open) => !open)}
              type="button"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {mobileMenuOpen ? (
            <div
              className="fixed inset-0 z-50 bg-slate-50 lg:hidden"
              role="dialog"
              aria-modal="true"
            >
              <div className="flex h-full min-h-dvh flex-col bg-slate-50">
                <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 shadow-sm">
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <img
                      alt="FormOS"
                      className="h-auto max-w-[128px] object-contain"
                      src="/formos-logo.png"
                    />
                  </Link>
                  <button
                    aria-label="Close menu"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                    onClick={() => setMobileMenuOpen(false)}
                    type="button"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto bg-slate-50 px-5 py-5">
                  <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
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
                  <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
                    {navContent}
                  </div>
                </div>

                <div className="border-t border-slate-200 bg-slate-50 p-5">
                  {profileMenu}
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                FormOS Workspace
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {userName ? `${userName} (${userEmail})` : userEmail}
              </p>
            </div>
            <div className="flex gap-2">
              {canManageOwnerSettings ? (
                <Link
                className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800 sm:inline-flex"
                  href="/dashboard/settings/api-tokens"
                >
                  <KeyRound className="h-4 w-4" />
                  API Tokens
                </Link>
              ) : null}
              <Link
                className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800 sm:inline-flex"
                href="/dashboard/forms"
              >
                Forms
              </Link>
              <Link
                className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-950/20 transition hover:bg-blue-700"
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
