"use server";

import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { updatePlatformSettings } from "@/lib/platform/settings";

function redirectToSettings(messageType: "error" | "success", message: string): never {
  redirect(`/admin/settings?${messageType}=${encodeURIComponent(message)}`);
}

export async function savePlatformSettingsAction(formData: FormData) {
  await requireSuperAdmin();

  try {
    await updatePlatformSettings({
      siteName: String(formData.get("siteName") ?? ""),
      metaTitle: String(formData.get("metaTitle") ?? ""),
      metaDescription: String(formData.get("metaDescription") ?? ""),
      logoUrl: String(formData.get("logoUrl") ?? ""),
      faviconUrl: String(formData.get("faviconUrl") ?? ""),
    });
  } catch (error) {
    redirectToSettings(
      "error",
      error instanceof Error ? error.message : "Unable to save platform settings.",
    );
  }

  redirectToSettings("success", "Platform settings saved.");
}
