import "server-only";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { generateUniqueSlug } from "@/lib/forms/actions";
import { getWorkflowTemplate } from "@/lib/forms/templates/vertical-workflow-templates";
import { getTemplateAccessStatus } from "@/lib/forms/templates/template-access";
import { getUserPlanAccess } from "@/lib/plans/limits";
import { prisma } from "@/lib/prisma";

export type ApplyTemplateResult =
  | { ok: true; formId: string }
  | { ok: false; reason: string };

/**
 * Creates a Draft form from a workflow template for the given owner, enforcing
 * the same plan/access rules as the dashboard template picker. Returns the new
 * form id instead of redirecting, so it can be reused by the dashboard action,
 * the post-trial signup flow, and the one-click "apply template" route.
 */
export async function createTemplateFormForOwner({
  ownerId,
  templateSlug,
}: {
  ownerId: string;
  templateSlug: string;
}): Promise<ApplyTemplateResult> {
  const template = getWorkflowTemplate(templateSlug);

  if (!template) {
    return { ok: false, reason: "Template not found." };
  }

  const [access, activePlans] = await Promise.all([
    getUserPlanAccess(ownerId),
    prisma.subscriptionPlan.findMany({
      where: { isActive: true, isPublic: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true, sortOrder: true, limits: true },
    }),
  ]);

  const templateAccess = getTemplateAccessStatus({
    access,
    activePlans,
    template,
  });

  if (!templateAccess.canCreate) {
    return { ok: false, reason: templateAccess.message };
  }

  const fields = template.getFields();
  const slug = await generateUniqueSlug(ownerId, template.title);
  const form = await prisma.form.create({
    data: {
      ownerId,
      title: template.title,
      slug,
      description: template.description,
      mode: template.mode,
      status: template.status,
      version: 1,
      fields: fields as unknown as Prisma.InputJsonValue,
      settings: template.settings,
    },
    select: { id: true },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/forms");

  return { ok: true, formId: form.id };
}
