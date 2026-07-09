import { redirect } from "next/navigation";
import {
  TemplateGallery,
  type TemplateGalleryCard,
} from "@/components/dashboard/template-gallery";
import { createWorkflowTemplate } from "@/lib/forms/templates/create-template-form";
import { getTemplateAccessStatus } from "@/lib/forms/templates/template-access";
import { WORKFLOW_TEMPLATES } from "@/lib/forms/templates/vertical-workflow-templates";
import { getUserPlanAccess } from "@/lib/plans/limits";
import { prisma } from "@/lib/prisma";
import {
  canManageWorkspaceForms,
  requireWorkspaceMember,
} from "@/lib/workspaces/access";

export default async function DashboardTemplatesPage() {
  const context = await requireWorkspaceMember();

  if (!canManageWorkspaceForms(context)) {
    redirect("/dashboard/forms");
  }

  const [access, activePlans] = await Promise.all([
    getUserPlanAccess(context.ownerId),
    prisma.subscriptionPlan.findMany({
      where: { isActive: true, isPublic: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true, sortOrder: true, limits: true },
    }),
  ]);

  const templates: TemplateGalleryCard[] = WORKFLOW_TEMPLATES.map((template) => {
    const templateAccess = getTemplateAccessStatus({
      access,
      activePlans,
      template,
    });

    return {
      slug: template.slug,
      title: template.title,
      category: template.category,
      description: template.description,
      canCreate: templateAccess.canCreate,
      ctaLabel: templateAccess.ctaLabel,
      minimumPlanName: templateAccess.minimumPlanName,
    };
  });

  return (
    <main className="min-h-screen px-4 py-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
            Workspace
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:mt-2 sm:text-3xl">
            Templates
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-600 sm:mt-2">
            Start from a complete business workflow — signatures, uploads,
            conditional fields, office processing, and PDFs. One click creates a
            Draft form you can customize.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
          <TemplateGallery
            createAction={createWorkflowTemplate}
            templates={templates}
          />
        </section>
      </div>
    </main>
  );
}
