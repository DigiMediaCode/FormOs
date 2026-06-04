import "server-only";

import { Prisma } from "@prisma/client";
import {
  canRenderLocalPublicAsset,
  isSafePublicUrlOrPath,
} from "@/lib/platform/settings";
import { getUserPlanAccess } from "@/lib/plans/limits";
import { prisma } from "@/lib/prisma";

export type WorkspaceBranding = {
  logoUrl: string;
  primaryColor: string;
  publicFooterText: string;
  hidePoweredBy: boolean;
};

export const DEFAULT_WORKSPACE_BRANDING: WorkspaceBranding = {
  logoUrl: "",
  primaryColor: "#2563eb",
  publicFooterText: "",
  hidePoweredBy: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readBoolean(value: unknown) {
  return value === true;
}

export function normalizeBranding(value: unknown): WorkspaceBranding {
  const source = isRecord(value) && isRecord(value.branding)
    ? value.branding
    : isRecord(value)
      ? value
      : {};

  return {
    logoUrl: readString(source.logoUrl),
    primaryColor: readString(source.primaryColor) || DEFAULT_WORKSPACE_BRANDING.primaryColor,
    publicFooterText: readString(source.publicFooterText),
    hidePoweredBy: readBoolean(source.hidePoweredBy),
  };
}

export function validateBranding(input: WorkspaceBranding) {
  if (!isSafePublicUrlOrPath(input.logoUrl)) {
    throw new Error("Logo URL must be a path starting with / or a valid HTTPS URL.");
  }

  if (!/^#[0-9a-fA-F]{6}$/.test(input.primaryColor)) {
    throw new Error("Brand color must be a valid hex color, for example #2563eb.");
  }

  if (input.publicFooterText.length > 120) {
    throw new Error("Footer text must be 120 characters or fewer.");
  }
}

export function renderableWorkspaceLogoUrl(branding: Pick<WorkspaceBranding, "logoUrl">) {
  if (branding.logoUrl.startsWith("https://")) {
    return branding.logoUrl;
  }

  if (
    process.env.NODE_ENV !== "production" &&
    branding.logoUrl.startsWith("http://")
  ) {
    return branding.logoUrl;
  }

  if (canRenderLocalPublicAsset(branding.logoUrl)) {
    return branding.logoUrl;
  }

  return "";
}

export async function getWorkspaceBranding(ownerId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { ownerId },
    select: {
      metadata: true,
    },
  });

  return normalizeBranding(workspace?.metadata);
}

export async function updateWorkspaceBranding(ownerId: string, input: WorkspaceBranding) {
  validateBranding(input);

  const existing = await prisma.workspace.findUnique({
    where: { ownerId },
    select: {
      metadata: true,
    },
  });
  const existingMetadata = isRecord(existing?.metadata) ? existing.metadata : {};

  await prisma.workspace.update({
    where: { ownerId },
    data: {
      metadata: {
        ...existingMetadata,
        branding: input,
      } as unknown as Prisma.InputJsonValue,
    },
  });
}

export async function getPublicWorkspaceBranding(ownerId: string) {
  const access = await getUserPlanAccess(ownerId);

  if (!access.limits.allowCustomBranding) {
    return null;
  }

  const branding = await getWorkspaceBranding(ownerId);
  const logoUrl = renderableWorkspaceLogoUrl(branding);

  return {
    ...branding,
    logoUrl,
  };
}
