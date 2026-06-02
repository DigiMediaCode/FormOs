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
    <div className="flex flex-col gap-4">
      {pending && hasUploadFields ? (
        <p className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900">
          Please wait. Your files are uploading.
        </p>
      ) : null}
      <button
        className="w-full rounded-lg bg-blue-600 px-5 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-fit sm:min-w-44"
        disabled={pending}
        type="submit"
      >
        {pending ? "Submitting..." : submitButtonText}
      </button>
    </div>
  );
}
