import Link from "next/link";
import { PublicFormSubmitControls } from "@/components/forms/public-form-submit-controls";
import { SignaturePadField } from "@/components/forms/signature-pad-field";
import { getPublishedFormForPublicView, submitPublicForm } from "@/lib/forms/public-actions";
import { sanitizeFormHtml } from "@/lib/forms/sanitize-html";
import { isPublicField, type FormBuilderField } from "@/lib/forms/fields";

type PublicFormPageProps = {
  params: Promise<{
    formSlug: string;
  }>;
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

function renderInput(field: FormBuilderField) {
  const baseInputClass =
    "rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

  if (field.type === "textarea" || field.type === "address") {
    return (
      <textarea
        className={`${baseInputClass} min-h-28`}
        id={field.id}
        name={field.id}
        placeholder={field.placeholder}
      />
    );
  }

  if (field.type === "select") {
    return (
      <select className={baseInputClass} id={field.id} name={field.id}>
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
      <label className="flex items-center gap-3 rounded-md border border-slate-300 bg-white px-3 py-3 text-sm text-slate-700">
        <input className="h-4 w-4" id={field.id} name={field.id} type="checkbox" />
        {field.placeholder || field.label}
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
      className={baseInputClass}
      id={field.id}
      name={field.id}
      placeholder={field.placeholder}
      step={field.type === "currency" ? "0.01" : undefined}
      type={inputTypeByFieldType[field.type as keyof typeof inputTypeByFieldType] ?? "text"}
    />
  );
}

function renderField(
  field: FormBuilderField,
  uploadsAvailable: boolean,
  options: {
    firstSignatureFieldId: string | null;
  },
) {
  if (field.type === "section_heading") {
    return (
      <section className="border-b border-slate-200 pb-3" key={field.id}>
        <h2 className="text-2xl font-semibold text-slate-950">
          {field.content || field.label}
        </h2>
      </section>
    );
  }

  if (field.type === "static_text") {
    return (
      <p className="text-sm leading-6 text-slate-700" key={field.id}>
        {field.content || field.label}
      </p>
    );
  }

  if (field.type === "html") {
    return (
      <section
        className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-700"
        dangerouslySetInnerHTML={{ __html: sanitizeFormHtml(field.content) }}
        key={field.id}
      />
    );
  }

  if (field.type === "signature" || field.type === "initials") {
    const isFirstSignature =
      field.type === "signature" && field.id === options.firstSignatureFieldId;

    return (
      <SignaturePadField
        fieldId={field.id}
        firstSignatureFieldId={options.firstSignatureFieldId}
        isFirstSignature={isFirstSignature}
        key={field.id}
        label={field.label}
        required={field.required}
        variant={field.type}
      />
    );
  }

  if (field.type === "image_upload") {
    if (!uploadsAvailable) {
      return (
        <section className="rounded-md border border-amber-200 bg-amber-50 p-4" key={field.id}>
          <p className="text-sm font-medium text-slate-950">
            {field.label}
            {field.required ? <span className="ml-1 text-red-700">*</span> : null}
          </p>
          <p className="mt-2 text-sm leading-6 text-amber-900">
            File uploads are currently unavailable because the form owner has not connected Google Drive.
          </p>
          <p className="mt-2 text-xs leading-5 text-amber-900">
            Uploaded files are sent to the form owner&apos;s connected Google Drive. FormOS does not permanently store your uploaded files on its server.
          </p>
        </section>
      );
    }

    return (
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-800" key={field.id}>
        <span>
          {field.label}
          {field.required ? <span className="ml-1 text-red-700">*</span> : null}
        </span>
        <input
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-slate-950 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
          name={field.id}
          type="file"
        />
        <span className="text-xs font-normal leading-5 text-slate-600">
          JPG, PNG, WebP, and PDF files up to 10MB are accepted.
        </span>
        <span className="text-xs font-normal leading-5 text-slate-600">
          Uploaded files are sent to the form owner&apos;s connected Google Drive. FormOS does not permanently store your uploaded files on its server.
        </span>
      </label>
    );
  }

  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-800" key={field.id}>
      <span>
        {field.label}
        {field.required ? <span className="ml-1 text-red-700">*</span> : null}
      </span>
      {renderInput(field)}
    </label>
  );
}

export default async function PublicFormPage({
  params,
  searchParams,
}: PublicFormPageProps) {
  const { formSlug } = await params;
  const { error, success } = await searchParams;
  const form = await getPublishedFormForPublicView(formSlug);

  if (!form) {
    return (
      <main className="min-h-screen px-6 py-10">
        <section className="mx-auto max-w-2xl rounded-md border border-slate-200 bg-white p-8">
          <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
            FormOS
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">
            Form unavailable
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-700">
            This form is not available right now. It may be unpublished, archived,
            or no longer exist.
          </p>
          <Link className="mt-6 inline-flex text-sm font-medium text-teal-700 hover:text-teal-800" href="/">
            Back to FormOS
          </Link>
        </section>
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
    <main className="min-h-screen px-6 py-10">
      <section className="mx-auto max-w-3xl">
        <div className="border-b border-slate-200 pb-6">
          <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
            FormOS
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">
            {form.title}
          </h1>
          {form.description ? (
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
              {form.description}
            </p>
          ) : null}
        </div>

        {success ? (
          <p className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {success}
          </p>
        ) : null}

        {error ? (
          <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <form action={submitAction} className="mt-8 flex flex-col gap-6 rounded-md border border-slate-200 bg-white p-6">
          {publicFields.length > 0 ? (
            publicFields.map((field) =>
              renderField(field, form.uploadsAvailable, {
                firstSignatureFieldId,
              }),
            )
          ) : (
            <p className="text-sm leading-6 text-slate-700">
              This form does not have fields yet.
            </p>
          )}

          <PublicFormSubmitControls
            hasUploadFields={hasUploadFields}
            submitButtonText={submitButtonText}
          />
        </form>
      </section>
    </main>
  );
}
