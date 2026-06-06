import Link from "next/link";
import { Archive, FolderOpen, Pencil, Plus } from "lucide-react";
import { archiveKbCategoryAction } from "@/app/admin/knowledge-base/actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

type AdminKbCategoriesPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

function statusClass(status: string) {
  if (status === "PUBLISHED") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "ARCHIVED") {
    return "bg-slate-100 text-slate-600";
  }

  return "bg-amber-50 text-amber-700";
}

export default async function AdminKbCategoriesPage({
  searchParams,
}: AdminKbCategoriesPageProps) {
  await requireSuperAdmin();
  const { error, success } = await searchParams;
  const categories = await prisma.kbCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          articles: true,
        },
      },
    },
  });

  return (
    <main className="px-4 py-6 lg:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
              Knowledge Base
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">
              Categories
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Organize Help Center articles by support topic.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
              href="/admin/knowledge-base"
            >
              Back to Articles
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              href="/admin/knowledge-base/categories/new"
            >
              <Plus className="size-4" />
              New Category
            </Link>
          </div>
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

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[840px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Articles</th>
                  <th className="px-4 py-3 font-semibold">Sort</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <FolderOpen className="size-4" />
                        </span>
                        <div>
                          <p className="font-semibold text-slate-950">{category.name}</p>
                          <p className="mt-0.5 text-xs text-slate-500">/help/{category.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(category.status)}`}>
                        {category.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {category._count.articles}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {category.sortOrder}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                          href={`/admin/knowledge-base/categories/${category.id}`}
                          title="Edit"
                        >
                          <Pencil className="size-4" />
                        </Link>
                        <form action={archiveKbCategoryAction.bind(null, category.id)}>
                          <SubmitButton
                            className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                            pendingText="Archiving..."
                            showStatus={false}
                            title="Archive"
                          >
                            <Archive className="size-4" />
                          </SubmitButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 ? (
                  <tr>
                    <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={5}>
                      No categories yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
