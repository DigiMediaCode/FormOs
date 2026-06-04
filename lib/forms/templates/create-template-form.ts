"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateUniqueSlug } from "@/lib/forms/actions";
import {
  getVehicleHireAgreementFields,
  VEHICLE_HIRE_AGREEMENT_TEMPLATE,
} from "@/lib/forms/templates/vehicle-hire-agreement";
import {
  assertCanCreateForm,
  assertCanUseFieldTypes,
  assertCanUseTemplate,
} from "@/lib/plans/limits";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceAdminOrOwner } from "@/lib/workspaces/access";

export async function createVehicleHireAgreementTemplate() {
  const context = await requireWorkspaceAdminOrOwner();

  try {
    await assertCanUseTemplate(context.ownerId);
    await assertCanUseFieldTypes(context.ownerId, getVehicleHireAgreementFields());
    await assertCanCreateForm(context.ownerId);
  } catch (error) {
    redirect(
      `/dashboard/forms/new?error=${encodeURIComponent(
        error instanceof Error &&
          error.message.startsWith("Your current plan does not allow")
          ? "Your current plan does not include all field types required for this template."
          : error instanceof Error
            ? error.message
            : "Unable to create template.",
      )}`,
    );
  }

  const form = await prisma.form.create({
    data: {
      ownerId: context.ownerId,
      title: VEHICLE_HIRE_AGREEMENT_TEMPLATE.title,
      slug: await generateUniqueSlug(context.ownerId, VEHICLE_HIRE_AGREEMENT_TEMPLATE.title),
      description: VEHICLE_HIRE_AGREEMENT_TEMPLATE.description,
      mode: VEHICLE_HIRE_AGREEMENT_TEMPLATE.mode,
      status: VEHICLE_HIRE_AGREEMENT_TEMPLATE.status,
      version: 1,
      fields: getVehicleHireAgreementFields() as unknown as Prisma.InputJsonValue,
      settings: VEHICLE_HIRE_AGREEMENT_TEMPLATE.settings,
    },
    select: {
      id: true,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/forms");
  redirect(`/dashboard/forms/${form.id}/builder`);
}
