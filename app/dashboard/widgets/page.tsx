import { FormStatus } from "@prisma/client";
import Link from "next/link";
import { Code2, FileText, Plus } from "lucide-react";
import { FormEmbedCard } from "@/components/forms/form-embed-card";
import { getAppUrl } from "@/lib/app-url";
import { getUserForms } from "@/lib/forms/actions";
import { getUserEffectiveLimits } from "@/lib/plans/limits";
import { requireWorkspaceMember } from "@/lib/workspaces/access";

type WidgetsPageProps = {
  searchParams: Promise<{
    formId?: string;
  }>;
};

function statusBadgeClass(status: FormStatus) {
  return {
    ARCHIVED: "border-slate-200 bg-slate-100 text-slate-700",
    DRAFT: "border-amber-200 bg-amber-50 text-amber-800",
    PUBLISHED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  }[status];
}

export default async function WidgetsPage({ searchParams }: WidgetsPageProps) {
  const context = await requireWorkspaceMember();
  const [{ formId }, forms, limits] = await Promise.all([
    searchParams,
    getUserForms(),
    getUserEffectiveLimits(context.ownerId),
  ]);

  const selectedForm =
    forms.find((form) => form.id === formId) ??
    forms.find((form) => form.status === FormStatus.PUBLISHED) ??
    forms[0] ??
    null;
  const appUrl = getAppUrl();

  return (
    <main className="min-h-screen px-4 py-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
                Widget
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                Embed Form Widget
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Design the embedded form widget, preview it safely, then copy the
                iframe or auto-height JavaScript code for your website.
              </p>
            </div>
            <Link
              className="inline-flex w-fit items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-950/15 transition hover:bg-blue-700"
              href="/dashboard/forms/new"
            >
              <Plus className="h-4 w-4" />
              New Form
            </Link>
          </div>
        </header>

        {forms.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-blue-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <FileText className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-slate-950">
              Create a form before building a widget.
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
              The embed widget needs a FormOS form to load inside your website.
              Create a workflow first, then come back here to copy the widget code.
            </p>
            <Link
              className="mt-5 inline-flex rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              href="/dashboard/forms/new"
            >
              Create Form
            </Link>
          </section>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[18rem_minmax(0,1fr)]">
            <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm xl:sticky xl:top-24 xl:self-start">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-blue-600" />
                <h2 className="text-sm font-semibold text-slate-950">
                  Choose form
                </h2>
              </div>
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1 xl:grid xl:overflow-visible xl:pb-0">
                {forms.map((form) => {
                  const selected = selectedForm?.id === form.id;

                  return (
                    <Link
                      className={`min-w-[72%] rounded-2xl border p-3 text-left transition xl:min-w-0 ${
                        selected
                          ? "border-blue-200 bg-blue-50"
                          : "border-slate-200 bg-slate-50 hover:border-blue-200 hover:bg-white"
                      }`}
                      href={`/dashboard/widgets?formId=${form.id}`}
                      key={form.id}
                    >
                      <span className="block truncate text-sm font-semibold text-slate-950">
                        {form.title}
                      </span>
                      <span
                        className={`mt-2 inline-flex rounded-md border px-2 py-1 text-[11px] font-semibold ${statusBadgeClass(
                          form.status,
                        )}`}
                      >
                        {form.status}
                      </span>
                      <span className="mt-2 block text-xs text-slate-500">
                        {form._count.submissions} submissions
                      </span>
                    </Link>
                  );
                })}
              </div>
            </aside>

            <section className="min-w-0">
              {selectedForm ? (
                <FormEmbedCard
                  allowEmbeds={limits.allowEmbeds}
                  embedUrl={`${appUrl}/embed/forms/${selectedForm.id}`}
                  formId={selectedForm.id}
                  isPublished={selectedForm.status === FormStatus.PUBLISHED}
                  scriptUrl={`${appUrl}/embed.js`}
                />
              ) : null}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
