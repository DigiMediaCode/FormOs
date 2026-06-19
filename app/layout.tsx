import type { Metadata } from "next";
import { Suspense } from "react";
import { GlobalPageLoader } from "@/components/ui/global-page-loader";
import { getAppUrl } from "@/lib/app-url";
import {
  getAbsoluteSocialImageUrl,
  getPlatformSettings,
} from "@/lib/platform/settings";
import "./globals.css";

function safeAppUrl() {
  try {
    const appUrl = getAppUrl();
    const hostname = new URL(appUrl).hostname;

    if (
      process.env.NODE_ENV === "production" &&
      (hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "0.0.0.0")
    ) {
      return "https://formos.com.au";
    }

    return appUrl;
  } catch {
    return "https://formos.com.au";
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPlatformSettings();
  const appUrl = safeAppUrl();
  const adsenseClientId = settings.adsenseClientId.trim();
  const socialImageUrl = getAbsoluteSocialImageUrl(settings, appUrl);
  const openGraphImages = socialImageUrl ? [{ url: socialImageUrl }] : undefined;
  const twitterImages = socialImageUrl ? [socialImageUrl] : undefined;

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
      images: openGraphImages,
    },
    twitter: {
      card: "summary_large_image",
      title: settings.metaTitle,
      description: settings.metaDescription,
      images: twitterImages,
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
    other: adsenseClientId
      ? {
          "google-adsense-account": adsenseClientId,
        }
      : undefined,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}>
          <GlobalPageLoader />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
