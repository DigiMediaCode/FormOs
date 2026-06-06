import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, FileText } from "lucide-react";
import { updateCmsPageAction } from "@/app/admin/pages/actions";
import { CmsPageForm } from "@/app/admin/pages/page-form";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

type EditCmsPageProps = {
  params: Promise<{
    pageId: string;
  }>;
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function EditCmsPage({
  params,
  searchParams,
}: EditCmsPageProps) {
  await requireSuperAdmin();
  const { pageId } = await params;
  const { error, success } = await searchParams;
  const page = await prisma.cmsPage.findUnique({
    where: { id: pageId },
  });

  if (!page) {
    notFound();
  }

  return (
    <main className="px-4 py-6 lg:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-600"
              href="/admin/pages"
            >
              <ArrowLeft className="size-4" />
              Back to pages
            </Link>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FileText className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
                  CMS
                </p>
                <h2 className="text-2xl font-semibold text-slate-950">{page.title}</h2>
                <p className="mt-1 text-xs text-slate-500">/p/{page.slug}</p>
              </div>
            </div>
          </div>
          {page.status === "PUBLISHED" ? (
            <Link
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
              href={`/p/${page.slug}`}
            >
              <ExternalLink className="size-4" />
              View Public Page
            </Link>
          ) : null}
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

        <CmsPageForm
          action={updateCmsPageAction.bind(null, page.id)}
          page={page}
          submitLabel="Save Page"
        />
      </div>
    </main>
  );
}
