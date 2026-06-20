import "server-only";

import { Buffer } from "node:buffer";
import { IntegrationProvider, Prisma, StorageProvider } from "@prisma/client";
import { extractSubmitterName, sanitizeDriveFolderName } from "@/lib/integrations/google-drive/client";
import {
  decryptIntegrationToken,
  encryptIntegrationToken,
} from "@/lib/integrations/tokens";
import { clearActiveUploadProviderIfMatches } from "@/lib/integrations/upload-settings";
import type { FormBuilderField } from "@/lib/forms/fields";
import { prisma } from "@/lib/prisma";

const DROPBOX_AUTH_URL = "https://www.dropbox.com/oauth2/authorize";
const DROPBOX_TOKEN_URL = "https://api.dropboxapi.com/oauth2/token";
const DROPBOX_CREATE_FOLDER_URL = "https://api.dropboxapi.com/2/files/create_folder_v2";
const DROPBOX_UPLOAD_URL = "https://content.dropboxapi.com/2/files/upload";
const DEFAULT_DROPBOX_UPLOAD_PATH = "/FormOS Uploads";
export const DROPBOX_SCOPE = "files.content.write";

type DropboxTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  account_id?: string;
  error?: string;
  error_description?: string;
};

type DropboxClient = {
  accessToken: string;
};

export type DropboxUploadFolder = {
  path: string;
  configuredAt: string;
};

export type DropboxFileMetadata = {
  provider: "dropbox";
  dropboxFileId: string;
  fileName: string;
  mimeType: string;
  size: number;
  path: string;
  parentPath: string;
  formFolderPath: string;
  submissionFolderPath: string;
  uploadedAt: string;
};

function getDropboxOAuthConfig() {
  const appKey = process.env.DROPBOX_APP_KEY;
  const appSecret = process.env.DROPBOX_APP_SECRET;
  const redirectUri = process.env.DROPBOX_REDIRECT_URI;

  if (!appKey || !appSecret || !redirectUri) {
    return null;
  }

  return {
    appKey,
    appSecret,
    redirectUri,
  };
}

function logDropboxWarning(message: string, details?: Record<string, unknown>) {
  console.warn("[formos:dropbox]", message, details ?? {});
}

