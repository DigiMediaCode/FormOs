"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { saveMediaFile } from "@/lib/media/storage";

const ADMIN_MEDIA_PATH = "/admin/media";

function redirectWith(type: "success" | "error", message: string): never {
  redirect(`${ADMIN_MEDIA_PATH}?${type}=${encodeURIComponent(message)}`);
}

export async function uploadMediaAssetAction(formData: FormData) {
  const user = await requireSuperAdmin();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    redirectWith("error", "Please choose an image file.");
  }

  try {
    await saveMediaFile({
      file,
      altText: String(formData.get("altText") ?? ""),
      createdById: user.id,
    });
  } catch (error) {
    redirectWith(
      "error",
      error instanceof Error ? error.message : "Unable to upload media.",
    );
  }

  revalidatePath(ADMIN_MEDIA_PATH);
  redirectWith("success", "Media uploaded.");
}
