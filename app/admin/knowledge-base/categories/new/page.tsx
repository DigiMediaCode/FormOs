import Link from "next/link";
import { createKbCategoryAction } from "@/app/admin/knowledge-base/actions";
import { KbCategoryForm } from "@/app/admin/knowledge-base/category-form";
import { requireSuperAdmin } from "@/lib/admin/auth";

type NewKbCategoryPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function NewKbCategoryPage({
  searchParams,
}: NewKbCategoryPageProps) {
  await requireSuperAdmin();
  const { error } = await searchParams;

  return (
    <main className="px-4 py-6 lg:px-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-5">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <Link
            className="text-sm font-semibold text-slate-600 hover:text-slate-950"
            href="/admin/knowledge-base/categories"
          >
            Back to categories
          </Link>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">
            New Knowledge Base Category
          </h2>
        </header>
        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}
        <KbCategoryForm
          action={createKbCategoryAction}
          submitLabel="Create Category"
        />
      </div>
    </main>
  );
}