function logDropboxError(message: string, details?: Record<string, unknown>) {
  console.error("[formos:dropbox]", message, details ?? {});
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeMetadata(value: unknown) {
  return isRecord(value) ? value : {};
}

function normalizeUploadFolder(value: unknown): DropboxUploadFolder | null {
  if (!isRecord(value)) {
    return null;
  }

  if (typeof value.path !== "string" || typeof value.configuredAt !== "string") {
    return null;
  }

  return {
    path: value.path,
    configuredAt: value.configuredAt,
  };
}

function sanitizeDropboxFileName(fileName: string) {
  return sanitizeDriveFolderName(fileName, "upload", 180);
}

function joinDropboxPath(...parts: string[]) {
  return normalizeDropboxPath(parts.join("/"));
}

function tokenAuthHeader(config: { appKey: string; appSecret: string }) {
  return `Basic ${Buffer.from(`${config.appKey}:${config.appSecret}`).toString("base64")}`;
}

async function readDropboxError(response: Response) {
  try {
    const body = (await response.json()) as {
      error_summary?: string;
      error_description?: string;
      error?: unknown;
    };

    return body.error_summary || body.error_description || JSON.stringify(body.error).slice(0, 300);
  } catch {
    return response.statusText || "Dropbox API request failed.";
  }
}

async function requestDropboxToken(body: URLSearchParams) {
  const config = getDropboxOAuthConfig();

  if (!config) {
    throw new Error("Dropbox OAuth is not configured.");
  }

  const response = await fetch(DROPBOX_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: tokenAuthHeader(config),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const tokenResponse = (await response.json()) as DropboxTokenResponse;

  if (!response.ok || !tokenResponse.access_token) {
    logDropboxWarning("Dropbox token request failed.", {
      status: response.status,
      error: tokenResponse.error,
      message: tokenResponse.error_description,
      grantType: body.get("grant_type"),
    });
    throw new Error("Unable to connect Dropbox.");
  }

  return tokenResponse;
}

function expiresAt(expiresIn: number | undefined) {
  return expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;
}

export function getDropboxOAuthUrl(state: string) {
  const config = getDropboxOAuthConfig();

  if (!config) {
    return null;
  }

  const params = new URLSearchParams({
    client_id: config.appKey,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: DROPBOX_SCOPE,
    token_access_type: "offline",
    state,
  });

  return `${DROPBOX_AUTH_URL}?${params.toString()}`;
}

export async function exchangeDropboxCode(code: string) {
  const config = getDropboxOAuthConfig();

  if (!config) {
    throw new Error("Dropbox OAuth is not configured.");
  }

  return requestDropboxToken(
    new URLSearchParams({
      code,
      grant_type: "authorization_code",
      redirect_uri: config.redirectUri,
    }),
  );
}

async function refreshDropboxAccessToken(userId: string, refreshToken: string) {
  const tokenResponse = await requestDropboxToken(
    new URLSearchParams({
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  );
  const nextExpiresAt = expiresAt(tokenResponse.expires_in);

  await prisma.userIntegration.update({
    where: {
      userId_provider: {
        userId,
        provider: IntegrationProvider.DROPBOX,
      },
    },
    data: {
      accessToken: encryptIntegrationToken(tokenResponse.access_token ?? ""),
      expiresAt: nextExpiresAt,
      scope: tokenResponse.scope ?? undefined,
    },
  });

  return tokenResponse.access_token ?? null;
}

export async function saveDropboxIntegration(
  userId: string,
  tokenResponse: DropboxTokenResponse,
) {
  if (!tokenResponse.access_token) {
    throw new Error("Dropbox access token is missing.");
  }

  return prisma.userIntegration.upsert({
    where: {
      userId_provider: {
        userId,
        provider: IntegrationProvider.DROPBOX,
      },
    },
    create: {
      userId,
      provider: IntegrationProvider.DROPBOX,
      accessToken: encryptIntegrationToken(tokenResponse.access_token),
      refreshToken: tokenResponse.refresh_token
        ? encryptIntegrationToken(tokenResponse.refresh_token)
        : null,
      expiresAt: expiresAt(tokenResponse.expires_in),
      scope: tokenResponse.scope,
      metadata: {
        accountId: tokenResponse.account_id ?? null,
        tokenType: tokenResponse.token_type ?? null,
        connectedAt: new Date().toISOString(),
      },
    },
    update: {
      accessToken: encryptIntegrationToken(tokenResponse.access_token),
      refreshToken: tokenResponse.refresh_token
        ? encryptIntegrationToken(tokenResponse.refresh_token)
        : undefined,
      expiresAt: expiresAt(tokenResponse.expires_in),
      scope: tokenResponse.scope,
      metadata: {
        accountId: tokenResponse.account_id ?? null,
        tokenType: tokenResponse.token_type ?? null,
        connectedAt: new Date().toISOString(),
      },
    },
  });
}

export async function getDropboxIntegrationStatus(userId: string) {
  const integration = await prisma.userIntegration.findUnique({
    where: {
      userId_provider: {
        userId,
        provider: IntegrationProvider.DROPBOX,
      },
    },
    select: {
      scope: true,
      expiresAt: true,
      createdAt: true,
      updatedAt: true,
      metadata: true,
    },
  });

  if (!integration) {
    return {
      connected: false,
      scope: null,
      expiresAt: null,
      connectedAt: null,
      updatedAt: null,
      uploadFolder: null,
    };
  }

  const metadata = normalizeMetadata(integration.metadata);

  return {
    connected: true,
    scope: integration.scope,
    expiresAt: integration.expiresAt,
    connectedAt: integration.createdAt,
    updatedAt: integration.updatedAt,
    uploadFolder: normalizeUploadFolder(metadata.uploadFolder),
  };
}

export async function hasDropboxIntegration(userId: string) {
  const integration = await prisma.userIntegration.findUnique({
    where: {
      userId_provider: {
        userId,
        provider: IntegrationProvider.DROPBOX,
      },
    },
    select: {
      id: true,
    },
  });

  return Boolean(integration);
}

export async function getDropboxClientForUser(userId: string) {
  const integration = await prisma.userIntegration.findUnique({
    where: {
      userId_provider: {
        userId,
        provider: IntegrationProvider.DROPBOX,
      },
    },
    select: {
      accessToken: true,
      refreshToken: true,
      expiresAt: true,
    },
  });

  if (!integration) {
    return null;
  }

  const accessToken = decryptIntegrationToken(integration.accessToken);
  const refreshToken = integration.refreshToken
    ? decryptIntegrationToken(integration.refreshToken)
    : null;
  const shouldRefresh =
    integration.expiresAt !== null &&
    integration.expiresAt.getTime() <= Date.now() + 60_000;

  if (shouldRefresh && refreshToken) {
    const refreshedAccessToken = await refreshDropboxAccessToken(userId, refreshToken);

    if (refreshedAccessToken) {
      return {
        accessToken: refreshedAccessToken,
      };
    }
  }

  return {
    accessToken,
  };
}

export function normalizeDropboxPath(input: string) {
  const normalized = input
    .trim()
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/")
    .replace(/\/$/g, "");
  const path = normalized.startsWith("/") ? normalized : `/${normalized}`;
  const parts = path.split("/").filter(Boolean);

  if (parts.length === 0) {
    throw new Error("Enter a Dropbox folder path.");
  }

  if (parts.some((part) => part === "." || part === "..")) {
    throw new Error("Dropbox folder path cannot contain path traversal.");
  }

  if (path.length > 500) {
    throw new Error("Dropbox folder path is too long.");
  }

  return `/${parts.join("/")}`;
}

export async function saveDropboxUploadFolder(userId: string, folderPath: string) {
  const path = normalizeDropboxPath(folderPath);
  const integration = await prisma.userIntegration.findUnique({
    where: {
      userId_provider: {
        userId,
        provider: IntegrationProvider.DROPBOX,
      },
    },
    select: {
      metadata: true,
    },
  });

  if (!integration) {
    throw new Error("Connect Dropbox before choosing an upload folder.");
  }

  const metadata = normalizeMetadata(integration.metadata);
  const uploadFolder: DropboxUploadFolder = {
    path,
    configuredAt: new Date().toISOString(),
  };

  await prisma.userIntegration.update({
    where: {
      userId_provider: {
        userId,
        provider: IntegrationProvider.DROPBOX,
      },
    },
    data: {
      metadata: {
        ...metadata,
        uploadFolder,
      } as Prisma.InputJsonValue,
    },
  });

  return uploadFolder;
}

export async function clearDropboxUploadFolder(userId: string) {
  const integration = await prisma.userIntegration.findUnique({
    where: {
      userId_provider: {
        userId,
        provider: IntegrationProvider.DROPBOX,
      },
    },
    select: {
      metadata: true,
    },
  });

  if (!integration) {
    throw new Error("Connect Dropbox before clearing an upload folder.");
  }

  const metadata = normalizeMetadata(integration.metadata);
  const { uploadFolder: _uploadFolder, ...nextMetadata } = metadata;

  await prisma.userIntegration.update({
    where: {
      userId_provider: {
        userId,
        provider: IntegrationProvider.DROPBOX,
      },
    },
    data: {
      metadata: nextMetadata as Prisma.InputJsonValue,
    },
  });
}

export async function getDropboxUploadParentPath(userId: string) {
  const integration = await prisma.userIntegration.findUnique({
    where: {
      userId_provider: {
        userId,
        provider: IntegrationProvider.DROPBOX,
      },
    },
    select: {
      metadata: true,
    },
  });
  const metadata = normalizeMetadata(integration?.metadata);
  const uploadFolder = normalizeUploadFolder(metadata.uploadFolder);

  return uploadFolder?.path ?? DEFAULT_DROPBOX_UPLOAD_PATH;
}

async function ensureDropboxFolder(client: DropboxClient, path: string) {
  const response = await fetch(DROPBOX_CREATE_FOLDER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${client.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path,
      autorename: false,
    }),
  });

  if (response.ok) {
    return;
  }

  const message = await readDropboxError(response);

  if (message.includes("path/conflict/folder")) {
    return;
  }

  logDropboxError("Dropbox folder creation failed.", {
    status: response.status,
    message,
  });
  throw new Error("Unable to create a Dropbox folder.");
}

export async function ensureDropboxFolderPath(client: DropboxClient, path: string) {
  const normalizedPath = normalizeDropboxPath(path);
  const parts = normalizedPath.split("/").filter(Boolean);
  let currentPath = "";

  for (const part of parts) {
    currentPath = `${currentPath}/${part}`;
    await ensureDropboxFolder(client, currentPath);
  }
}

export function getDropboxUploadPaths(input: {
  parentPath: string;
  formTitle: string;
  fields: FormBuilderField[];
  data: Record<string, unknown>;
  submissionId: string;
  fileName: string;
}) {
  const shortId = input.submissionId.slice(0, 8);
  const submitterName = extractSubmitterName(input.fields, input.data);
  const submissionFolderName = submitterName
    ? `${submitterName} - ${shortId}`
    : `submission-${shortId}`;
  const parentPath = normalizeDropboxPath(input.parentPath);
  const formFolderPath = joinDropboxPath(
    parentPath,
    sanitizeDriveFolderName(input.formTitle, "Untitled form"),
  );
  const submissionFolderPath = joinDropboxPath(
    formFolderPath,
    sanitizeDriveFolderName(submissionFolderName, `submission-${shortId}`),
  );
  const path = joinDropboxPath(submissionFolderPath, sanitizeDropboxFileName(input.fileName));

  return {
    parentPath,
    formFolderPath,
    submissionFolderPath,
    path,
  };
}

export async function uploadFileToDropbox(
  client: DropboxClient,
  input: {
    file: File;
    fileName: string;
    mimeType: string;
    parentPath: string;
    formTitle: string;
    fields: FormBuilderField[];
    data: Record<string, unknown>;
    submissionId: string;
  },
): Promise<DropboxFileMetadata> {
  const fileBuffer = Buffer.from(await input.file.arrayBuffer());
  const paths = getDropboxUploadPaths({
    parentPath: input.parentPath,
    formTitle: input.formTitle,
    fields: input.fields,
    data: input.data,
    submissionId: input.submissionId,
    fileName: input.fileName,
  });

  await ensureDropboxFolderPath(client, paths.submissionFolderPath);

  const response = await fetch(DROPBOX_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${client.accessToken}`,
      "Content-Type": "application/octet-stream",
      "Dropbox-API-Arg": JSON.stringify({
        path: paths.path,
        mode: "add",
        autorename: true,
        mute: false,
        strict_conflict: false,
      }),
    },
    body: fileBuffer,
  });

  if (!response.ok) {
    const message = await readDropboxError(response);
    logDropboxError("Dropbox file upload failed.", {
      status: response.status,
      message,
      fileName: input.fileName,
      mimeType: input.mimeType,
      size: input.file.size,
    });
    throw new Error("Unable to upload file to Dropbox.");
  }

  const uploaded = (await response.json()) as {
    id?: string;
    name?: string;
    path_display?: string;
    size?: number;
  };

  return {
    provider: "dropbox",
    dropboxFileId: uploaded.id ?? "",
    fileName: uploaded.name || sanitizeDropboxFileName(input.fileName),
    mimeType: input.mimeType,
    size: uploaded.size ?? input.file.size,
    path: uploaded.path_display || paths.path,
    parentPath: paths.parentPath,
    formFolderPath: paths.formFolderPath,
    submissionFolderPath: paths.submissionFolderPath,
    uploadedAt: new Date().toISOString(),
  };
}

export async function disconnectDropbox(userId: string) {
  await prisma.userIntegration.deleteMany({
    where: {
      userId,
      provider: IntegrationProvider.DROPBOX,
    },
  });
  await clearActiveUploadProviderIfMatches(userId, StorageProvider.DROPBOX);
}
