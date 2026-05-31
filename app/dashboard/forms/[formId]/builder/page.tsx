import Link from "next/link";
import { FormBuilderEditor } from "@/components/builder/form-builder-editor";
import { GoogleDriveUploadWarning } from "@/components/forms/google-drive-upload-warning";
import { getUserFormById, updateFormFields } from "@/lib/forms/actions";
import { normalizeFormFields } from "@/lib/forms/fields";
import { hasGoogleDriveIntegration } from "@/lib/integrations/google-drive/client";

type BuilderPageProps = {
  params: Promise<{
    formId: string;
  }>;
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function BuilderPage({
  params,
  searchParams,
}: BuilderPageProps) {
  const { formId } = await params;
  const { error, success } = await searchParams;
  const form = await getUserFormById(formId);
  const fields = normalizeFormFields(form.fields);
  const saveAction = updateFormFields.bind(null, form.id);
  const hasUploadFields = fields.some((field) => field.type === "image_upload");
  const googleDriveConnected = await hasGoogleDriveIntegration(form.ownerId);

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="border-b border-slate-200 pb-6">
          <div className="flex flex-wrap gap-3">
            <Link className="text-sm font-medium text-teal-700 hover:text-teal-800" href={`/dashboard/forms/${form.id}`}>
              Back to form
            </Link>
            <Link className="text-sm font-medium text-teal-700 hover:text-teal-800" href={`/f/${form.id}`}>
              Preview public link
            </Link>
          </div>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
                Builder
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-950">
                {form.title}
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Status: {form.status} · Version {form.version}
              </p>
            </div>
          </div>
        </header>

        {success ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {success}
          </p>
        ) : null}

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        {hasUploadFields && !googleDriveConnected ? (
          <GoogleDriveUploadWarning />
        ) : null}

        <FormBuilderEditor
          formId={form.id}
          initialFields={fields}
          saveAction={saveAction}
        />
      </div>
    </main>
  );
}
