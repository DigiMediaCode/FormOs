import Link from "next/link";
import { Archive, BookOpen, ExternalLink, Pencil, Plus, Sparkles } from "lucide-react";
import {
  archiveBlogPostAction,
  seedDefaultBlogPostAction,
} from "@/app/admin/blog/actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { seedDefaultBlogPostIfMissing } from "@/lib/blog/posts";
import { prisma } from "@/lib/prisma";

type AdminBlogPageProps = {
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

export default async function AdminBlogPage({ searchParams }: AdminBlogPageProps) {
  const user = await requireSuperAdmin();
  await seedDefaultBlogPostIfMissing(user.id);
  const { error, success } = await searchParams;
  const posts = await prisma.blogPost.findMany({
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
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">Blog</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Create SEO-friendly posts for product education, announcements, and tutorials.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <form action={seedDefaultBlogPostAction}>
              <SubmitButton
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
                pendingText="Checking posts..."
                showStatus={false}
              >
                <Sparkles className="size-4 text-blue-600" />
                Seed Starter Posts
              </SubmitButton>
            </form>
            <Link
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              href="/admin/blog/new"
            >
              <Plus className="size-4" />
              New Post
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
            <table className="min-w-[980px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Post</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Published</th>
                  <th className="px-4 py-3 font-semibold">Updated</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {posts.map((post) => (
                  <tr className="align-top" key={post.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <BookOpen className="size-4" />
                        </span>
                        <div>
                          <p className="font-semibold text-slate-950">{post.title}</p>
                          <p className="mt-0.5 text-xs text-slate-500">/blog/{post.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(post.status)}`}>
                        {post.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {post.category?.name ?? "None"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {formatDate(post.publishedAt)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {formatDate(post.updatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {post.status === "PUBLISHED" ? (
                          <Link
                            aria-label={`View ${post.title}`}
                            className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                            href={`/blog/${post.slug}`}
                            title="View public post"
                          >
                            <ExternalLink className="size-4" />
                          </Link>
                        ) : null}
                        <Link
                          aria-label={`Edit ${post.title}`}
                          className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                          href={`/admin/blog/${post.id}`}
                          title="Edit"
                        >
                          <Pencil className="size-4" />
                        </Link>
                        <form action={archiveBlogPostAction.bind(null, post.id)}>
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
                {posts.length === 0 ? (
                  <tr>
                    <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={6}>
                      No blog posts yet. Seed the draft or create your first post.
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
