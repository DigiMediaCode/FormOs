"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, X } from "lucide-react";

type RestorePlanModalProps = {
  billingHref: string;
  cookieName: string;
  planName: string;
  restoreUntilLabel: string;
};

export function RestorePlanModal({
  billingHref,
  cookieName,
  planName,
  restoreUntilLabel,
}: RestorePlanModalProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return null;
  }

  function dismiss() {
    document.cookie = `${cookieName}=; Max-Age=0; path=/`;
    setIsOpen(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm">
      <section className="relative w-full max-w-md rounded-3xl border border-amber-200 bg-white p-6 shadow-2xl shadow-slate-950/20">
        <button
          aria-label="Close restore plan message"
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
          onClick={dismiss}
          type="button"
        >
          <X className="h-5 w-5" />
        </button>
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <AlertTriangle className="h-6 w-6" />
        </span>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
          Payment needs attention
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
          Restore your {planName}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          We could not collect your latest payment, so paid features are locked
          to Free plan limits for now. Your forms and submissions are still safe.
        </p>
        <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          Update your billing details by <strong>{restoreUntilLabel}</strong> to
          restore your paid plan.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            className="inline-flex justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-950/20 transition hover:bg-blue-700"
            href={billingHref}
            onClick={dismiss}
          >
            Restore plan
          </Link>
          <button
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            onClick={dismiss}
            type="button"
          >
            Not now
          </button>
        </div>
      </section>
    </div>
  );
}
