"use client";

import { useFormStatus } from "react-dom";

type PublicFormSubmitControlsProps = {
  hasUploadFields: boolean;
  submitButtonText: string;
};

export function PublicFormSubmitControls({
  hasUploadFields,
  submitButtonText,
}: PublicFormSubmitControlsProps) {
  const { pending } = useFormStatus();

  return (
    <div className="flex flex-col gap-3">
      {pending && hasUploadFields ? (
        <p className="rounded-md border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
          Please wait. Your files are uploading.
        </p>
      ) : null}
      <button
        className="w-fit rounded-md bg-slate-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={pending}
        type="submit"
      >
        {pending ? "Submitting..." : submitButtonText}
      </button>
    </div>
  );
}
