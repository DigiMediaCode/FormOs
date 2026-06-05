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
  companyName: string;
  footerProjectText: string;
  supportEmail: string;
  contactEmail: string;
  privacyPolicyUrl: string;
  termsUrl: string;
  dataSecurityUrl: string;
  contactUrl: string;
  showLandingPageAds: boolean;
  showPublicFormAds: boolean;
  enablePoweredByBranding: boolean;
  adsEnabled: boolean;
  adsenseClientId: string;
  landingTopAdSlot: string;
  landingMiddleAdSlot: string;
  landingBottomAdSlot: string;
  publicFormAdSlot: string;
  publicFormAdFrequency: number;
  publicFormAdLabel: string;
};

const PLATFORM_SETTING_KEYS = [
  "siteName",
  "metaTitle",
  "metaDescription",
  "logoUrl",
  "faviconUrl",
  "companyName",
  "footerProjectText",
  "supportEmail",
  "contactEmail",
  "privacyPolicyUrl",
  "termsUrl",
  "dataSecurityUrl",
  "contactUrl",
  "showLandingPageAds",
  "showPublicFormAds",
  "enablePoweredByBranding",
  "adsEnabled",
  "adsenseClientId",
  "landingTopAdSlot",
  "landingMiddleAdSlot",
  "landingBottomAdSlot",
  "publicFormAdSlot",
  "publicFormAdFrequency",
  "publicFormAdLabel",
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
  companyName: "DigiMedia Code LLC",
  footerProjectText: "FormOS is a project of DigiMedia Code LLC.",
  supportEmail: "",
  contactEmail: "",
  privacyPolicyUrl: "/privacy-policy",
  termsUrl: "/terms-of-service",
  dataSecurityUrl: "/data-security",
  contactUrl: "/contact",
  showLandingPageAds: false,
  showPublicFormAds: false,
  enablePoweredByBranding: true,
  adsEnabled: false,
  adsenseClientId: "",
  landingTopAdSlot: "",
  landingMiddleAdSlot: "",
  landingBottomAdSlot: "",
  publicFormAdSlot: "",
  publicFormAdFrequency: 4,
  publicFormAdLabel: "Sponsored",
};

function isPlatformSettingKey(key: string): key is PlatformSettingKey {
  return PLATFORM_SETTING_KEYS.includes(key as PlatformSettingKey);
}

function readSettingString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function readSettingBoolean(value: unknown) {
  return value === true;
}

function readSettingNumber(value: unknown, fallback: number) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function hasHtmlOrScript(value: string) {
  return /<[^>]*>|javascript:/i.test(value);
}

function isSafeSettingText(value: string) {
  return !hasHtmlOrScript(value);
}

function validatePlainTextSettings(settings: PlatformSettings) {
  const textFields: Array<[keyof PlatformSettings, string]> = [
    ["companyName", "Company name"],
    ["footerProjectText", "Footer project text"],
    ["supportEmail", "Support email"],
    ["contactEmail", "Contact email"],
    ["adsenseClientId", "AdSense client ID"],
    ["landingTopAdSlot", "Landing top ad slot"],
    ["landingMiddleAdSlot", "Landing middle ad slot"],
    ["landingBottomAdSlot", "Landing bottom ad slot"],
    ["publicFormAdSlot", "Public form ad slot"],
    ["publicFormAdLabel", "Public form ad label"],
  ];

  for (const [key, label] of textFields) {
    const value = settings[key];
    if (typeof value === "string" && !isSafeSettingText(value)) {
      throw new Error(`${label} must be plain text. Do not paste scripts or HTML.`);
    }
  }
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
      if (typeof DEFAULT_PLATFORM_SETTINGS[row.key] === "boolean") {
        settings[row.key] = readSettingBoolean(row.value) as never;
      } else if (typeof DEFAULT_PLATFORM_SETTINGS[row.key] === "number") {
        settings[row.key] = readSettingNumber(
          row.value,
          DEFAULT_PLATFORM_SETTINGS[row.key] as number,
        ) as never;
      } else {
        settings[row.key] = readSettingString(row.value) as never;
      }
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
    companyName: input.companyName.trim(),
    footerProjectText:
      input.footerProjectText.trim() || DEFAULT_PLATFORM_SETTINGS.footerProjectText,
    supportEmail: input.supportEmail.trim(),
    contactEmail: input.contactEmail.trim(),
    privacyPolicyUrl: input.privacyPolicyUrl.trim() || "/privacy-policy",
    termsUrl: input.termsUrl.trim() || "/terms-of-service",
    dataSecurityUrl: input.dataSecurityUrl.trim() || "/data-security",
    contactUrl: input.contactUrl.trim() || "/contact",
    showLandingPageAds: Boolean(input.showLandingPageAds),
    showPublicFormAds: Boolean(input.showPublicFormAds),
    enablePoweredByBranding: Boolean(input.enablePoweredByBranding),
    adsEnabled: Boolean(input.adsEnabled),
    adsenseClientId: input.adsenseClientId.trim(),
    landingTopAdSlot: input.landingTopAdSlot.trim(),
    landingMiddleAdSlot: input.landingMiddleAdSlot.trim(),
    landingBottomAdSlot: input.landingBottomAdSlot.trim(),
    publicFormAdSlot: input.publicFormAdSlot.trim(),
    publicFormAdFrequency: Math.min(
      10,
      Math.max(3, Number(input.publicFormAdFrequency) || 4),
    ),
    publicFormAdLabel:
      input.publicFormAdLabel.trim() || DEFAULT_PLATFORM_SETTINGS.publicFormAdLabel,
  };

  if (!isSafePublicUrlOrPath(nextSettings.logoUrl)) {
    throw new Error("Logo URL must be a path starting with / or a valid HTTPS URL.");
  }

  if (!isSafePublicUrlOrPath(nextSettings.faviconUrl)) {
    throw new Error("Favicon URL must be a path starting with / or a valid HTTPS URL.");
  }

  for (const key of [
    "privacyPolicyUrl",
    "termsUrl",
    "dataSecurityUrl",
    "contactUrl",
  ] as const) {
    if (!isSafePublicUrlOrPath(nextSettings[key])) {
      throw new Error(`${key} must be a path starting with / or a valid HTTPS URL.`);
    }
  }

  validatePlainTextSettings(nextSettings);

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
