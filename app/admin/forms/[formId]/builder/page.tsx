import Link from "next/link";
import { updateAdminFormFieldsAction } from "@/app/admin/forms/actions";
import { FormBuilderEditor } from "@/components/builder/form-builder-editor";
import { GoogleDriveUploadWarning } from "@/components/forms/google-drive-upload-warning";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { normalizeFormFields } from "@/lib/forms/fields";
import { getResolvedUploadProvider } from "@/lib/integrations/upload-settings";
import {
  disallowedFieldTypeLabels,
  getUserEffectiveLimits,
} from "@/lib/plans/limits";
import { prisma } from "@/lib/prisma";

type AdminSupportBuilderPageProps = {
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

export default async function AdminSupportBuilderPage({
  params,
  searchParams,
}: AdminSupportBuilderPageProps) {
  await requireSuperAdmin();

  const { formId } = await params;
  const { error, success } = await searchParams;
  const form = await prisma.form.findUnique({
    where: { id: formId },
    select: {
      id: true,
      ownerId: true,
      title: true,
      status: true,
      version: true,
      fields: true,
      owner: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  });

  if (!form) {
    return (
      <main className="px-6 py-10">
        <div className="mx-auto max-w-4xl rounded-md border border-red-200 bg-red-50 p-6 text-red-800">
          Form not found.
        </div>
      </main>
    );
  }

  const fields = normalizeFormFields(form.fields);
  const saveAction = updateAdminFormFieldsAction.bind(null, form.id);
  const hasUploadFields = fields.some((field) => field.type === "image_upload");
  const [uploadProvider, limits] = await Promise.all([
    getResolvedUploadProvider(form.ownerId),
    getUserEffectiveLimits(form.ownerId),
  ]);
  const disallowedLabels = disallowedFieldTypeLabels(limits, fields);

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="rounded-lg border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-amber-800">
                Super Admin Support Builder
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-950">
                {form.title}
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Editing as Super Admin support for owner{" "}
                <span className="font-medium">{form.owner.name || form.owner.email}</span>.
                Changes still use the owner&apos;s plan limits and field validation.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className={`rounded-md border px-2 py-1 text-xs font-medium ${statusBadgeClass(form.status)}`}>
                  {form.status}
                </span>
                <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700">
                  Version {form.version}
                </span>
                <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700">
                  {fields.length} fields
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
                href={`/admin/forms/${form.id}`}
              >
                Back to Admin Form View
              </Link>
              <Link
                className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                href={`/f/${form.id}`}
                target="_blank"
              >
                Preview Public Form
              </Link>
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

        {hasUploadFields && !uploadProvider.uploadsAvailable ? (
          <GoogleDriveUploadWarning />
        ) : null}

        {disallowedLabels.length > 0 ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            This form contains field types that are not included in the owner&apos;s
            current plan. Remove them or update the owner&apos;s plan before saving.
            Disallowed field types: {disallowedLabels.join(", ")}.
          </p>
        ) : null}

        <FormBuilderEditor
          formId={form.id}
          initialFields={fields}
          allowedFieldTypes={limits.allowedFieldTypes}
          saveAction={saveAction}
        />
      </div>
    </main>
  );
}
