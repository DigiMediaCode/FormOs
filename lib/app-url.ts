import "server-only";

const DEVELOPMENT_APP_URL = "http://127.0.0.1:3001";

function normalizeAppUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function isInternalBindUrl(value: string) {
  try {
    return new URL(value).hostname === "0.0.0.0";
  } catch {
    return false;
  }
}

export function getAppUrl() {
  const configuredUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;

  if (configuredUrl) {
    const appUrl = normalizeAppUrl(configuredUrl);

    if (!isInternalBindUrl(appUrl)) {
      return appUrl;
    }
  }

  if (process.env.NODE_ENV !== "production") {
    return DEVELOPMENT_APP_URL;
  }

  throw new Error(
    "APP_URL or NEXT_PUBLIC_APP_URL must be configured with the public FormOS URL.",
  );
}

export function getAppRedirectUrl(path: string) {
  return new URL(path, `${getAppUrl()}/`);
}
