import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PublicAdSection } from "@/components/ads/public-ad-section";
import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";
import {
  getPublishedBlogPost,
  getPublishedBlogPosts,
  renderBlogContent,
} from "@/lib/blog/posts";

type BlogPostPageProps = {
  params: Promise<{
    slug: string;
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
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedBlogPost(slug);

  if (!post) {
    return {
      title: "Blog post unavailable | FormOS",
    };
  }

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt || undefined,
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt || undefined,
      type: "article",
      images: post.featuredImage ? [{ url: post.featuredImage }] : undefined,
      publishedTime: post.publishedAt?.toISOString(),
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPublishedBlogPost(slug);

  if (!post) {
    notFound();
  }

  const html = renderBlogContent(post.content);
  const recentPosts = (await getPublishedBlogPosts(4)).filter(
    (item) => item.id !== post.id,
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />
      <main className="px-5 py-10 sm:px-8">
        <article className="mx-auto max-w-3xl">
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
            href="/blog"
          >
            <ArrowLeft className="size-4" />
            Back to blog
          </Link>

          <header className="mt-8">
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
              {post.category ? (
                <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">
                  {post.category.name}
                </span>
              ) : null}
              <span>{formatDate(post.publishedAt ?? post.createdAt)}</span>
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              {post.title}
            </h1>
            {post.excerpt ? (
              <p className="mt-5 text-lg leading-8 text-slate-600">{post.excerpt}</p>
            ) : null}
          </header>

          {post.featuredImage ? (
            <img
              alt=""
              className="mt-8 max-h-[420px] w-full rounded-2xl border border-slate-200 object-cover shadow-sm"
              src={post.featuredImage}
            />
          ) : null}

          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            {html ? (
              <div
                className="blog-content space-y-5 text-base leading-8 text-slate-700 [&_a]:text-blue-700 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_blockquote]:text-slate-600 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-slate-950 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-slate-950 [&_img]:rounded-2xl [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ) : (
              <p>This post is being updated.</p>
            )}
          </section>

          {recentPosts.length > 0 ? (
            <aside className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">Recent posts</h2>
              <div className="mt-4 grid gap-3">
                {recentPosts.map((item) => (
                  <Link
                    className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 transition hover:bg-blue-50"
                    href={`/blog/${item.slug}`}
                    key={item.id}
                  >
                    <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(item.publishedAt ?? item.createdAt)}
                    </p>
                  </Link>
                ))}
              </div>
            </aside>
          ) : null}
        </article>
        <PublicAdSection className="mt-10" slot="bottom" />
      </main>
      <PublicFooter />
    </div>
  );
}
