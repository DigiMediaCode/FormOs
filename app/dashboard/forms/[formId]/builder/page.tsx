import Link from "next/link";
import { FormBuilderEditor } from "@/components/builder/form-builder-editor";
import { GoogleDriveUploadWarning } from "@/components/forms/google-drive-upload-warning";
import { getUserFormById, updateFormFields } from "@/lib/forms/actions";
import { normalizeFormFields } from "@/lib/forms/fields";
import { getResolvedUploadProvider } from "@/lib/integrations/upload-settings";
import {
  disallowedFieldTypeLabels,
  getUserEffectiveLimits,
} from "@/lib/plans/limits";
import { requireWorkspaceAdminOrOwner } from "@/lib/workspaces/access";

type BuilderPageProps = {
  params: Promise<{
    formId: string;
  }>;
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

function statusBadgeClass(status: string) {
  if (status === "PUBLISHED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (status === "ARCHIVED") {
    return "border-slate-200 bg-slate-100 text-slate-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-800";
}

export default async function BuilderPage({
  params,
  searchParams,
}: BuilderPageProps) {
  const { formId } = await params;
  const { error, success } = await searchParams;
  await requireWorkspaceAdminOrOwner();
  const form = await getUserFormById(formId);
  const fields = normalizeFormFields(form.fields);
  const saveAction = updateFormFields.bind(null, form.id);
  const hasUploadFields = fields.some((field) => field.type === "image_upload");
  const [uploadProvider, limits] = await Promise.all([
    getResolvedUploadProvider(form.ownerId),
    getUserEffectiveLimits(form.ownerId),
  ]);
  const disallowedLabels = disallowedFieldTypeLabels(limits, fields);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-[96rem] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            <Link href="/dashboard">
              <img
                alt="FormOS"
                className="h-auto max-w-[108px] object-contain"
                src="/formos-logo.png"
              />
            </Link>
            <div className="hidden h-8 w-px bg-slate-200 sm:block" />
            <Link
              className="text-sm font-semibold text-slate-500 transition hover:text-slate-950"
              href={`/dashboard/forms/${form.id}`}
            >
              Back to form
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-slate-950">
                {form.title}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className={`rounded-md border px-2 py-1 text-xs font-medium ${statusBadgeClass(form.status)}`}>
                  {form.status}
                </span>
                <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700">
                  Version {form.version}
                </span>
                <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700">
                  {fields.length} fields
                </span>
              </div>
            </div>
          </div>
          <Link
            className="w-fit rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            href={`/f/${form.id}`}
            target="_blank"
          >
            Preview Public Form
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-[96rem] flex-col">
        {success ? (
          <p className="mx-5 mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {success}
          </p>
        ) : null}

        {error ? (
          <p className="mx-5 mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        {hasUploadFields && !uploadProvider.uploadsAvailable ? (
          <div className="mx-5 mt-5">
            <GoogleDriveUploadWarning />
          </div>
        ) : null}

        {disallowedLabels.length > 0 ? (
          <p className="mx-5 mt-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            This form contains field types that are not included in your current
            plan. Remove them or upgrade your plan. Disallowed field types:{" "}
            {disallowedLabels.join(", ")}.
          </p>
        ) : null}

        <FormBuilderEditor
          formId={form.id}
          initialFields={fields}
          allowedFieldTypes={limits.allowedFieldTypes}
          allowConditionalLogic={limits.allowConditionalLogic}
          maxConditionalRules={limits.maxConditionalRules}
          saveAction={saveAction}
        />
      </div>
    </main>
  );
}
