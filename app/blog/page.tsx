import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";
import { getPublishedBlogPosts } from "@/lib/blog/posts";

export const metadata: Metadata = {
  title: "FormOS Blog",
  description:
    "Tips, guides, and updates about online forms, signed agreements, document workflows, and FormOS.",
};

function formatDate(date: Date | null | undefined) {
  if (!date) {
    return "Recently updated";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
}

export default async function BlogPage() {
  const posts = await getPublishedBlogPosts();

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />
      <main className="px-5 py-14 sm:px-8">
        <div className="mx-auto max-w-[1088px]">
          <header className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm">
              <BookOpen className="size-3.5" />
              FormOS resources
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Blog
            </h1>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Tips, guides, and updates about online forms, signed agreements,
              document workflows, and FormOS.
            </p>
          </header>

          {posts.length > 0 ? (
            <section className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {posts.map((post) => (
                <article
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  key={post.id}
                >
                  {post.featuredImage ? (
                    <Link className="block h-44 bg-slate-100" href={`/blog/${post.slug}`}>
                      <img
                        alt=""
                        className="h-full w-full object-cover"
                        src={post.featuredImage}
                      />
                    </Link>
                  ) : null}
                  <div className="p-5">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      {post.category ? (
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 font-medium text-blue-700">
                          {post.category.name}
                        </span>
                      ) : null}
                      <span>{formatDate(post.publishedAt ?? post.createdAt)}</span>
                    </div>
                    <h2 className="mt-3 text-xl font-semibold leading-tight text-slate-950">
                      <Link className="hover:text-blue-700" href={`/blog/${post.slug}`}>
                        {post.title}
                      </Link>
                    </h2>
                    {post.excerpt ? (
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                        {post.excerpt}
                      </p>
                    ) : null}
                    <Link
                      className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800"
                      href={`/blog/${post.slug}`}
                    >
                      Read more
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </section>
          ) : (
            <section className="mt-10 rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
              <BookOpen className="mx-auto size-8 text-slate-400" />
              <h2 className="mt-4 text-lg font-semibold text-slate-950">
                No published posts yet
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Check back soon for FormOS guides and product updates.
              </p>
            </section>
          )}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
