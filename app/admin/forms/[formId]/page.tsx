import { FormStatus } from "@prisma/client";
import Link from "next/link";
import {
  archiveAdminFormAction,
  deleteAdminFormAction,
} from "@/app/admin/forms/actions";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { getAppUrl } from "@/lib/app-url";
import {
  DISPLAY_ONLY_FIELD_TYPES,
  fieldTypeLabel,
  isOfficeField,
  isPublicField,
  normalizeFormFields,
  type FormBuilderField,
} from "@/lib/forms/fields";
import { sanitizeFormHtml } from "@/lib/forms/sanitize-html";
import { getResolvedUploadProvider, uploadProviderLabel } from "@/lib/integrations/upload-settings";
import { getUserPlan } from "@/lib/plans/limits";
import { prisma } from "@/lib/prisma";

type AdminFormDetailPageProps = {
  params: Promise<{
    formId: string;
  }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusLabel(status: string) {
  if (status === "PUBLISHED") {
    return "Published";
  }

  if (status === "ARCHIVED") {
    return "Archived";
  }

  return "Draft";
}

function badgeClass(kind: "required" | "office" | "public" | "display") {
  const classes = {
    required: "border-red-200 bg-red-50 text-red-700",
    office: "border-violet-200 bg-violet-50 text-violet-700",
    public: "border-emerald-200 bg-emerald-50 text-emerald-700",
    display: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return `rounded-full border px-2 py-1 text-xs font-medium ${classes[kind]}`;
}

function contentPreview(field: FormBuilderField) {
  const source = field.type === "section_heading"
    ? field.label || field.content
    : field.content || field.label;
  const plain = source.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

  if (!plain) {
    return "No content";
  }

  return plain.length > 140 ? `${plain.slice(0, 140)}...` : plain;
}

function FieldStructureRow({ field }: { field: FormBuilderField }) {
  const isDisplayOnly = DISPLAY_ONLY_FIELD_TYPES.includes(field.type);

  return (
    <li className="rounded-md border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-950 px-2 py-1 text-xs font-semibold text-white">
              #{field.order}
            </span>
            <h4 className="text-base font-semibold text-slate-950">
              {field.label || fieldTypeLabel(field.type)}
            </h4>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            {fieldTypeLabel(field.type)}
            {field.type === "select" ? ` • ${field.options.length} options` : ""}
          </p>
          {isDisplayOnly ? (
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {contentPreview(field)}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {field.required ? <span className={badgeClass("required")}>Required</span> : null}
          <span className={badgeClass(isOfficeField(field) ? "office" : "public")}>
            {isOfficeField(field) ? "Office Use Only" : "Public"}
          </span>
          {isDisplayOnly ? <span className={badgeClass("display")}>Display Only</span> : null}
        </div>
      </div>
    </li>
  );
}

function PreviewField({ field }: { field: FormBuilderField }) {
  const label = field.label || fieldTypeLabel(field.type);

  if (field.type === "section_heading") {
    return (
      <div className="border-b border-slate-200 pb-2">
        <h4 className="text-lg font-semibold text-slate-950">{label || field.content}</h4>
      </div>
    );
  }

  if (field.type === "static_text") {
    return <p className="text-sm leading-6 text-slate-700">{field.content}</p>;
  }

  if (field.type === "html") {
    return (
      <div
        className="prose prose-sm max-w-none text-slate-700"
        dangerouslySetInnerHTML={{ __html: sanitizeFormHtml(field.content) }}
      />
    );
  }

  if (field.type === "checkbox") {
    if (field.options.length > 0) {
      return (
        <div className="rounded-md border border-slate-200 bg-white p-3">
          <p className="text-sm font-medium text-slate-800">
            {label}
            {field.required ? <span className="text-red-600"> *</span> : null}
          </p>
          <div className="mt-3 grid gap-2">
            {field.options.map((option) => (
              <div className="flex items-center gap-2 text-sm text-slate-700" key={option}>
                <span className="h-4 w-4 rounded border border-slate-300 bg-slate-50" />
                {option}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-start gap-3 rounded-md border border-slate-200 bg-white p-3">
        <span className="mt-0.5 h-4 w-4 rounded border border-slate-300 bg-slate-50" />
        <p className="text-sm font-medium text-slate-800">
          {label}
          {field.required ? <span className="text-red-600"> *</span> : null}
        </p>
      </div>
    );
  }

  if (field.type === "signature" || field.type === "initials") {
    return (
      <div>
        <p className="text-sm font-medium text-slate-800">
          {label}
          {field.required ? <span className="text-red-600"> *</span> : null}
        </p>
        <div className="mt-2 flex h-28 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
          {field.type === "signature" ? "Signature placeholder" : "Initials placeholder"}
        </div>
      </div>
    );
  }

  if (field.type === "image_upload") {
    return (
      <div>
        <p className="text-sm font-medium text-slate-800">
          {label}
          {field.required ? <span className="text-red-600"> *</span> : null}
        </p>
        <div className="mt-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          File upload placeholder
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-medium text-slate-800">
        {label}
        {field.required ? <span className="text-red-600"> *</span> : null}
      </p>
      <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
        {field.type === "select"
          ? field.options[0] || "Dropdown option"
          : field.placeholder || `${fieldTypeLabel(field.type)} input`}
      </div>
    </div>
  );
}

export default async function AdminFormDetailPage({
  params,
}: AdminFormDetailPageProps) {
  await requireSuperAdmin();
  const { formId } = await params;
  const form = await prisma.form.findUnique({
    where: { id: formId },
    select: {
      id: true,
      ownerId: true,
      title: true,
      slug: true,
      description: true,
      status: true,
      mode: true,
      version: true,
      fields: true,
      createdAt: true,
      updatedAt: true,
      owner: {
        select: {
          email: true,
          name: true,
          businessProfile: {
            select: {
              companyName: true,
              billingName: true,
              country: true,
            },
          },
        },
      },
      _count: {
        select: {
          submissions: true,
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
  const publicFields = fields.filter(isPublicField);
  const [ownerPlan, uploadProvider] = await Promise.all([
    getUserPlan(form.ownerId),
    getResolvedUploadProvider(form.ownerId),
  ]);
  const publicFormUrl = `${getAppUrl()}/f/${form.id}`;
  const storageLabel = uploadProvider.uploadsAvailable
    ? uploadProviderLabel(uploadProvider.activeProvider)
    : "No active storage provider";

  return (
    <main className="px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="border-b border-slate-200 pb-6">
          <Link className="text-sm font-medium text-blue-700 hover:text-blue-800" href="/admin/forms">
            Forms
          </Link>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-slate-950">{form.title}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                {form.description || "No description set."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
                href={`/admin/forms/${form.id}/builder`}
              >
                Open Builder as Support
              </Link>
              {form.status === FormStatus.PUBLISHED ? (
                <Link
                  className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                  href={`/f/${form.id}`}
                  target="_blank"
                >
                  Open Public Form
                </Link>
              ) : null}
            </div>
          </div>
        </header>

        <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-6">
          <h3 className="text-xl font-semibold text-slate-950">Form Summary</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div><p className="text-sm text-slate-500">Status</p><p className="font-medium text-slate-950">{statusLabel(form.status)}</p></div>
            <div><p className="text-sm text-slate-500">Mode</p><p className="font-medium text-slate-950">{form.mode}</p></div>
            <div><p className="text-sm text-slate-500">Version</p><p className="font-medium text-slate-950">v{form.version}</p></div>
            <div><p className="text-sm text-slate-500">Fields</p><p className="font-medium text-slate-950">{fields.length}</p></div>
            <div><p className="text-sm text-slate-500">Submissions</p><p className="font-medium text-slate-950">{form._count.submissions}</p></div>
            <div><p className="text-sm text-slate-500">Created</p><p className="font-medium text-slate-950">{formatDate(form.createdAt)}</p></div>
            <div><p className="text-sm text-slate-500">Updated</p><p className="font-medium text-slate-950">{formatDate(form.updatedAt)}</p></div>
          </div>
          {form.status === FormStatus.PUBLISHED ? (
            <div className="rounded-md border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-950">Public Form Link</p>
              <p className="mt-2 break-all text-sm text-blue-800">{publicFormUrl}</p>
            </div>
          ) : null}
        </section>

        <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-6">
          <h3 className="text-xl font-semibold text-slate-950">Owner Context</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div><p className="text-sm text-slate-500">Owner</p><p className="font-medium text-slate-950">{form.owner.name || "No name"}</p></div>
            <div><p className="text-sm text-slate-500">Email</p><p className="font-medium text-slate-950">{form.owner.email}</p></div>
            <div><p className="text-sm text-slate-500">Plan</p><p className="font-medium text-slate-950">{ownerPlan.name}</p></div>
            <div><p className="text-sm text-slate-500">Storage</p><p className="font-medium text-slate-950">{storageLabel}</p></div>
            <div><p className="text-sm text-slate-500">Business</p><p className="font-medium text-slate-950">{form.owner.businessProfile?.companyName || form.owner.businessProfile?.billingName || "Not set"}</p></div>
            <div><p className="text-sm text-slate-500">Country</p><p className="font-medium text-slate-950">{form.owner.businessProfile?.country || "Not set"}</p></div>
          </div>
        </section>

        <section className="grid gap-4 rounded-md border border-slate-200 bg-slate-50 p-6">
          <h3 className="text-xl font-semibold text-slate-950">Field Structure</h3>
          {fields.length > 0 ? (
            <ol className="grid gap-3">
              {fields.map((field) => (
                <FieldStructureRow field={field} key={field.id} />
              ))}
            </ol>
          ) : (
            <p className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600">
              This form has no fields yet.
            </p>
          )}
        </section>

        <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-6">
          <div>
            <h3 className="text-xl font-semibold text-slate-950">Safe Public Preview</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This preview renders public form structure only. It cannot submit,
              upload files, or create submissions. Office-only fields are hidden.
            </p>
          </div>
          <div className="mx-auto w-full max-w-3xl rounded-xl border border-slate-200 bg-slate-50 p-6">
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h4 className="text-2xl font-semibold text-slate-950">{form.title}</h4>
              {form.description ? (
                <p className="mt-2 text-sm leading-6 text-slate-600">{form.description}</p>
              ) : null}
              <div className="mt-6 grid gap-5">
                {publicFields.length > 0 ? (
                  publicFields.map((field) => (
                    <PreviewField field={field} key={field.id} />
                  ))
                ) : (
                  <p className="text-sm text-slate-600">No public fields to preview.</p>
                )}
              </div>
              <div className="mt-8 rounded-md bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white opacity-70">
                Submit button preview
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-6">
          <h3 className="text-xl font-semibold text-slate-950">Admin Actions</h3>
          <div className="flex flex-wrap gap-3">
            <form action={archiveAdminFormAction.bind(null, form.id)}>
              <SubmitButton
                className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
                pendingText="Archiving form..."
              >
                Archive Form
              </SubmitButton>
            </form>
            <form action={deleteAdminFormAction.bind(null, form.id)}>
              <ConfirmSubmitButton
                confirmMessage="Delete this form? Forms with submissions are blocked and should be archived."
                disabled={form._count.submissions > 0}
                pendingText="Deleting form..."
              >
                Delete Form
              </ConfirmSubmitButton>
              {form._count.submissions > 0 ? (
                <p className="mt-2 max-w-sm text-xs leading-5 text-slate-500">
                  This form has submissions and cannot be deleted safely. Archive it instead.
                </p>
              ) : null}
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
