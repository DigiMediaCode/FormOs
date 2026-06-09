import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import prisma from "~/db.server";

export type FormosFormSummary = {
  id: string;
  title: string;
  status: string;
  mode: string;
  updatedAt: string;
  embedUrl: string;
};

export type FormosFormsResponse = {
  data?: FormosFormSummary[];
};

function encryptionKey() {
  const secret = process.env.SHOPIFY_API_SECRET;

  if (!secret) {
    throw new Error("SHOPIFY_API_SECRET is required to encrypt FormOS API tokens.");
  }

  return createHash("sha256").update(secret).digest();
}

export function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export function decryptSecret(value: string) {
  const [ivValue, tagValue, encryptedValue] = value.split(".");

  if (!ivValue || !tagValue || !encryptedValue) {
    throw new Error("Stored FormOS token is not readable.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivValue, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function normalizeFormosBaseUrl(value: string) {
  const trimmed = value.trim().replace(/\/+$/, "");

  if (!trimmed) {
    throw new Error("FormOS Base URL is required.");
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("FormOS Base URL must be a valid URL.");
  }

  if (!["https:", "http:"].includes(url.protocol)) {
    throw new Error("FormOS Base URL must start with https://.");
  }

  if (url.protocol === "http:" && process.env.NODE_ENV === "production") {
    throw new Error("FormOS Base URL must use https:// in production.");
  }

  if (/javascript:|data:|<|>/i.test(trimmed)) {
    throw new Error("FormOS Base URL contains unsafe characters.");
  }

  return url.origin;
}

export async function saveFormosConnection(input: {
  shop: string;
  formosBaseUrl: string;
  formosApiToken: string;
}) {
  const formosBaseUrl = normalizeFormosBaseUrl(input.formosBaseUrl);
  const formosApiToken = input.formosApiToken.trim();

  if (!formosApiToken) {
    throw new Error("FormOS API token is required.");
  }

  return prisma.formosConnection.upsert({
    where: { shop: input.shop },
    create: {
      shop: input.shop,
      formosBaseUrl,
      formosApiTokenEncrypted: encryptSecret(formosApiToken),
      connectedAt: new Date(),
      lastError: null,
    },
    update: {
      formosBaseUrl,
      formosApiTokenEncrypted: encryptSecret(formosApiToken),
      connectedAt: new Date(),
      lastError: null,
    },
  });
}

export async function fetchFormosForms(input: {
  formosBaseUrl: string;
  apiToken: string;
}) {
  const response = await fetch(`${input.formosBaseUrl}/api/external/forms`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${input.apiToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? "FormOS rejected the API token. Check the token or create a new one."
        : `FormOS connection failed with status ${response.status}.`,
    );
  }

  const body = (await response.json()) as FormosFormsResponse | FormosFormSummary[];
  const forms = Array.isArray(body) ? body : body.data;

  if (!Array.isArray(forms)) {
    throw new Error("FormOS returned an unexpected response.");
  }

  return forms;
}

export async function testSavedConnection(shop: string) {
  const connection = await prisma.formosConnection.findUnique({
    where: { shop },
  });

  if (!connection) {
    throw new Error("Save your FormOS connection first.");
  }

  try {
    const forms = await fetchFormosForms({
      formosBaseUrl: connection.formosBaseUrl,
      apiToken: decryptSecret(connection.formosApiTokenEncrypted),
    });

    await prisma.formosConnection.update({
      where: { shop },
      data: {
        lastTestedAt: new Date(),
        lastError: null,
      },
    });

    return forms;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to connect to FormOS.";

    await prisma.formosConnection.update({
      where: { shop },
      data: {
        lastTestedAt: new Date(),
        lastError: message,
      },
    });

    throw new Error(message);
  }
}

