"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

type ConfirmSubmitButtonProps = {
  children: ReactNode;
  confirmMessage: string;
  pendingText: string;
  className?: string;
  disabled?: boolean;
};

export function ConfirmSubmitButton({
  children,
  className = "rounded-md border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60",
  confirmMessage,
  disabled = false,
  pendingText,
}: ConfirmSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      className={className}
      disabled={disabled || pending}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
      type="submit"
    >
      {pending ? pendingText : children}
    </button>
  );
}
