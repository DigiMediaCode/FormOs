import Link from "next/link";
import { ArrowLeft, FilePlus2 } from "lucide-react";
import { createCmsPageAction } from "@/app/admin/pages/actions";
import { CmsPageForm } from "@/app/admin/pages/page-form";
import { requireSuperAdmin } from "@/lib/admin/auth";

export default async function NewCmsPage() {
  await requireSuperAdmin();

  return (
    <main className="px-4 py-6 lg:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        <header className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <Link
            className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-600"
            href="/admin/pages"
          >
            <ArrowLeft className="size-4" />
            Back to pages
          </Link>
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FilePlus2 className="size-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
                CMS
              </p>
              <h2 className="text-2xl font-semibold text-slate-950">New Page</h2>
            </div>
          </div>
        </header>

        <CmsPageForm action={createCmsPageAction} submitLabel="Create Page" />
      </div>
    </main>
  );
}
