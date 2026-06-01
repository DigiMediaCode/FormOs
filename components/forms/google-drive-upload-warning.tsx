import Link from "next/link";

export function GoogleDriveUploadWarning() {
  return (
    <section className="rounded-md border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-medium text-amber-950">
        This form contains file upload fields, but no active storage provider is configured. Public users will not be able to upload files until Google Drive or Dropbox is connected and selected.
      </p>
      <Link
        className="mt-3 inline-flex text-sm font-medium text-amber-950 underline-offset-4 hover:underline"
        href="/dashboard/settings/integrations"
      >
        Go to Settings / Integrations
      </Link>
    </section>
  );
}
