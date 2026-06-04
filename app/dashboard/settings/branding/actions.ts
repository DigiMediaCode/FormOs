"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUserPlanAccess } from "@/lib/plans/limits";
import {
  DEFAULT_WORKSPACE_BRANDING,
  updateWorkspaceBranding,
  type WorkspaceBranding,
} from "@/lib/workspaces/branding";
import {
  getOrCreateUserWorkspace,
  requireWorkspaceOwner,
} from "@/lib/workspaces/access";

const BRANDING_PATH = "/dashboard/settings/branding";

function redirectWith(type: "success" | "error", message: string): never {
  redirect(`${BRANDING_PATH}?${type}=${encodeURIComponent(message)}`);
}

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function updateBrandingSettings(formData: FormData) {
  const context = await requireWorkspaceOwner();
  const access = await getUserPlanAccess(context.ownerId);

  if (!access.limits.allowCustomBranding) {
    redirectWith("error", "Custom branding is not included in your current plan.");
  }

  await getOrCreateUserWorkspace(context.ownerId);

  const branding: WorkspaceBranding = {
    logoUrl: readString(formData, "logoUrl"),
    primaryColor:
      readString(formData, "primaryColor") ||
      DEFAULT_WORKSPACE_BRANDING.primaryColor,
    publicFooterText: readString(formData, "publicFooterText"),
    hidePoweredBy: formData.get("hidePoweredBy") === "on",
  };

  try {
    await updateWorkspaceBranding(context.ownerId, branding);
  } catch (error) {
    redirectWith(
      "error",
      error instanceof Error ? error.message : "Unable to save branding settings.",
    );
  }

  revalidatePath(BRANDING_PATH);
  revalidatePath("/f/[formSlug]", "page");
  redirectWith("success", "Branding settings saved.");
}
