import Link from "next/link";
import { Archive, ExternalLink, FileText, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import {
  archiveCmsPageAction,
  deleteCmsPageAction,
  seedDefaultCmsPagesAction,
} from "@/app/admin/pages/actions";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { seedDefaultCmsPagesIfMissing } from "@/lib/cms/pages";
import { prisma } from "@/lib/prisma";

type AdminPagesPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

function formatDate(date: Date) {
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

export default async function AdminPagesPage({ searchParams }: AdminPagesPageProps) {
  const user = await requireSuperAdmin();
  await seedDefaultCmsPagesIfMissing(user.id);
  const { error, success } = await searchParams;
  const pages = await prisma.cmsPage.findMany({
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });

  return (
    <main className="px-4 py-6 lg:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
              Super Admin
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">CMS Pages</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Create public pages and decide which pages appear in the header or footer.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <form action={seedDefaultCmsPagesAction}>
              <SubmitButton
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
                pendingText="Checking pages..."
                showStatus={false}
              >
                <Sparkles className="size-4 text-blue-600" />
                Seed Defaults
              </SubmitButton>
            </form>
            <Link
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              href="/admin/pages/new"
            >
              <Plus className="size-4" />
              New Page
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
            <table className="min-w-[920px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Page</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Menu</th>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Updated</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pages.map((page) => (
                  <tr className="align-top" key={page.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <FileText className="size-4" />
                        </span>
                        <div>
                          <p className="font-semibold text-slate-950">{page.title}</p>
                          <p className="mt-0.5 text-xs text-slate-500">/p/{page.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(page.status)}`}>
                        {page.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <div className="flex flex-wrap gap-1.5">
                        {page.showInHeader ? (
                          <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">Header</span>
                        ) : null}
                        {page.showInFooter ? (
                          <span className="rounded-full bg-indigo-50 px-2 py-1 text-indigo-700">Footer</span>
                        ) : null}
                        {!page.showInHeader && !page.showInFooter ? (
                          <span className="text-slate-400">Hidden</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{page.sortOrder}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDate(page.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {page.status === "PUBLISHED" ? (
                          <Link
                            aria-label={`View ${page.title}`}
                            className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                            href={`/p/${page.slug}`}
                            title="View public page"
                          >
                            <ExternalLink className="size-4" />
                          </Link>
                        ) : null}
                        <Link
                          aria-label={`Edit ${page.title}`}
                          className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                          href={`/admin/pages/${page.id}`}
                          title="Edit"
                        >
                          <Pencil className="size-4" />
                        </Link>
                        <form action={archiveCmsPageAction.bind(null, page.id)}>
                          <SubmitButton
                            className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
                            pendingText="Archiving..."
                            showStatus={false}
                            title="Archive"
                          >
                            <Archive className="size-4" />
                          </SubmitButton>
                        </form>
                        <form action={deleteCmsPageAction.bind(null, page.id)}>
                          <ConfirmSubmitButton
                            className="inline-flex size-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 shadow-sm transition hover:bg-red-50"
                            confirmMessage="Delete this page? This cannot be undone."
                            pendingText="Deleting..."
                            title="Delete"
                          >
                            <Trash2 className="size-4" />
                          </ConfirmSubmitButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
                {pages.length === 0 ? (
                  <tr>
                    <td className="px-4 py-10 text-center text-sm text-slate-500" colSpan={6}>
                      No CMS pages yet. Seed defaults or create your first page.
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
