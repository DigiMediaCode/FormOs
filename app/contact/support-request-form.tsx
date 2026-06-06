import { Send } from "lucide-react";
import { SubmitButton } from "@/components/ui/submit-button";
import { SUPPORT_CATEGORIES } from "@/lib/support/requests";

type SupportRequestFormProps = {
  action: (formData: FormData) => Promise<void>;
  defaultEmail?: string;
  defaultName?: string;
};

const inputClass =
  "rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass = "flex flex-col gap-1.5 text-sm font-medium text-slate-700";

export function SupportRequestForm({
  action,
  defaultEmail,
  defaultName,
}: SupportRequestFormProps) {
  return (
    <form
      action={action}
      className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
          Support Request
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-slate-950">
          Contact FormOS support
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Tell us what you need help with. Please do not include passwords,
          OAuth tokens, or payment details.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className={labelClass}>
          Name
          <input
            className={inputClass}
            defaultValue={defaultName ?? ""}
            name="name"
            placeholder="Jane Cooper"
          />
        </label>
        <label className={labelClass}>
          Email <span className="text-red-500">*</span>
          <input
            className={inputClass}
            defaultValue={defaultEmail ?? ""}
            name="email"
            placeholder="you@company.com"
            required
            type="email"
          />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className={labelClass}>
          Category <span className="text-red-500">*</span>
          <select className={inputClass} defaultValue="General Question" name="category" required>
            {SUPPORT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Subject <span className="text-red-500">*</span>
          <input
            className={inputClass}
            name="subject"
            placeholder="I need help with..."
            required
          />
        </label>
      </div>

      <label className={labelClass}>
        Message <span className="text-red-500">*</span>
        <textarea
          className={`${inputClass} min-h-40`}
          maxLength={5000}
          minLength={10}
          name="message"
          placeholder="Share the details so we can help quickly."
          required
        />
      </label>

      <SubmitButton
        className="inline-flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        pendingText="Sending request..."
      >
        <Send className="size-4" />
        Send Support Request
      </SubmitButton>
    </form>
  );
}
