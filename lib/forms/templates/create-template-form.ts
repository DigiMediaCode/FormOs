"use server";

import { redirect } from "next/navigation";
import { createTemplateFormForOwner } from "@/lib/forms/templates/apply-template";
import { requireWorkspaceAdminOrOwner } from "@/lib/workspaces/access";

export async function createWorkflowTemplate(formData: FormData) {
  const context = await requireWorkspaceAdminOrOwner();
  const templateSlug = String(formData.get("templateSlug") ?? "").trim();

  const result = await createTemplateFormForOwner({
    ownerId: context.ownerId,
    templateSlug,
  });

  if (!result.ok) {
    redirect(`/dashboard/forms/new?error=${encodeURIComponent(result.reason)}`);
  }

  redirect(`/dashboard/forms/${result.formId}/builder`);
}

export async function createVehicleHireAgreementTemplate() {
  const formData = new FormData();
  formData.set("templateSlug", "vehicle-hire-agreement");
  await createWorkflowTemplate(formData);
}
