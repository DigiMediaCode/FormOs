import type { KbArticle, KbCategory } from "@prisma/client";
import { Save } from "lucide-react";
import { RichContentEditor } from "@/components/admin/rich-content-editor";
import { SubmitButton } from "@/components/ui/submit-button";
import { KB_STATUSES } from "@/lib/knowledge-base/articles";

type ArticleFormProps = {
  action: (formData: FormData) => Promise<void>;
  article?: (KbArticle & { category?: KbCategory | null }) | null;
  categories: KbCategory[];
  submitLabel: string;
};

const inputClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass = "flex flex-col gap-1.5 text-xs font-medium text-slate-600";

function dateTimeValue(date: Date | null | undefined) {
  if (!date) {
    return "";
  }

  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function KbArticleForm({
  action,
  article,
  categories,
  submitLabel,
}: ArticleFormProps) {
  return (
    <form
      action={action}
      className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="grid gap-3 md:grid-cols-2">
        <label className={labelClass}>
          Title
          <input
            className={inputClass}
            defaultValue={article?.title ?? ""}
            name="title"
            placeholder="How to publish and share a form"
            required
          />
        </label>
        <label className={labelClass}>
          Slug
          <input
            className={inputClass}
            defaultValue={article?.slug ?? ""}
            name="slug"
            placeholder="publish-and-share-a-form"
          />
          <span className="text-[11px] font-normal text-slate-500">
            Leave blank on new articles to generate from the title.
          </span>
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <label className={labelClass}>
          Status
          <select
            className={inputClass}
            defaultValue={article?.status ?? "DRAFT"}
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
          Category
          <select
            className={inputClass}
            defaultValue={article?.categoryId ?? ""}
            name="categoryId"
          >
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Sort Order
          <input
            className={inputClass}
            defaultValue={article?.sortOrder ?? 0}
            name="sortOrder"
            type="number"
          />
        </label>
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
          <input
            defaultChecked={article?.isFeatured ?? false}
            name="isFeatured"
            type="checkbox"
          />
          Featured / Popular
        </label>
      </div>

      <label className={labelClass}>
        Excerpt
        <textarea
          className={`${inputClass} min-h-20`}
          defaultValue={article?.excerpt ?? ""}
          name="excerpt"
          placeholder="A short summary for the Help Center and SEO."
        />
      </label>

      <RichContentEditor
        help="Use safe formatting. Knowledge base content is sanitized before public rendering."
        initialHtml={article?.content ?? "<p>Write your help article here.</p>"}
        label="Content"
        name="content"
      />

      <div className="grid gap-3 md:grid-cols-3">
        <label className={labelClass}>
          Meta Title
          <input
            className={inputClass}
            defaultValue={article?.metaTitle ?? ""}
            name="metaTitle"
          />
        </label>
        <label className={labelClass}>
          Meta Description
          <input
            className={inputClass}
            defaultValue={article?.metaDescription ?? ""}
            name="metaDescription"
          />
        </label>
        <label className={labelClass}>
          Published At
          <input
            className={inputClass}
            defaultValue={dateTimeValue(article?.publishedAt)}
            name="publishedAt"
            type="datetime-local"
          />
        </label>
      </div>

      <SubmitButton
        className="inline-flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        pendingText="Saving article..."
      >
        <Save className="size-4" />
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
