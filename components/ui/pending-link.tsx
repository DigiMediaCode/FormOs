"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";

type PendingLinkProps = {
  href: string;
  children: ReactNode;
  pendingText: string;
  className?: string;
  statusMessage?: string;
  resetAfterMs?: number;
};

const defaultClassName =
  "rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800";

export function PendingLink({
  href,
  children,
  pendingText,
  className = defaultClassName,
  statusMessage,
  resetAfterMs,
}: PendingLinkProps) {
  const [pending, setPending] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      {pending ? (
        <p className="rounded-md border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
          {statusMessage ?? pendingText}
        </p>
      ) : null}
      <Link
        aria-disabled={pending}
        className={`${className} ${pending ? "pointer-events-none cursor-not-allowed opacity-60" : ""}`}
        href={href}
        onClick={(event) => {
          if (pending) {
            event.preventDefault();
            return;
          }

          setPending(true);

          if (resetAfterMs) {
            window.setTimeout(() => setPending(false), resetAfterMs);
          }
        }}
      >
        {pending ? pendingText : children}
      </Link>
    </div>
  );
}
