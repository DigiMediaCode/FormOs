import "server-only";

import { existsSync } from "node:fs";
import { join } from "node:path";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type PlatformSettings = {
  siteName: string;
  metaTitle: string;
  metaDescription: string;
  logoUrl: string;
  faviconUrl: string;
};

const PLATFORM_SETTING_KEYS = [
  "siteName",
  "metaTitle",
  "metaDescription",
  "logoUrl",
  "faviconUrl",
] as const;

type PlatformSettingKey = (typeof PLATFORM_SETTING_KEYS)[number];

function publicFileExists(path: string) {
  return existsSync(join(process.cwd(), "public", path.replace(/^\/+/, "")));
}

function defaultLogoUrl() {
  if (publicFileExists("/formos-logo-v2.png")) {
    return "/formos-logo-v2.png";
  }

  if (publicFileExists("/formos-logo.png")) {
    return "/formos-logo.png";
  }

  if (publicFileExists("/pdf-logo.png")) {
    return "/pdf-logo.png";
  }

  return "";
}

function defaultFaviconUrl() {
  return publicFileExists("/favicon.ico") ? "/favicon.ico" : "";
}

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  siteName: "FormOS",
  metaTitle: "FormOS — Online Form Builder",
  metaDescription:
    "Create online forms, agreements, signatures, file uploads, and completed PDFs with FormOS.",
  logoUrl: defaultLogoUrl(),
  faviconUrl: defaultFaviconUrl(),
};

function isPlatformSettingKey(key: string): key is PlatformSettingKey {
  return PLATFORM_SETTING_KEYS.includes(key as PlatformSettingKey);
}

function readSettingString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function isSafePublicUrlOrPath(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return true;
  }

  if (trimmed.startsWith("/")) {
    return !trimmed.startsWith("//") && !trimmed.includes("\\");
  }

  try {
    const url = new URL(trimmed);

    if (url.protocol === "https:") {
      return true;
    }

    return process.env.NODE_ENV !== "production" && url.protocol === "http:";
  } catch {
    return false;
  }
}

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const rows = await prisma.platformSetting.findMany({
    where: {
      key: {
        in: [...PLATFORM_SETTING_KEYS],
      },
    },
    select: {
      key: true,
      value: true,
    },
  });
  const settings = { ...DEFAULT_PLATFORM_SETTINGS };

  for (const row of rows) {
    if (isPlatformSettingKey(row.key)) {
      settings[row.key] = readSettingString(row.value);
    }
  }

  return settings;
}

export async function getPlatformSettingValue(key: PlatformSettingKey) {
  const settings = await getPlatformSettings();
  return settings[key];
}

export async function updatePlatformSettings(input: PlatformSettings) {
  const nextSettings: PlatformSettings = {
    siteName: input.siteName.trim() || DEFAULT_PLATFORM_SETTINGS.siteName,
    metaTitle: input.metaTitle.trim() || DEFAULT_PLATFORM_SETTINGS.metaTitle,
    metaDescription:
      input.metaDescription.trim() || DEFAULT_PLATFORM_SETTINGS.metaDescription,
    logoUrl: input.logoUrl.trim(),
    faviconUrl: input.faviconUrl.trim(),
  };

  if (!isSafePublicUrlOrPath(nextSettings.logoUrl)) {
    throw new Error("Logo URL must be a path starting with / or a valid HTTPS URL.");
  }

  if (!isSafePublicUrlOrPath(nextSettings.faviconUrl)) {
    throw new Error("Favicon URL must be a path starting with / or a valid HTTPS URL.");
  }

  await prisma.$transaction(
    PLATFORM_SETTING_KEYS.map((key) =>
      prisma.platformSetting.upsert({
        where: {
          key,
        },
        create: {
          key,
          value: nextSettings[key] as unknown as Prisma.InputJsonValue,
        },
        update: {
          value: nextSettings[key] as unknown as Prisma.InputJsonValue,
        },
      }),
    ),
  );

  return nextSettings;
}

export function canRenderLocalPublicAsset(path: string) {
  return path.startsWith("/") && !path.startsWith("//") && publicFileExists(path);
}

export function getRenderablePlatformLogoUrl(settings: Pick<PlatformSettings, "logoUrl">) {
  if (settings.logoUrl.startsWith("https://")) {
    return settings.logoUrl;
  }

  if (
    process.env.NODE_ENV !== "production" &&
    settings.logoUrl.startsWith("http://")
  ) {
    return settings.logoUrl;
  }

  if (canRenderLocalPublicAsset(settings.logoUrl)) {
    return settings.logoUrl;
  }

  const fallbackLogoUrl = defaultLogoUrl();
  return fallbackLogoUrl || "";
}
