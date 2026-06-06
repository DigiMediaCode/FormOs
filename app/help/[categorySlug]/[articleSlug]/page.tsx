import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";
import {
  getPublishedKbArticle,
  renderKbContent,
} from "@/lib/knowledge-base/articles";

type HelpArticlePageProps = {
  params: Promise<{
    categorySlug: string;
    articleSlug: string;
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
}: HelpArticlePageProps): Promise<Metadata> {
  const { categorySlug, articleSlug } = await params;
  const article = await getPublishedKbArticle(categorySlug, articleSlug);

  if (!article) {
    return {
      title: "Help article unavailable | FormOS",
    };
  }

  return {
    title: article.metaTitle || `${article.title} | FormOS Help Center`,
    description: article.metaDescription || article.excerpt || undefined,
  };
}

export default async function HelpArticlePage({
  params,
}: HelpArticlePageProps) {
  const { categorySlug, articleSlug } = await params;
  const article = await getPublishedKbArticle(categorySlug, articleSlug);

  if (!article || !article.category) {
    notFound();
  }

  const html = renderKbContent(article.content);

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />
      <main className="px-5 py-10 sm:px-8">
        <article className="mx-auto max-w-3xl">
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
              href="/help"
            >
              <ArrowLeft className="size-4" />
              Help Center
            </Link>
            <Link
              className="text-sm font-semibold text-blue-700 hover:text-blue-800"
              href={`/help/${article.category.slug}`}
            >
              {article.category.name}
            </Link>
          </div>

          <header className="mt-8">
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">
                {article.category.name}
              </span>
              <span>Updated {formatDate(article.updatedAt)}</span>
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              {article.title}
            </h1>
            {article.excerpt ? (
              <p className="mt-5 text-lg leading-8 text-slate-600">
                {article.excerpt}
              </p>
            ) : null}
          </header>

          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            {html ? (
              <div
                className="kb-content space-y-5 text-base leading-8 text-slate-700 [&_a]:text-blue-700 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_blockquote]:text-slate-600 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-slate-950 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-slate-950 [&_img]:rounded-2xl [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ) : (
              <p>This article is being updated.</p>
            )}
          </section>

          <section className="mt-8 rounded-2xl bg-blue-600 px-6 py-8 text-center text-white shadow-sm">
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
        </article>
      </main>
      <PublicFooter />
    </div>
  );
}
