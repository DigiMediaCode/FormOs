"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: ReactNode;
  pendingText: string;
  className?: string;
  disabled?: boolean;
  statusMessage?: string;
  showStatus?: boolean;
};

const defaultClassName =
  "rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60";

export function SubmitButton({
  children,
  pendingText,
  className = defaultClassName,
  disabled = false,
  statusMessage,
  showStatus = true,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <div className="flex flex-col gap-3">
      {pending && showStatus ? (
        <p className="rounded-md border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
          {statusMessage ?? pendingText}
        </p>
      ) : null}
      <button
        className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}
        disabled={disabled || pending}
        type="submit"
      >
        {pending ? pendingText : children}
      </button>
    </div>
  );
}
