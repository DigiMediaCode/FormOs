"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  clearGoogleDriveUploadFolder,
  saveGoogleDriveUploadFolder,
} from "@/lib/integrations/google-drive/client";
import {
  clearDropboxUploadFolder,
  saveDropboxUploadFolder,
} from "@/lib/integrations/dropbox/client";
import { setActiveUploadProvider } from "@/lib/integrations/upload-settings";
import { StorageProvider } from "@prisma/client";

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

export async function saveDropboxUploadFolderAction(formData: FormData) {
  const user = await requireUser();
  const folderPath = String(formData.get("folderPath") ?? "").trim();

  if (!folderPath) {
    redirectToIntegrations("error", "Enter a Dropbox folder path.");
  }

  try {
    await saveDropboxUploadFolder(user.id, folderPath);
  } catch (error) {
    redirectToIntegrations(
      "error",
      error instanceof Error ? error.message : "Unable to save that Dropbox folder path.",
    );
  }

  redirectToIntegrations("success", "Dropbox upload folder saved.");
}

export async function clearDropboxUploadFolderAction() {
  const user = await requireUser();

  try {
    await clearDropboxUploadFolder(user.id);
  } catch (error) {
    redirectToIntegrations(
      "error",
      error instanceof Error ? error.message : "Unable to clear the Dropbox upload folder.",
    );
  }

  redirectToIntegrations("success", "Dropbox upload folder cleared.");
}

export async function setActiveUploadProviderAction(formData: FormData) {
  const user = await requireUser();
  const provider = String(formData.get("provider") ?? "");

  if (provider !== StorageProvider.GOOGLE_DRIVE && provider !== StorageProvider.DROPBOX) {
    redirectToIntegrations("error", "Choose a valid upload storage provider.");
  }

  try {
    await setActiveUploadProvider(user.id, provider as StorageProvider);
  } catch (error) {
    redirectToIntegrations(
      "error",
      error instanceof Error ? error.message : "Unable to set active upload provider.",
    );
  }

  redirectToIntegrations("success", "Active upload provider updated.");
}
