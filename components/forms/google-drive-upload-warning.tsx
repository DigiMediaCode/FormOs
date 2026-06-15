import Link from "next/link";

export function GoogleDriveUploadWarning() {
  return (
    <section className="rounded-md border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-medium text-amber-950">
        This form collects files. Connect Google Drive or Dropbox before sharing it.
      </p>
      <p className="mt-1 text-sm leading-6 text-amber-900">
        Public users will not be able to upload files until a storage provider is
        connected and selected.
      </p>
      <Link
        className="mt-3 inline-flex text-sm font-medium text-amber-950 underline-offset-4 hover:underline"
        href="/dashboard/settings/integrations"
      >
        Connect storage
      </Link>
    </section>
  );
}
