import { Save } from "lucide-react";
import { RichContentEditor } from "@/components/admin/rich-content-editor";
import { SubmitButton } from "@/components/ui/submit-button";
import { ALL_EMAIL_TEMPLATE_VARIABLES } from "@/lib/email/templates";

type EmailTemplateFormProps = {
  action: (formData: FormData) => Promise<void>;
  initialValues?: {
    key?: string;
    name?: string;
    description?: string | null;
    subject?: string;
    textBody?: string;
    htmlBody?: string | null;
    isActive?: boolean;
  };
  keyLocked?: boolean;
  redirectTo?: string;
  submitLabel?: string;
};

export const inputClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
export const labelClass = "flex flex-col gap-1.5 text-xs font-medium text-slate-600";

export function formatDate(date: Date | null | undefined) {
  if (!date) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function EmailTemplateForm({
  action,
  initialValues,
  keyLocked = false,
  redirectTo,
  submitLabel = "Save Template",
}: EmailTemplateFormProps) {
  const key = initialValues?.key ?? "";
  const isActive = initialValues?.isActive ?? true;

  return (
    <form action={action} className="grid gap-4">
      {redirectTo ? <input name="redirectTo" type="hidden" value={redirectTo} /> : null}
      {keyLocked ? <input name="key" type="hidden" value={key} /> : null}

      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
        Use variables such as <code>{"{{userName}}"}</code>,{" "}
        <code>{"{{userEmail}}"}</code>, <code>{"{{formTitle}}"}</code>, and{" "}
        <code>{"{{dashboardLink}}"}</code>. HTML is sanitized before sending.
      </div>

      <div className="flex flex-wrap gap-2">
        {ALL_EMAIL_TEMPLATE_VARIABLES.map((variable) => (
          <span
            className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
            key={variable}
          >
            {"{{"}
            {variable}
            {"}}"}
          </span>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className={labelClass}>
          Name
          <input
            className={inputClass}
            defaultValue={initialValues?.name ?? ""}
            name="name"
            placeholder="New login notification"
            required
          />
        </label>
        <label className={labelClass}>
          Template Key
          <input
            className={inputClass}
            defaultValue={key}
            disabled={keyLocked}
            name={keyLocked ? undefined : "key"}
            placeholder="login_notification"
            required
          />
        </label>
      </div>

      <label className={labelClass}>
        Description
        <input
          className={inputClass}
          defaultValue={initialValues?.description ?? ""}
          name="description"
          placeholder="Internal note for this template."
        />
      </label>

      <label className={labelClass}>
        Subject
        <input
          className={inputClass}
          defaultValue={initialValues?.subject ?? ""}
          name="subject"
          required
        />
      </label>

      <label className={labelClass}>
        Text Body
        <textarea
          className={`${inputClass} min-h-44 font-mono text-xs leading-6`}
          defaultValue={initialValues?.textBody ?? ""}
          name="textBody"
          required
        />
      </label>

      <div className={labelClass}>
        <span>Optional HTML Body</span>
        <RichContentEditor
          help="Optional formatted version. Media uploads go to the Media Library."
          initialHtml={initialValues?.htmlBody ?? ""}
          label="Rich HTML Body"
          name="htmlBody"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <input
            className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            defaultChecked={isActive}
            name="isActive"
            type="checkbox"
          />
          Active
        </label>
        <SubmitButton
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          pendingText="Saving template..."
          showStatus={false}
        >
          <Save className="size-4" />
          {submitLabel}
        </SubmitButton>
      </div>
    </form>
  );
}
