import Link from "next/link";
import { createKbArticleAction } from "@/app/admin/knowledge-base/actions";
import { KbArticleForm } from "@/app/admin/knowledge-base/article-form";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

type NewKbArticlePageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function NewKbArticlePage({
  searchParams,
}: NewKbArticlePageProps) {
  await requireSuperAdmin();
  const { error } = await searchParams;
  const categories = await prisma.kbCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

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
            New Knowledge Base Article
          </h2>
        </header>
        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}
        <KbArticleForm
          action={createKbArticleAction}
          categories={categories}
          submitLabel="Create Article"
        />
      </div>
    </main>
  );
}
