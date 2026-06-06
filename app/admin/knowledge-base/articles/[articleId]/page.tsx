import Link from "next/link";
import { notFound } from "next/navigation";
import { updateKbArticleAction } from "@/app/admin/knowledge-base/actions";
import { KbArticleForm } from "@/app/admin/knowledge-base/article-form";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

type EditKbArticlePageProps = {
  params: Promise<{
    articleId: string;
  }>;
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function EditKbArticlePage({
  params,
  searchParams,
}: EditKbArticlePageProps) {
  await requireSuperAdmin();
  const [{ articleId }, { error, success }] = await Promise.all([
    params,
    searchParams,
  ]);
  const [article, categories] = await Promise.all([
    prisma.kbArticle.findUnique({
      where: { id: articleId },
      include: { category: true },
    }),
    prisma.kbCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  if (!article) {
    notFound();
  }

  return (
    <main className="px-4 py-6 lg:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <Link
            className="text-sm font-semibold text-slate-600 hover:text-slate-950"
            href="/admin/knowledge-base"
          >
            Back to articles
          </Link>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">
            Edit Article
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            /help/{article.category?.slug ?? "category"}/{article.slug}
          </p>
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
        <KbArticleForm
          action={updateKbArticleAction.bind(null, article.id)}
          article={article}
          categories={categories}
          submitLabel="Save Article"
        />
      </div>
    </main>
  );
}
