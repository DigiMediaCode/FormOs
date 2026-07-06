import { StorageProvider } from "@prisma/client";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { GoogleAdSenseScript } from "@/components/ads/google-adsense-script";
import { PublicFormAdUnit } from "@/components/ads/public-form-ad-unit";
import {
  PublicFormClient,
  PublicFormDraftScript,
} from "@/components/forms/public-form-client";
import { PublicFormSecurity } from "@/components/forms/public-form-security";
import { PublicFormSubmitControls } from "@/components/forms/public-form-submit-controls";
import { SignatureCanvasBootstrapScript } from "@/components/forms/signature-canvas-bootstrap";
import { SignaturePadField } from "@/components/forms/signature-pad-field";
import { recordFormView } from "@/lib/forms/analytics";
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
  "w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100";

function RequiredMarker({ required }: { required: boolean }) {
  return required ? (
    <span className="ml-1 text-blue-700" aria-label="required">
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
        required={field.required}
      />
    );
  }

  if (field.type === "select") {
    return (
      <select className={inputClass} id={field.id} name={field.id} required={field.required}>
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
    if (field.options.length > 0) {
      return (
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-slate-900">
            {field.label}
            <RequiredMarker required={field.required} />
          </legend>
          <div className="grid gap-2">
            {field.options.map((option) => (
              <label
                className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-base text-slate-800 shadow-sm transition focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100"
                key={option}
              >
                <input
                  className="h-5 w-5 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                  name={field.id}
                  type="checkbox"
                  value={option}
                />
                <span className="leading-6">{option}</span>
              </label>
            ))}
          </div>
        </fieldset>
      );
    }

    return (
      <label
        className="flex min-h-14 items-start gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-base text-slate-800 shadow-sm transition focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100"
        htmlFor={field.id}
      >
        <input
          className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
          id={field.id}
          name={field.id}
          required={field.required}
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
      required={field.required}
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
            className="w-full text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700"
            name={field.id}
            required={field.required}
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

function isAdSafeField(field: FormBuilderField) {
  return [
    "text",
    "textarea",
    "date",
    "phone",
    "email",
    "address",
    "number",
    "currency",
    "select",
    "checkbox",
  ].includes(field.type);
}

export function renderFieldsWithAds(
  fields: FormBuilderField[],
  uploadsAvailable: boolean,
  options: {
    firstSignatureFieldId: string | null;
    uploadProvider: StorageProvider | null;
    publicAds: {
      enabled: boolean;
      adsenseClientId: string;
      publicFormAdSlot: string;
      publicFormAdFrequency: number;
      publicFormAdLabel: string;
    };
  },
) {
  let safeFieldCount = 0;
  let adsRendered = 0;
  const maxAds = 2;
  const frequency = Math.min(10, Math.max(3, options.publicAds.publicFormAdFrequency || 4));
  const output: ReactNode[] = [];

  fields.forEach((field, index) => {
    output.push(
      <div data-formos-field-id={field.id} key={field.id}>
        {renderField(field, uploadsAvailable, {
          firstSignatureFieldId: options.firstSignatureFieldId,
          uploadProvider: options.uploadProvider,
        })}
      </div>,
    );

    if (!options.publicAds.enabled || !isAdSafeField(field)) {
      return;
    }

    safeFieldCount += 1;

    if (
      safeFieldCount >= frequency &&
      adsRendered < maxAds &&
      index < fields.length - 2
    ) {
      output.push(
        <PublicFormAdUnit
          key={`ad-${field.id}-${adsRendered}`}
          settings={options.publicAds}
        />,
      );
      adsRendered += 1;
      safeFieldCount = 0;
    }
  });

  return output;
}

export function Message({
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

export function PoweredByFooter({
  branding,
}: {
  branding?: {
    publicFooterText: string;
    hidePoweredBy: boolean;
    primaryColor: string;
  } | null;
}) {
  const footerText = branding?.publicFooterText.trim();

  if (!footerText && branding?.hidePoweredBy) {
    return null;
  }

  return (
    <footer
      className="py-8 text-center text-xs font-medium uppercase tracking-wide text-slate-400"
      style={branding?.primaryColor ? { color: branding.primaryColor } : undefined}
    >
      {footerText || "Powered by FormOS"}
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
  const logoUrl = form?.branding?.logoUrl || getRenderablePlatformLogoUrl(platformSettings);

  if (!form) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
        <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium uppercase tracking-wide text-blue-700">
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

  await recordFormView({
    formId: form.id,
    ownerId: form.ownerId,
    context: {
      headers: await headers(),
      source: "PUBLIC",
    },
  });

  const submitAction = submitPublicForm.bind(null, form.id);
  const submitButtonText = form.settings?.submitButtonText?.trim() || "Submit";
  const publicFields = form.fields.filter(isPublicField);
  const requiredFields = publicFields
    .filter((field) => field.required)
    .map((field) => ({
      conditionalLogic: field.conditionalLogic,
      id: field.id,
      label: field.label,
      type: field.type,
    }));
  const conditionalFields = publicFields.map((field) => ({
    conditionalLogic: field.conditionalLogic,
    id: field.id,
    type: field.type,
  }));
  const hasUploadFields = publicFields.some((field) => field.type === "image_upload");
  const firstSignatureFieldId =
    publicFields.find((field) => field.type === "signature")?.id ?? null;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      <GoogleAdSenseScript
        adsEnabled={form.publicAds.enabled}
        clientId={form.publicAds.adsenseClientId}
      />
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
            <p className="text-sm font-medium uppercase tracking-wide text-blue-700">
              {platformSettings.siteName}
            </p>
          )}
        </div>

        <PublicFormDraftScript clearDraft={Boolean(success)} formId={form.id} />
        <SignatureCanvasBootstrapScript />

        <header
          className="overflow-hidden rounded-2xl border border-t-4 border-slate-200 bg-white shadow-sm"
          style={
            form.branding?.primaryColor
              ? { borderTopColor: form.branding.primaryColor }
              : undefined
          }
        >
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

        <PublicFormClient
          action={submitAction}
          clearDraft={Boolean(success)}
          conditionalFields={conditionalFields}
          formId={form.id}
          requiredFields={requiredFields}
        >
          {publicFields.length > 0 ? (
            renderFieldsWithAds(publicFields, form.uploadsAvailable, {
                firstSignatureFieldId,
                uploadProvider: form.uploadProvider,
                publicAds: form.publicAds,
              })
          ) : (
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm leading-6 text-slate-700">
                This form does not have fields yet.
              </p>
            </section>
          )}

          <PublicFormSecurity formId={form.id} turnstile={form.security} />

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <PublicFormSubmitControls
              hasUploadFields={hasUploadFields}
              submitButtonText={submitButtonText}
            />
          </section>
        </PublicFormClient>
      </section>
      <PoweredByFooter branding={form.branding} />
    </main>
  );
}
