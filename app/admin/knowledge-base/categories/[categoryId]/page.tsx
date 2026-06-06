import Link from "next/link";
import { notFound } from "next/navigation";
import { updateKbCategoryAction } from "@/app/admin/knowledge-base/actions";
import { KbCategoryForm } from "@/app/admin/knowledge-base/category-form";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

type EditKbCategoryPageProps = {
  params: Promise<{
    categoryId: string;
  }>;
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function EditKbCategoryPage({
  params,
  searchParams,
}: EditKbCategoryPageProps) {
  await requireSuperAdmin();
  const [{ categoryId }, { error, success }] = await Promise.all([
    params,
    searchParams,
  ]);
  const category = await prisma.kbCategory.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    notFound();
  }

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
            Edit Category
          </h2>
          <p className="mt-1 text-sm text-slate-500">/help/{category.slug}</p>
        </header>
        {success ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {success}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}
        <KbCategoryForm
          action={updateKbCategoryAction.bind(null, category.id)}
          category={category}
          submitLabel="Save Category"
        />
      </div>
    </main>
  );
}
