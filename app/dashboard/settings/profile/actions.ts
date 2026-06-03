"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

const PROFILE_PATH = "/dashboard/settings/profile";

function redirectWith(messageType: "error" | "success", message: string): never {
  redirect(`${PROFILE_PATH}?${messageType}=${encodeURIComponent(message)}`);
}

function readString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 ? value : null;
}

function isValidEmail(value: string | null) {
  if (!value) {
    return true;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function updateProfileAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const firstName = readString(formData, "firstName");
  const lastName = readString(formData, "lastName");
  const phone = readString(formData, "phone");
  const billingEmail = readString(formData, "billingEmail");

  if (!isValidEmail(billingEmail)) {
    redirectWith("error", "Billing email must be a valid email address.");
  }

  const businessData = {
    companyName: readString(formData, "companyName"),
    taxId: readString(formData, "taxId"),
    taxIdLabel: readString(formData, "taxIdLabel"),
    phone: readString(formData, "businessPhone"),
    billingEmail,
    billingName: readString(formData, "billingName"),
    addressLine1: readString(formData, "addressLine1"),
    addressLine2: readString(formData, "addressLine2"),
    city: readString(formData, "city"),
    state: readString(formData, "state"),
    postcode: readString(formData, "postcode"),
    country: readString(formData, "country"),
  };

  const name = [firstName, lastName].filter(Boolean).join(" ").trim() || user.name;

  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          firstName,
          lastName,
          phone,
          name: name || null,
        },
      }),
      prisma.businessProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          ...businessData,
          metadata: Prisma.JsonNull,
        },
        update: businessData,
      }),
    ]);
  } catch {
    redirectWith("error", "Unable to save profile right now.");
  }

  revalidatePath("/dashboard");
  revalidatePath(PROFILE_PATH);
  redirectWith("success", "Profile saved.");
}
