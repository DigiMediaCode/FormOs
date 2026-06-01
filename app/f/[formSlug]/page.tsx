import { StorageProvider } from "@prisma/client";
import type { ReactNode } from "react";
import { PublicFormSubmitControls } from "@/components/forms/public-form-submit-controls";
import { SignaturePadField } from "@/components/forms/signature-pad-field";
import { isPublicField, type FormBuilderField } from "@/lib/forms/fields";
import { getPublishedFormForPublicView, submitPublicForm } from "@/lib/forms/public-actions";
import { sanitizeFormHtml } from "@/lib/forms/sanitize-html";
import { uploadProviderLabel } from "@/lib/integrations/upload-settings";
import {
  getPlatformSettings,
  getRenderablePlatformLogoUrl,
} from "@/lib/platform/settings";

type PublicFormPageProps = {
  params: Promise<{
    formSlug: string;
  }>;
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-100";

function RequiredMarker({ required }: { required: boolean }) {
  return required ? (
    <span className="ml-1 text-teal-700" aria-label="required">
      *
    </span>
  ) : null;
}

function FieldLabel({ field }: { field: FormBuilderField }) {
  return (
    <label className="text-sm font-semibold text-slate-900" htmlFor={field.id}>
      {field.label}
      <RequiredMarker required={field.required} />
    </label>
  );
}

function FieldShell({
  children,
  field,
}: {
  children: ReactNode;
  field: FormBuilderField;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3">
        <FieldLabel field={field} />
        {children}
      </div>
    </section>
  );
}

function renderInput(field: FormBuilderField) {
  if (field.type === "textarea" || field.type === "address") {
    return (
      <textarea
        className={`${inputClass} min-h-32 resize-y`}
        id={field.id}
        name={field.id}
        placeholder={field.placeholder}
      />
    );
  }

  if (field.type === "select") {
    return (
      <select className={inputClass} id={field.id} name={field.id}>
        <option value="">{field.placeholder || "Choose an option"}</option>
        {field.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "checkbox") {
    return (
      <label
        className="flex min-h-14 items-start gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-base text-slate-800 shadow-sm transition focus-within:border-teal-600 focus-within:ring-4 focus-within:ring-teal-100"
        htmlFor={field.id}
      >
        <input
          className="mt-1 h-5 w-5 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
          id={field.id}
          name={field.id}
          type="checkbox"
        />
        <span className="leading-6">
          {field.placeholder || field.label}
          <RequiredMarker required={field.required} />
        </span>
      </label>
    );
  }

  const inputTypeByFieldType = {
    currency: "number",
    date: "date",
    email: "email",
    number: "number",
    phone: "tel",
    text: "text",
  } as const;

  return (
    <input
      className={inputClass}
      id={field.id}
      name={field.id}
      placeholder={field.placeholder}
      step={field.type === "currency" ? "0.01" : undefined}
      type={inputTypeByFieldType[field.type as keyof typeof inputTypeByFieldType] ?? "text"}
    />
  );
}

function UploadDisclaimer({ provider }: { provider: StorageProvider | null }) {
  return (
    <p className="text-sm leading-6 text-slate-600">
      Uploaded files are sent to the form owner&apos;s connected{" "}
      {uploadProviderLabel(provider)}. FormOS does not permanently store your
      uploaded files on its server.
    </p>
  );
}

function renderField(
  field: FormBuilderField,
  uploadsAvailable: boolean,
  options: {
    firstSignatureFieldId: string | null;
    uploadProvider: StorageProvider | null;
  },
) {
  if (field.type === "section_heading") {
    return (
      <section className="pt-4" key={field.id}>
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            {field.content || field.label}
          </h2>
        </div>
      </section>
    );
  }

  if (field.type === "static_text") {
    return (
      <section className="rounded-xl border border-slate-200 bg-slate-50 p-5" key={field.id}>
        <p className="whitespace-pre-wrap text-base leading-7 text-slate-700">
          {field.content || field.label}
        </p>
      </section>
    );
  }

  if (field.type === "html") {
    return (
      <section
        className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-5 text-base leading-7 text-slate-700 [&_li]:my-1 [&_p]:my-3 [&_table]:text-sm"
        dangerouslySetInnerHTML={{ __html: sanitizeFormHtml(field.content) }}
        key={field.id}
      />
    );
  }

  if (field.type === "signature" || field.type === "initials") {
    const isFirstSignature =
      field.type === "signature" && field.id === options.firstSignatureFieldId;

    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" key={field.id}>
        <SignaturePadField
          fieldId={field.id}
          firstSignatureFieldId={options.firstSignatureFieldId}
          isFirstSignature={isFirstSignature}
          label={field.label}
          required={field.required}
          variant={field.type}
        />
      </section>
    );
  }

  if (field.type === "image_upload") {
    if (!uploadsAvailable) {
      return (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm" key={field.id}>
          <p className="text-sm font-semibold text-slate-950">
            {field.label}
            <RequiredMarker required={field.required} />
          </p>
          <p className="mt-3 text-sm leading-6 text-amber-900">
            File uploads are currently unavailable because the form owner has not
            connected or selected an upload storage provider.
          </p>
          <div className="mt-3">
            <UploadDisclaimer provider={options.uploadProvider} />
          </div>
        </section>
      );
    }

    return (
      <FieldShell field={field} key={field.id}>
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
          <input
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="w-full text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-slate-950 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
            name={field.id}
            type="file"
          />
        </div>
        <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm leading-6 text-slate-700">
            Allowed file types: JPG, PNG, WebP, and PDF. Maximum size: 10MB.
          </p>
          <UploadDisclaimer provider={options.uploadProvider} />
        </div>
      </FieldShell>
    );
  }

  if (field.type === "checkbox") {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" key={field.id}>
        {renderInput(field)}
      </section>
    );
  }

  return (
    <FieldShell field={field} key={field.id}>
      {renderInput(field)}
    </FieldShell>
  );
}

function Message({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "success" | "error";
}) {
  const classes =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : "border-red-200 bg-red-50 text-red-900";

  return (
    <p className={`rounded-xl border px-5 py-4 text-sm leading-6 shadow-sm ${classes}`}>
      {children}
    </p>
  );
}

function PoweredByFooter() {
  return (
    <footer className="py-8 text-center text-xs font-medium uppercase tracking-wide text-slate-400">
      Powered by FormOS
    </footer>
  );
}

export default async function PublicFormPage({
  params,
  searchParams,
}: PublicFormPageProps) {
  const { formSlug } = await params;
  const { error, success } = await searchParams;
  const [form, platformSettings] = await Promise.all([
    getPublishedFormForPublicView(formSlug),
    getPlatformSettings(),
  ]);
  const logoUrl = getRenderablePlatformLogoUrl(platformSettings);

  if (!form) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
        <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
            FormOS
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
            This form is currently unavailable.
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Please contact the form owner if you believe this is unexpected.
          </p>
        </section>
        <PoweredByFooter />
      </main>
    );
  }

  const submitAction = submitPublicForm.bind(null, form.id);
  const submitButtonText = form.settings?.submitButtonText?.trim() || "Submit";
  const publicFields = form.fields.filter(isPublicField);
  const hasUploadFields = publicFields.some((field) => field.type === "image_upload");
  const firstSignatureFieldId =
    publicFields.find((field) => field.type === "signature")?.id ?? null;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      <section className="mx-auto max-w-3xl">
        <div className="mb-6 flex justify-center">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={platformSettings.siteName}
              className="h-auto max-w-[150px] object-contain sm:max-w-[170px]"
              src={logoUrl}
            />
          ) : (
            <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
              {platformSettings.siteName}
            </p>
          )}
        </div>

        <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-gradient-to-b from-white to-slate-50 px-6 py-8 text-center sm:px-8">
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {form.title}
            </h1>
            {form.description ? (
              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-700">
                {form.description}
              </p>
            ) : null}
          </div>
        </header>

        <div className="mt-6 flex flex-col gap-4">
          {success ? <Message tone="success">{success}</Message> : null}
          {error ? <Message tone="error">{error}</Message> : null}
        </div>

        <form action={submitAction} className="mt-6 flex flex-col gap-5">
          {publicFields.length > 0 ? (
            publicFields.map((field) =>
              renderField(field, form.uploadsAvailable, {
                firstSignatureFieldId,
                uploadProvider: form.uploadProvider,
              }),
            )
          ) : (
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm leading-6 text-slate-700">
                This form does not have fields yet.
              </p>
            </section>
          )}

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <PublicFormSubmitControls
              hasUploadFields={hasUploadFields}
              submitButtonText={submitButtonText}
            />
          </section>
        </form>
      </section>
      <PoweredByFooter />
    </main>
  );
}
