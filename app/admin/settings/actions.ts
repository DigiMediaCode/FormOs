"use server";

import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { saveMediaFile } from "@/lib/media/storage";
import { updatePlatformSettings } from "@/lib/platform/settings";

function redirectToSettings(messageType: "error" | "success", message: string): never {
  redirect(`/admin/settings?${messageType}=${encodeURIComponent(message)}`);
}

function assertImageUpload(file: File, label: string) {
  if (!file.type.startsWith("image/")) {
    throw new Error(`${label} must be an image file.`);
  }
}

export async function savePlatformSettingsAction(formData: FormData) {
  const user = await requireSuperAdmin();

  try {
    const logoFile = formData.get("logoFile");
    const faviconFile = formData.get("faviconFile");
    if (logoFile instanceof File && logoFile.size > 0) {
      assertImageUpload(logoFile, "Logo");
    }
    if (faviconFile instanceof File && faviconFile.size > 0) {
      assertImageUpload(faviconFile, "Favicon");
    }
    const uploadedLogo =
      logoFile instanceof File && logoFile.size > 0
        ? await saveMediaFile({
            file: logoFile,
            altText: "Platform logo",
            createdById: user.id,
          })
        : null;
    const uploadedFavicon =
      faviconFile instanceof File && faviconFile.size > 0
        ? await saveMediaFile({
            file: faviconFile,
            altText: "Platform favicon",
            createdById: user.id,
          })
        : null;

    await updatePlatformSettings({
      siteName: String(formData.get("siteName") ?? ""),
      metaTitle: String(formData.get("metaTitle") ?? ""),
      metaDescription: String(formData.get("metaDescription") ?? ""),
      logoUrl: uploadedLogo?.publicPath ?? String(formData.get("logoUrl") ?? ""),
      faviconUrl: uploadedFavicon?.publicPath ?? String(formData.get("faviconUrl") ?? ""),
      companyName: String(formData.get("companyName") ?? ""),
      footerProjectText: String(formData.get("footerProjectText") ?? ""),
      supportEmail: String(formData.get("supportEmail") ?? ""),
      contactEmail: String(formData.get("contactEmail") ?? ""),
      privacyPolicyUrl: String(formData.get("privacyPolicyUrl") ?? ""),
      termsUrl: String(formData.get("termsUrl") ?? ""),
      dataSecurityUrl: String(formData.get("dataSecurityUrl") ?? ""),
      contactUrl: String(formData.get("contactUrl") ?? ""),
      showLandingPageAds: formData.get("showLandingPageAds") === "on",
      showPublicFormAds: formData.get("showPublicFormAds") === "on",
      enablePoweredByBranding: formData.get("enablePoweredByBranding") === "on",
      adsEnabled: formData.get("adsEnabled") === "on",
      adsenseClientId: String(formData.get("adsenseClientId") ?? ""),
      landingTopAdSlot: String(formData.get("landingTopAdSlot") ?? ""),
      landingMiddleAdSlot: String(formData.get("landingMiddleAdSlot") ?? ""),
      landingBottomAdSlot: String(formData.get("landingBottomAdSlot") ?? ""),
      publicFormAdSlot: String(formData.get("publicFormAdSlot") ?? ""),
      publicFormAdFrequency: Number(formData.get("publicFormAdFrequency") ?? 4),
      publicFormAdLabel: String(formData.get("publicFormAdLabel") ?? ""),
    });
  } catch (error) {
    redirectToSettings(
      "error",
      error instanceof Error ? error.message : "Unable to save platform settings.",
    );
  }

  redirectToSettings("success", "Platform settings saved.");
}
