import type { Metadata } from "next";
import { getAppUrl } from "@/lib/app-url";
import { getPlatformSettings } from "@/lib/platform/settings";
import "./globals.css";

function safeAppUrl() {
  try {
    return getAppUrl();
  } catch {
    return "https://formos.com.au";
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPlatformSettings();
  const appUrl = safeAppUrl();

  return {
    metadataBase: new URL(appUrl),
    title: settings.metaTitle,
    description: settings.metaDescription,
    applicationName: settings.siteName,
    alternates: {
      canonical: "/",
    },
    keywords: [
      "online form builder",
      "agreement form builder",
      "digital signatures",
      "signed PDF forms",
      "file upload forms",
      "office use only fields",
      "Google Drive form uploads",
      "Dropbox form uploads",
      "FormOS",
    ],
    openGraph: {
      title: settings.metaTitle,
      description: settings.metaDescription,
      url: appUrl,
      siteName: settings.siteName,
      type: "website",
      images: settings.logoUrl ? [{ url: settings.logoUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: settings.metaTitle,
      description: settings.metaDescription,
      images: settings.logoUrl ? [settings.logoUrl] : undefined,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    icons: settings.faviconUrl ? [{ url: settings.faviconUrl }] : undefined,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
