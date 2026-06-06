import type { KbCategory } from "@prisma/client";
import { Save } from "lucide-react";
import { SubmitButton } from "@/components/ui/submit-button";
import { KB_STATUSES } from "@/lib/knowledge-base/articles";

type CategoryFormProps = {
  action: (formData: FormData) => Promise<void>;
  category?: KbCategory | null;
  submitLabel: string;
};

const inputClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass = "flex flex-col gap-1.5 text-xs font-medium text-slate-600";

export function KbCategoryForm({
  action,
  category,
  submitLabel,
}: CategoryFormProps) {
  return (
    <form
      action={action}
      className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="grid gap-3 md:grid-cols-2">
        <label className={labelClass}>
          Name
          <input
            className={inputClass}
            defaultValue={category?.name ?? ""}
            name="name"
            placeholder="Getting Started"
            required
          />
        </label>
        <label className={labelClass}>
          Slug
          <input
            className={inputClass}
            defaultValue={category?.slug ?? ""}
            name="slug"
            placeholder="getting-started"
          />
          <span className="text-[11px] font-normal text-slate-500">
            Leave blank on new categories to generate from the name.
          </span>
        </label>
      </div>

      <label className={labelClass}>
        Description
        <textarea
          className={`${inputClass} min-h-24`}
          defaultValue={category?.description ?? ""}
          name="description"
          placeholder="Short category description for the public Help Center."
        />
      </label>

      <div className="grid gap-3 md:grid-cols-2">
        <label className={labelClass}>
          Status
          <select
            className={inputClass}
            defaultValue={category?.status ?? "PUBLISHED"}
            name="status"
          >
            {KB_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Sort Order
          <input
            className={inputClass}
            defaultValue={category?.sortOrder ?? 0}
            name="sortOrder"
            type="number"
          />
        </label>
      </div>

      <SubmitButton
        className="inline-flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        pendingText="Saving category..."
      >
        <Save className="size-4" />
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
