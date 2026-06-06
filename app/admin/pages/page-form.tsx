import type { CmsPage } from "@prisma/client";
import { Save } from "lucide-react";
import { SubmitButton } from "@/components/ui/submit-button";
import { CMS_STATUSES } from "@/lib/cms/pages";
import { CmsPageBuilder } from "./cms-page-builder";

type CmsPageFormProps = {
  action: (formData: FormData) => Promise<void>;
  page?: CmsPage | null;
  submitLabel: string;
};

const inputClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass = "flex flex-col gap-1.5 text-xs font-medium text-slate-600";

export function CmsPageForm({ action, page, submitLabel }: CmsPageFormProps) {
  return (
    <form action={action} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-2">
        <label className={labelClass}>
          Title
          <input
            className={inputClass}
            defaultValue={page?.title ?? ""}
            name="title"
            placeholder="Privacy Policy"
            required
          />
        </label>
        <label className={labelClass}>
          Slug
          <input
            className={inputClass}
            defaultValue={page?.slug ?? ""}
            name="slug"
            placeholder="privacy-policy"
          />
          <span className="text-[11px] font-normal text-slate-500">
            Leave blank on new pages to generate from the title.
          </span>
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <label className={labelClass}>
          Status
          <select className={inputClass} defaultValue={page?.status ?? "DRAFT"} name="status">
            {CMS_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Menu Label
          <input
            className={inputClass}
            defaultValue={page?.menuLabel ?? ""}
            name="menuLabel"
            placeholder="Privacy"
          />
        </label>
        <label className={labelClass}>
          Sort Order
          <input
            className={inputClass}
            defaultValue={page?.sortOrder ?? 0}
            name="sortOrder"
            type="number"
          />
        </label>
      </div>

      <label className={labelClass}>
        Excerpt
        <textarea
          className={`${inputClass} min-h-20`}
          defaultValue={page?.excerpt ?? ""}
          name="excerpt"
          placeholder="Short page summary for SEO and page intros."
        />
      </label>

      <CmsPageBuilder initialContent={page?.content ?? ""} />

      <div className="grid gap-3 md:grid-cols-2">
        <label className={labelClass}>
          Meta Title
          <input className={inputClass} defaultValue={page?.metaTitle ?? ""} name="metaTitle" />
        </label>
        <label className={labelClass}>
          Meta Description
          <input
            className={inputClass}
            defaultValue={page?.metaDescription ?? ""}
            name="metaDescription"
          />
        </label>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <input
            className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            defaultChecked={page?.showInHeader ?? false}
            name="showInHeader"
            type="checkbox"
          />
          Show in Header
        </label>
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <input
            className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            defaultChecked={page?.showInFooter ?? false}
            name="showInFooter"
            type="checkbox"
          />
          Show in Footer
        </label>
      </div>

      <SubmitButton
        className="inline-flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        pendingText="Saving page..."
      >
        <Save className="size-4" />
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
