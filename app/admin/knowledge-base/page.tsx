import Link from "next/link";
import {
  Archive,
  BookOpen,
  ExternalLink,
  FolderOpen,
  Pencil,
  Plus,
  Sparkles,
} from "lucide-react";
import {
  archiveKbArticleAction,
  seedKbCategoriesAction,
} from "@/app/admin/knowledge-base/actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { seedDefaultKbContentIfMissing } from "@/lib/knowledge-base/articles";
import { prisma } from "@/lib/prisma";

type AdminKbPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

function formatDate(date: Date | null | undefined) {
  if (!date) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusClass(status: string) {
  if (status === "PUBLISHED") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "ARCHIVED") {
    return "bg-slate-100 text-slate-600";
  }

  return "bg-amber-50 text-amber-700";
}

export default async function AdminKnowledgeBasePage({
  searchParams,
}: AdminKbPageProps) {
  await requireSuperAdmin();
  await seedDefaultKbContentIfMissing();
  const { error, success } = await searchParams;
  const articles = await prisma.kbArticle.findMany({
    orderBy: [{ updatedAt: "desc" }],
    include: {
      category: true,
    },
  });

  return (
    <main className="px-4 py-6 lg:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
              Super Admin
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">
              Knowledge Base
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Manage Help Center articles, FAQs, troubleshooting guides, and support docs.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <form action={seedKbCategoriesAction}>
              <SubmitButton
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
                pendingText="Checking content..."
                showStatus={false}
              >
                <Sparkles className="size-4 text-blue-600" />
                Seed Content
              </SubmitButton>
            </form>
            <Link
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
              href="/admin/knowledge-base/categories"
            >
              <FolderOpen className="size-4" />
              Categories
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              href="/admin/knowledge-base/articles/new"
            >
              <Plus className="size-4" />
              New Article
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
            <table className="min-w-[1080px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Article</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Featured</th>
                  <th className="px-4 py-3 font-semibold">Sort</th>
                  <th className="px-4 py-3 font-semibold">Updated</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {articles.map((article) => (
                  <tr className="align-top" key={article.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <BookOpen className="size-4" />
                        </span>
                        <div>
                          <p className="font-semibold text-slate-950">{article.title}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            /help/{article.category?.slug ?? "category"}/{article.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(article.status)}`}>
                        {article.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {article.category?.name ?? "None"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {article.isFeatured ? "Yes" : "No"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {article.sortOrder}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {formatDate(article.updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {article.status === "PUBLISHED" && article.category ? (
                          <Link
                            aria-label={`View ${article.title}`}
                            className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                            href={`/help/${article.category.slug}/${article.slug}`}
                            title="View public article"
                          >
                            <ExternalLink className="size-4" />
                          </Link>
                        ) : null}
                        <Link
                          aria-label={`Edit ${article.title}`}
                          className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                          href={`/admin/knowledge-base/articles/${article.id}`}
                          title="Edit"
                        >
                          <Pencil className="size-4" />
                        </Link>
                        <form action={archiveKbArticleAction.bind(null, article.id)}>
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
                {articles.length === 0 ? (
                  <tr>
                    <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={7}>
                      No knowledge base articles yet. Create your first help article.
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
