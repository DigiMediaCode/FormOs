"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  clearGoogleDriveUploadFolder,
  saveGoogleDriveUploadFolder,
} from "@/lib/integrations/google-drive/client";

function redirectToIntegrations(messageType: "error" | "success", message: string): never {
  redirect(
    `/dashboard/settings/integrations?${messageType}=${encodeURIComponent(message)}`,
  );
}

async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function saveGoogleDriveUploadFolderAction(formData: FormData) {
  const user = await requireUser();
  const folderInput = String(formData.get("folderInput") ?? "").trim();

  if (!folderInput) {
    redirectToIntegrations("error", "Enter a Google Drive folder URL or folder ID.");
  }

  try {
    await saveGoogleDriveUploadFolder(user.id, folderInput);
  } catch (error) {
    redirectToIntegrations(
      "error",
      error instanceof Error ? error.message : "Unable to save that Google Drive folder.",
    );
  }

  redirectToIntegrations("success", "Google Drive upload folder saved.");
}

export async function clearGoogleDriveUploadFolderAction() {
  const user = await requireUser();

  try {
    await clearGoogleDriveUploadFolder(user.id);
  } catch (error) {
    redirectToIntegrations(
      "error",
      error instanceof Error ? error.message : "Unable to clear the Google Drive upload folder.",
    );
  }

  redirectToIntegrations("success", "Google Drive upload folder cleared.");
}
