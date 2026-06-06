import type { BlogCategory, BlogPost } from "@prisma/client";
import { Save } from "lucide-react";
import { RichContentEditor } from "@/components/admin/rich-content-editor";
import { SubmitButton } from "@/components/ui/submit-button";
import { BLOG_STATUSES } from "@/lib/blog/posts";

type BlogPostWithCategory = BlogPost & {
  category?: BlogCategory | null;
};

type BlogPostFormProps = {
  action: (formData: FormData) => Promise<void>;
  categories: BlogCategory[];
  post?: BlogPostWithCategory | null;
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

export function BlogPostForm({
  action,
  categories,
  post,
  submitLabel,
}: BlogPostFormProps) {
  return (
    <form action={action} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-2">
        <label className={labelClass}>
          Title
          <input
            className={inputClass}
            defaultValue={post?.title ?? ""}
            name="title"
            placeholder="How to build signed online agreements"
            required
          />
        </label>
        <label className={labelClass}>
          Slug
          <input
            className={inputClass}
            defaultValue={post?.slug ?? ""}
            name="slug"
            placeholder="signed-online-agreements"
          />
          <span className="text-[11px] font-normal text-slate-500">
            Leave blank on new posts to generate from the title.
          </span>
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <label className={labelClass}>
          Status
          <select className={inputClass} defaultValue={post?.status ?? "DRAFT"} name="status">
            {BLOG_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Category
          <select className={inputClass} defaultValue={post?.categoryId ?? ""} name="categoryId">
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          New Category
          <input
            className={inputClass}
            name="newCategoryName"
            placeholder="Tutorials"
          />
          <span className="text-[11px] font-normal text-slate-500">
            Optional. If filled, this will be used instead of selected category.
          </span>
        </label>
      </div>

      <label className={labelClass}>
        Excerpt
        <textarea
          className={`${inputClass} min-h-20`}
          defaultValue={post?.excerpt ?? ""}
          name="excerpt"
          placeholder="A short summary for the blog list and SEO."
        />
      </label>

      <label className={labelClass}>
        Featured Image URL / Path
        <input
          className={inputClass}
          defaultValue={post?.featuredImage ?? ""}
          name="featuredImage"
          placeholder="/media/... or https://example.com/image.jpg"
        />
        <span className="text-[11px] font-normal text-slate-500">
          Use a Media Library path such as /media/... or a safe HTTPS image URL.
        </span>
      </label>

      <RichContentEditor
        help="Use safe formatting and Media Library uploads. Blog content is sanitized before public rendering."
        initialHtml={post?.content ?? "<p>Write your blog content here.</p>"}
        label="Content"
        name="content"
      />

      <div className="grid gap-3 md:grid-cols-3">
        <label className={labelClass}>
          Meta Title
          <input className={inputClass} defaultValue={post?.metaTitle ?? ""} name="metaTitle" />
        </label>
        <label className={labelClass}>
          Meta Description
          <input
            className={inputClass}
            defaultValue={post?.metaDescription ?? ""}
            name="metaDescription"
          />
        </label>
        <label className={labelClass}>
          Published At
          <input
            className={inputClass}
            defaultValue={dateTimeValue(post?.publishedAt)}
            name="publishedAt"
            type="datetime-local"
          />
        </label>
      </div>

      <SubmitButton
        className="inline-flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        pendingText="Saving blog post..."
      >
        <Save className="size-4" />
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
