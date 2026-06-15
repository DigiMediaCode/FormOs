"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateUniqueSlug } from "@/lib/forms/actions";
import {
  getWorkflowTemplate,
} from "@/lib/forms/templates/vertical-workflow-templates";
import { getTemplateAccessStatus } from "@/lib/forms/templates/template-access";
import { getUserPlanAccess } from "@/lib/plans/limits";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceAdminOrOwner } from "@/lib/workspaces/access";

export async function createWorkflowTemplate(formData: FormData) {
  const context = await requireWorkspaceAdminOrOwner();
  const templateSlug = String(formData.get("templateSlug") ?? "").trim();
  const template = getWorkflowTemplate(templateSlug);

  if (!template) {
    redirect(
      `/dashboard/forms/new?error=${encodeURIComponent("Template not found.")}`,
    );
  }

  const fields = template.getFields();
  const [access, activePlans] = await Promise.all([
    getUserPlanAccess(context.ownerId),
    prisma.subscriptionPlan.findMany({
      where: {
        isActive: true,
        isPublic: true,
      },
      orderBy: {
        sortOrder: "asc",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        sortOrder: true,
        limits: true,
      },
    }),
  ]);

  const templateAccess = getTemplateAccessStatus({
    access,
    activePlans,
    template,
  });

  if (!templateAccess.canCreate) {
    redirect(
      `/dashboard/forms/new?error=${encodeURIComponent(templateAccess.message)}`,
    );
  }

  const slug = await generateUniqueSlug(context.ownerId, template.title);
  const form = await prisma.$transaction(async (tx) => {
    const createdForm = await tx.form.create({
      data: {
        ownerId: context.ownerId,
        title: template.title,
        slug,
        description: template.description,
        mode: template.mode,
        status: template.status,
        version: 1,
        fields: fields as unknown as Prisma.InputJsonValue,
        settings: template.settings,
      },
      select: {
        id: true,
      },
    });

    return createdForm;
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/forms");
  redirect(`/dashboard/forms/${form.id}/builder`);
}

export async function createVehicleHireAgreementTemplate() {
  const formData = new FormData();
  formData.set("templateSlug", "vehicle-hire-agreement");
  await createWorkflowTemplate(formData);
}
