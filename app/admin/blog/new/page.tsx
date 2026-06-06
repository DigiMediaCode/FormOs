import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createBlogPostAction } from "@/app/admin/blog/actions";
import { BlogPostForm } from "@/app/admin/blog/blog-post-form";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

type NewBlogPostPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function NewBlogPostPage({ searchParams }: NewBlogPostPageProps) {
  await requireSuperAdmin();
  const { error } = await searchParams;
  const categories = await prisma.blogCategory.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <main className="px-4 py-6 lg:px-6">
      <div className="mx-auto grid max-w-5xl gap-5">
        <Link
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
          href="/admin/blog"
        >
          <ArrowLeft className="size-4" />
          Back to Blog
        </Link>
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
            Super Admin
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-950">
            New Blog Post
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Create a draft, publish immediately, or prepare content for later.
          </p>
        </header>

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <BlogPostForm
          action={createBlogPostAction}
          categories={categories}
          submitLabel="Create Blog Post"
        />
      </div>
    </main>
  );
}
