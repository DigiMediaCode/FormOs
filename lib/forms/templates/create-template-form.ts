"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
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

export async function createVehicleHireAgreementTemplate() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  try {
    await assertCanUseTemplate(user.id);
    await assertCanUseFieldTypes(user.id, getVehicleHireAgreementFields());
    await assertCanCreateForm(user.id);
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
      ownerId: user.id,
      title: VEHICLE_HIRE_AGREEMENT_TEMPLATE.title,
      slug: await generateUniqueSlug(user.id, VEHICLE_HIRE_AGREEMENT_TEMPLATE.title),
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
