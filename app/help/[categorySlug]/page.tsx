import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PublicAdSection } from "@/components/ads/public-ad-section";
import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";
import {
  getPublishedKbArticles,
  getPublishedKbCategory,
} from "@/lib/knowledge-base/articles";

type HelpCategoryPageProps = {
  params: Promise<{
    categorySlug: string;
  }>;
};

function formatDate(date: Date | null | undefined) {
  if (!date) {
    return "Recently updated";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
}

export async function generateMetadata({
  params,
}: HelpCategoryPageProps): Promise<Metadata> {
  const { categorySlug } = await params;
  const category = await getPublishedKbCategory(categorySlug);

  if (!category) {
    return {
      title: "Help category unavailable | FormOS",
    };
  }

  return {
    title: `${category.name} | FormOS Help Center`,
    description:
      category.description ||
      `Find FormOS help articles and support guides for ${category.name}.`,
  };
}

export default async function HelpCategoryPage({
  params,
}: HelpCategoryPageProps) {
  const { categorySlug } = await params;
  const [category, articles] = await Promise.all([
    getPublishedKbCategory(categorySlug),
    getPublishedKbArticles({ categorySlug }),
  ]);

  if (!category) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />
      <main className="px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
            href="/help"
          >
            <ArrowLeft className="size-4" />
            Back to Help Center
          </Link>

          <header className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
              Help Category
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-950">
              {category.name}
            </h1>
            {category.description ? (
              <p className="mt-4 text-base leading-8 text-slate-600">
                {category.description}
              </p>
            ) : null}
          </header>

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Articles</h2>
            <div className="mt-4 grid gap-3">
              {articles.map((article) => (
                <Link
                  className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 transition hover:bg-blue-50"
                  href={`/help/${category.slug}/${article.slug}`}
                  key={article.id}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{article.title}</p>
                      {article.excerpt ? (
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">
                          {article.excerpt}
                        </p>
                      ) : null}
                      <p className="mt-2 text-xs text-slate-500">
                        {formatDate(article.publishedAt ?? article.updatedAt)}
                      </p>
                    </div>
                    <ArrowRight className="mt-1 size-4 shrink-0 text-slate-400" />
                  </div>
                </Link>
              ))}
              {articles.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                  No published articles in this category yet.
                </p>
              ) : null}
            </div>
          </section>
        </div>
        <PublicAdSection className="mt-10" slot="middle" />
      </main>
      <PublicFooter />
    </div>
  );
}
