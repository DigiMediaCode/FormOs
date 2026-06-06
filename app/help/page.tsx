import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, HelpCircle, Search } from "lucide-react";
import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";
import {
  getPublishedKbArticles,
  getPublishedKbCategories,
} from "@/lib/knowledge-base/articles";

type HelpPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export const metadata: Metadata = {
  title: "FormOS Help Center",
  description:
    "Find answers and guides for using FormOS forms, agreements, signatures, uploads, billing, and team features.",
};

function formatDate(date: Date | null | undefined) {
  if (!date) {
    return "Recently updated";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
}

export default async function HelpPage({ searchParams }: HelpPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const [categories, articles, featuredArticles] = await Promise.all([
    getPublishedKbCategories(),
    getPublishedKbArticles({ q: query || undefined }),
    getPublishedKbArticles({ featured: true, take: 6 }),
  ]);
  const visibleArticles = query ? articles : featuredArticles.length ? featuredArticles : articles.slice(0, 6);

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />
      <main className="px-5 py-14 sm:px-8">
        <div className="mx-auto max-w-[1088px]">
          <header className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm">
              <HelpCircle className="size-3.5" />
              FormOS support
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Help Center
            </h1>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Find answers and guides for forms, agreements, signatures, uploads,
              billing, and team features.
            </p>
            <form className="mt-7 flex rounded-2xl border border-slate-200 bg-white p-2 shadow-sm" method="get">
              <label className="flex flex-1 items-center gap-3 px-3 text-slate-500">
                <Search className="size-5" />
                <input
                  className="w-full bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                  defaultValue={query}
                  name="q"
                  placeholder="Search help articles..."
                />
              </label>
              <button
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                type="submit"
              >
                Search
              </button>
            </form>
          </header>

          {!query ? (
            <section className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <Link
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                  href={`/help/${category.slug}`}
                  key={category.id}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <BookOpen className="size-5" />
                    </span>
                    <div>
                      <h2 className="text-base font-semibold text-slate-950">
                        {category.name}
                      </h2>
                      {category.description ? (
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">
                          {category.description}
                        </p>
                      ) : null}
                      <p className="mt-3 text-xs font-medium text-blue-700">
                        {category._count.articles} article{category._count.articles === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </section>
          ) : null}

          <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
                  {query ? "Search Results" : "Popular Articles"}
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-950">
                  {query ? `Results for "${query}"` : "Start here"}
                </h2>
              </div>
              {query ? (
                <Link className="text-sm font-semibold text-blue-700 hover:text-blue-800" href="/help">
                  Clear search
                </Link>
              ) : null}
            </div>

            <div className="mt-5 grid gap-3">
              {visibleArticles.map((article) => (
                <Link
                  className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 transition hover:bg-blue-50"
                  href={`/help/${article.category?.slug}/${article.slug}`}
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
                        {article.category?.name} · {formatDate(article.publishedAt ?? article.updatedAt)}
                      </p>
                    </div>
                    <ArrowRight className="mt-1 size-4 shrink-0 text-slate-400" />
                  </div>
                </Link>
              ))}
              {visibleArticles.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                  <p className="font-semibold text-slate-950">No articles found</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Try a different search, or contact us and we will help.
                  </p>
                </div>
              ) : null}
            </div>
          </section>

          <section className="mt-10 rounded-2xl bg-blue-600 px-6 py-8 text-center text-white shadow-sm">
            <h2 className="text-2xl font-semibold">Still need help?</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-blue-100">
              If you cannot find the answer, contact us and we will help.
            </p>
            <Link
              className="mt-5 inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
              href="/contact"
            >
              Contact Us
            </Link>
          </section>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
