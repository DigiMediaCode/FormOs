import { GoogleAdSenseScript } from "@/components/ads/google-adsense-script";
import { headers } from "next/headers";
import { EmbedHeightScript } from "@/components/forms/embed-height-script";
import {
  PublicFormClient,
  PublicFormDraftScript,
} from "@/components/forms/public-form-client";
import { PublicFormSubmitControls } from "@/components/forms/public-form-submit-controls";
import { SignatureCanvasBootstrapScript } from "@/components/forms/signature-canvas-bootstrap";
import {
  Message,
  PoweredByFooter,
  renderFieldsWithAds,
} from "@/app/f/[formSlug]/page";
import { isPublicField } from "@/lib/forms/fields";
import { embedThemeCss, getEmbedTheme } from "@/lib/forms/embed-theme";
import { recordFormView } from "@/lib/forms/analytics";
import {
  getEmbeddedFormForPublicView,
  submitEmbeddedForm,
} from "@/lib/forms/public-actions";

type EmbedFormPageProps = {
  params: Promise<{
    formId: string;
  }>;
  searchParams: Promise<{
    accent?: string;
    bg?: string;
    border?: string;
    compact?: string;
    error?: string;
    font?: string;
    radius?: string;
    surface?: string;
    success?: string;
    source?: string;
    text?: string;
    theme?: string;
  }>;
};

export default async function EmbedFormPage({
  params,
  searchParams,
}: EmbedFormPageProps) {
  const { formId } = await params;
  const search = await searchParams;
  const { error, success } = search;
  const embedTheme = getEmbedTheme(search);
  const { form, unavailableMessage } = await getEmbeddedFormForPublicView(formId);

  if (!form) {
    return (
      <main
        className="formos-embed-scope min-h-screen px-3 py-4 sm:px-4"
        data-theme={embedTheme.theme}
        style={embedTheme.style}
      >
        <style>{embedThemeCss}</style>
        <EmbedHeightScript formId={formId} />
        <section className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-blue-700">
            FormOS
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
            This form is currently unavailable.
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {unavailableMessage || "Please contact the form owner if this is unexpected."}
          </p>
        </section>
      </main>
    );
  }

  await recordFormView({
    formId: form.id,
    ownerId: form.ownerId,
    context: {
      headers: await headers(),
      source: search.source ?? "EMBED",
    },
  });

  const submitAction = submitEmbeddedForm.bind(null, form.id);
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
    <main
      className="formos-embed-scope min-h-0 px-0 py-0"
      data-theme={embedTheme.theme}
      style={embedTheme.style}
    >
      <style>{embedThemeCss}</style>
      <GoogleAdSenseScript
        adsEnabled={form.publicAds.enabled}
        clientId={form.publicAds.adsenseClientId}
      />
      <PublicFormDraftScript clearDraft={Boolean(success)} formId={form.id} />
      <SignatureCanvasBootstrapScript />
      <EmbedHeightScript formId={form.id} />

      <section
        className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-3 sm:p-4"
        data-formos-embed-card
      >
        <div className="mb-3 flex flex-col gap-3">
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
          <div className="flex flex-col gap-3" data-formos-embed-inner>
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

            <section className="py-2" data-formos-submit-shell>
              <PublicFormSubmitControls
                hasUploadFields={hasUploadFields}
                submitButtonText={submitButtonText}
              />
            </section>
          </div>
        </PublicFormClient>
      </section>

      <PoweredByFooter branding={form.branding} />
    </main>
  );
}
