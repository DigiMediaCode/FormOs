import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { updateBlogPostAction } from "@/app/admin/blog/actions";
import { BlogPostForm } from "@/app/admin/blog/blog-post-form";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

type EditBlogPostPageProps = {
  params: Promise<{
    postId: string;
  }>;
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function EditBlogPostPage({
  params,
  searchParams,
}: EditBlogPostPageProps) {
  await requireSuperAdmin();
  const [{ postId }, { error, success }] = await Promise.all([params, searchParams]);
  const [post, categories] = await Promise.all([
    prisma.blogPost.findUnique({
      where: { id: postId },
      include: { category: true },
    }),
    prisma.blogCategory.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  if (!post) {
    notFound();
  }

  return (
    <main className="px-4 py-6 lg:px-6">
      <div className="mx-auto grid max-w-5xl gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
            href="/admin/blog"
          >
            <ArrowLeft className="size-4" />
            Back to Blog
          </Link>
          {post.status === "PUBLISHED" ? (
            <Link
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              href={`/blog/${post.slug}`}
              target="_blank"
            >
              <ExternalLink className="size-4" />
              View Public Post
            </Link>
          ) : null}
        </div>

        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
            Super Admin
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-950">
            Edit Blog Post
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Update content, metadata, publishing status, and category.
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

        <BlogPostForm
          action={updateBlogPostAction.bind(null, post.id)}
          categories={categories}
          post={post}
          submitLabel="Save Blog Post"
        />
      </div>
    </main>
  );
}
