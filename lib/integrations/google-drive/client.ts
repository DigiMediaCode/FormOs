import "server-only";

import { Buffer } from "node:buffer";
import { IntegrationProvider, Prisma, StorageProvider } from "@prisma/client";
import {
  decryptIntegrationToken,
  encryptIntegrationToken,
} from "@/lib/integrations/tokens";
import { clearActiveUploadProviderIfMatches } from "@/lib/integrations/upload-settings";
import type { FormBuilderField } from "@/lib/forms/fields";
import { prisma } from "@/lib/prisma";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files";
const GOOGLE_DRIVE_UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files";
const GOOGLE_DRIVE_FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";
const ROOT_UPLOAD_FOLDER_NAME = "FormOS Uploads";
const SUBMITTER_NAME_LABELS = [
  "full name",
  "driver name",
  "customer name",
  "client name",
  "applicant name",
  "your name",
  "name",
];
export const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";

type GoogleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

type GoogleDriveClient = {
  accessToken: string;
};

type GoogleApiError = {
  status: number;
  message: string;
};

export type GoogleDriveFileMetadata = {
  provider: "google_drive";
  driveFileId: string;
  fileName: string;
  mimeType: string;
  size: number;
  webViewLink: string | null;
  webContentLink: string | null;
  uploadedAt: string;
  parentFolderId: string;
  parentFolderName: string;
  formFolderId: string;
  formFolderName: string;
  submissionFolderId: string;
  submissionFolderName: string;
};

type GoogleDriveUploadResponse = {
  id?: string;
  name?: string;
  mimeType?: string;
  size?: string;
  webViewLink?: string;
  webContentLink?: string;
};

export type GoogleDriveUploadFolder = {
  id: string;
  name: string;
  configuredAt: string;
};

export type GoogleDriveFolderReference = {
  id: string;
  name: string;
};

function getGoogleOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return null;
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
  };
}

function escapeDriveQueryValue(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function sanitizeDriveFileName(fileName: string) {
  return sanitizeDriveName(fileName, "upload", 180);
}

export function sanitizeDriveFolderName(
  folderName: string,
  fallback = "Folder",
  maxLength = 80,
) {
  return sanitizeDriveName(folderName, fallback, maxLength);
}

function sanitizeDriveName(value: string, fallback: string, maxLength: number) {
  const cleaned = value
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength)
    .trim();

  return cleaned || fallback;
}

function uploadHeaders(client: GoogleDriveClient) {
  return {
    Authorization: `Bearer ${client.accessToken}`,
  };
}

function logDriveDiagnostic(message: string, details?: Record<string, unknown>) {
  console.info("[formos:google-drive]", message, details ?? {});
}

function logDriveError(message: string, details?: Record<string, unknown>) {
  console.error("[formos:google-drive]", message, details ?? {});
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeIntegrationMetadata(value: unknown) {
  return isRecord(value) ? value : {};
}

function normalizeUploadFolder(value: unknown): GoogleDriveUploadFolder | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    typeof value.configuredAt !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    configuredAt: value.configuredAt,
  };
}

export function extractGoogleDriveFolderId(input: string) {
  const value = input.trim();

  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    const folderMatch = url.pathname.match(/\/folders\/([^/?#]+)/);
    const id = folderMatch?.[1] || url.searchParams.get("id");

    return id && /^[A-Za-z0-9_-]+$/.test(id) ? id : null;
  } catch {
    return /^[A-Za-z0-9_-]+$/.test(value) ? value : null;
  }
}

async function readGoogleApiError(response: Response): Promise<GoogleApiError> {
  const fallback = {
    status: response.status,
    message: response.statusText || "Google API request failed.",
  };

  try {
    const body = (await response.json()) as {
      error?: {
        message?: string;
        status?: string;
        errors?: Array<{
          message?: string;
          reason?: string;
        }>;
      };
    };
    const firstError = body.error?.errors?.[0];

    return {
      status: response.status,
      message:
        [
          body.error?.message,
          body.error?.status,
          firstError?.reason,
          firstError?.message,
        ]
          .filter(Boolean)
          .join(" | ") || fallback.message,
    };
  } catch {
    try {
      const text = await response.text();

      return {
        status: response.status,
        message: text.slice(0, 300) || fallback.message,
      };
    } catch {
      return fallback;
    }
  }
}

async function refreshGoogleDriveAccessToken(
  userId: string,
  refreshToken: string,
) {
  const config = getGoogleOAuthConfig();

  if (!config) {
    return null;
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const tokenResponse = (await response.json()) as GoogleTokenResponse;

  if (!response.ok || !tokenResponse.access_token) {
    logDriveError("Access token refresh failed.", {
      status: response.status,
      hasRefreshToken: true,
    });
    return null;
  }

  const expiresAt = tokenResponse.expires_in
    ? new Date(Date.now() + tokenResponse.expires_in * 1000)
    : null;

  await prisma.userIntegration.update({
    where: {
      userId_provider: {
        userId,
        provider: IntegrationProvider.GOOGLE_DRIVE,
      },
    },
    data: {
      accessToken: encryptIntegrationToken(tokenResponse.access_token),
      expiresAt,
      scope: tokenResponse.scope ?? undefined,
    },
  });

  logDriveDiagnostic("Access token refreshed.", {
    provider: IntegrationProvider.GOOGLE_DRIVE,
    expiresAt: expiresAt?.toISOString() ?? null,
  });

  return tokenResponse.access_token;
}

export function getGoogleOAuthClient() {
  return getGoogleOAuthConfig();
}

export function getGoogleDriveAuthUrl(state: string) {
  const config = getGoogleOAuthConfig();

  if (!config) {
    return null;
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: GOOGLE_DRIVE_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeGoogleDriveCode(code: string) {
  const config = getGoogleOAuthConfig();

  if (!config) {
    throw new Error("Google Drive OAuth is not configured.");
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: config.redirectUri,
    }),
  });

  const tokenResponse = (await response.json()) as GoogleTokenResponse;

  if (!response.ok || !tokenResponse.access_token) {
    throw new Error("Unable to connect Google Drive.");
  }

  return tokenResponse;
}

export async function saveGoogleDriveIntegration(
  userId: string,
  tokenResponse: GoogleTokenResponse,
) {
  if (!tokenResponse.access_token) {
    throw new Error("Google Drive access token is missing.");
  }

  const expiresAt = tokenResponse.expires_in
    ? new Date(Date.now() + tokenResponse.expires_in * 1000)
    : null;

  return prisma.userIntegration.upsert({
    where: {
      userId_provider: {
        userId,
        provider: IntegrationProvider.GOOGLE_DRIVE,
      },
    },
    create: {
      userId,
      provider: IntegrationProvider.GOOGLE_DRIVE,
      accessToken: encryptIntegrationToken(tokenResponse.access_token),
      refreshToken: tokenResponse.refresh_token
        ? encryptIntegrationToken(tokenResponse.refresh_token)
        : null,
      expiresAt,
      scope: tokenResponse.scope,
      metadata: {
        tokenType: tokenResponse.token_type ?? null,
        connectedAt: new Date().toISOString(),
      },
    },
    update: {
      accessToken: encryptIntegrationToken(tokenResponse.access_token),
      refreshToken: tokenResponse.refresh_token
        ? encryptIntegrationToken(tokenResponse.refresh_token)
        : undefined,
      expiresAt,
      scope: tokenResponse.scope,
      metadata: {
        tokenType: tokenResponse.token_type ?? null,
        connectedAt: new Date().toISOString(),
      },
    },
  });
}

export async function getGoogleDriveIntegrationStatus(userId: string) {
  const integration = await prisma.userIntegration.findUnique({
    where: {
      userId_provider: {
        userId,
        provider: IntegrationProvider.GOOGLE_DRIVE,
      },
    },
    select: {
      id: true,
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

  const metadata = normalizeIntegrationMetadata(integration.metadata);

  return {
    connected: true,
    scope: integration.scope,
    expiresAt: integration.expiresAt,
    connectedAt: integration.createdAt,
    updatedAt: integration.updatedAt,
    uploadFolder: normalizeUploadFolder(metadata.uploadFolder),
  };
}

export async function hasGoogleDriveIntegration(userId: string) {
  const integration = await prisma.userIntegration.findUnique({
    where: {
      userId_provider: {
        userId,
        provider: IntegrationProvider.GOOGLE_DRIVE,
      },
    },
    select: {
      id: true,
    },
  });

  const exists = Boolean(integration);

  logDriveDiagnostic("Checked Google Drive integration status.", {
    provider: IntegrationProvider.GOOGLE_DRIVE,
    integrationExists: exists,
  });

  return exists;
}

export async function getGoogleDriveClientForUser(userId: string) {
  const integration = await prisma.userIntegration.findUnique({
    where: {
      userId_provider: {
        userId,
        provider: IntegrationProvider.GOOGLE_DRIVE,
      },
    },
    select: {
      accessToken: true,
      refreshToken: true,
      expiresAt: true,
    },
  });

  if (!integration) {
    logDriveDiagnostic("Google Drive integration missing.", {
      provider: IntegrationProvider.GOOGLE_DRIVE,
      integrationExists: false,
    });
    return null;
  }

  const accessToken = decryptIntegrationToken(integration.accessToken);
  const refreshToken = integration.refreshToken
    ? decryptIntegrationToken(integration.refreshToken)
    : null;
  const shouldRefresh =
    integration.expiresAt !== null &&
    integration.expiresAt.getTime() <= Date.now() + 60_000;

  logDriveDiagnostic("Loaded Google Drive integration.", {
    provider: IntegrationProvider.GOOGLE_DRIVE,
    integrationExists: true,
    hasRefreshToken: Boolean(refreshToken),
    expiresAt: integration.expiresAt?.toISOString() ?? null,
    tokenExpiredOrNearExpiry: shouldRefresh,
  });

  if (shouldRefresh && refreshToken) {
    const refreshedAccessToken = await refreshGoogleDriveAccessToken(
      userId,
      refreshToken,
    );

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

export async function ensureDriveFolder(
  client: GoogleDriveClient,
  folderName: string,
  parentFolderId?: string,
) {
  const queryParts = [
    `mimeType='${GOOGLE_DRIVE_FOLDER_MIME_TYPE}'`,
    "trashed=false",
    `name='${escapeDriveQueryValue(folderName)}'`,
  ];

  if (parentFolderId) {
    queryParts.push(`'${escapeDriveQueryValue(parentFolderId)}' in parents`);
  }

  const searchParams = new URLSearchParams({
    q: queryParts.join(" and "),
    fields: "files(id,name)",
    spaces: "drive",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
  });
  const searchResponse = await fetch(
    `${GOOGLE_DRIVE_FILES_URL}?${searchParams.toString()}`,
    {
      headers: uploadHeaders(client),
    },
  );

  if (!searchResponse.ok) {
    const error = await readGoogleApiError(searchResponse);
    logDriveError("Google Drive folder lookup failed.", {
      status: error.status,
      message: error.message,
      folderName,
      parentFolderId: parentFolderId ?? null,
    });
    throw new Error("Unable to access Google Drive folders.");
  }

  const searchResult = (await searchResponse.json()) as {
    files?: Array<{ id?: string }>;
  };
  const existingFolderId = searchResult.files?.find((file) => file.id)?.id;

  if (existingFolderId) {
    logDriveDiagnostic("Using existing Google Drive folder.", {
      folderName,
      folderId: existingFolderId,
      parentFolderId: parentFolderId ?? null,
    });
    return existingFolderId;
  }

  const createFolderParams = new URLSearchParams({
    supportsAllDrives: "true",
  });
  const createResponse = await fetch(
    `${GOOGLE_DRIVE_FILES_URL}?${createFolderParams.toString()}`,
    {
    method: "POST",
    headers: {
      ...uploadHeaders(client),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: GOOGLE_DRIVE_FOLDER_MIME_TYPE,
      parents: parentFolderId ? [parentFolderId] : undefined,
    }),
    },
  );

  if (!createResponse.ok) {
    const error = await readGoogleApiError(createResponse);
    logDriveError("Google Drive folder creation failed.", {
      status: error.status,
      message: error.message,
      folderName,
      parentFolderId: parentFolderId ?? null,
    });
    throw new Error("Unable to create a Google Drive folder.");
  }

  const createdFolder = (await createResponse.json()) as { id?: string };

  if (!createdFolder.id) {
    throw new Error("Google Drive did not return a folder id.");
  }

  logDriveDiagnostic("Created Google Drive folder.", {
    folderName,
    folderId: createdFolder.id,
    parentFolderId: parentFolderId ?? null,
  });

  return createdFolder.id;
}

export async function ensureFormOSRootFolder(client: GoogleDriveClient) {
  return ensureDriveFolder(client, ROOT_UPLOAD_FOLDER_NAME);
}

export async function validateGoogleDriveFolder(
  client: GoogleDriveClient,
  folderId: string,
): Promise<GoogleDriveFolderReference> {
  const searchParams = new URLSearchParams({
    fields: "id,name,mimeType",
    supportsAllDrives: "true",
  });
  const response = await fetch(
    `${GOOGLE_DRIVE_FILES_URL}/${encodeURIComponent(folderId)}?${searchParams.toString()}`,
    {
      headers: uploadHeaders(client),
    },
  );

  if (!response.ok) {
    const error = await readGoogleApiError(response);
    logDriveError("Google Drive folder validation failed.", {
      status: error.status,
      message: error.message,
      folderId,
    });
    throw new Error("Unable to access that Google Drive folder.");
  }

  const folder = (await response.json()) as {
    id?: string;
    name?: string;
    mimeType?: string;
  };

  if (folder.mimeType !== GOOGLE_DRIVE_FOLDER_MIME_TYPE || !folder.id) {
    throw new Error("The selected Google Drive item is not a folder.");
  }

  return {
    id: folder.id,
    name: folder.name || "Google Drive folder",
  };
}

export async function saveGoogleDriveUploadFolder(
  userId: string,
  folderInput: string,
) {
  const folderId = extractGoogleDriveFolderId(folderInput);

  if (!folderId) {
    throw new Error("Enter a valid Google Drive folder URL or folder ID.");
  }

  const client = await getGoogleDriveClientForUser(userId);

  if (!client) {
    throw new Error("Connect Google Drive before choosing an upload folder.");
  }

  const folder = await validateGoogleDriveFolder(client, folderId);
  const integration = await prisma.userIntegration.findUnique({
    where: {
      userId_provider: {
        userId,
        provider: IntegrationProvider.GOOGLE_DRIVE,
      },
    },
    select: {
      metadata: true,
    },
  });
  const metadata = normalizeIntegrationMetadata(integration?.metadata);
  const uploadFolder: GoogleDriveUploadFolder = {
    id: folder.id,
    name: folder.name,
    configuredAt: new Date().toISOString(),
  };

  await prisma.userIntegration.update({
    where: {
      userId_provider: {
        userId,
        provider: IntegrationProvider.GOOGLE_DRIVE,
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

export async function clearGoogleDriveUploadFolder(userId: string) {
  const integration = await prisma.userIntegration.findUnique({
    where: {
      userId_provider: {
        userId,
        provider: IntegrationProvider.GOOGLE_DRIVE,
      },
    },
    select: {
      metadata: true,
    },
  });

  if (!integration) {
    throw new Error("Connect Google Drive before clearing an upload folder.");
  }

  const metadata = normalizeIntegrationMetadata(integration.metadata);
  const { uploadFolder: _uploadFolder, ...nextMetadata } = metadata;

  await prisma.userIntegration.update({
    where: {
      userId_provider: {
        userId,
        provider: IntegrationProvider.GOOGLE_DRIVE,
      },
    },
    data: {
      metadata: nextMetadata as Prisma.InputJsonValue,
    },
  });
}

export async function getConfiguredUploadFolderForUser(userId: string) {
  const integration = await prisma.userIntegration.findUnique({
    where: {
      userId_provider: {
        userId,
        provider: IntegrationProvider.GOOGLE_DRIVE,
      },
    },
    select: {
      metadata: true,
    },
  });
  const metadata = normalizeIntegrationMetadata(integration?.metadata);

  return normalizeUploadFolder(metadata.uploadFolder);
}

export async function getUploadParentFolderForUser(
  client: GoogleDriveClient,
  userId: string,
): Promise<GoogleDriveFolderReference> {
  const configuredFolder = await getConfiguredUploadFolderForUser(userId);

  if (configuredFolder) {
    const folder = await validateGoogleDriveFolder(client, configuredFolder.id);

    return {
      id: folder.id,
      name: folder.name,
    };
  }

  const id = await ensureFormOSRootFolder(client);

  return {
    id,
    name: ROOT_UPLOAD_FOLDER_NAME,
  };
}

export async function ensureFormFolder(
  client: GoogleDriveClient,
  formTitle: string,
  parentFolderId: string,
): Promise<GoogleDriveFolderReference> {
  const name = sanitizeDriveFolderName(formTitle, "Untitled form");

  return {
    id: await ensureDriveFolder(client, name, parentFolderId),
    name,
  };
}

export async function ensureSubmissionFolder(
  client: GoogleDriveClient,
  folderName: string,
  formFolderId: string,
): Promise<GoogleDriveFolderReference> {
  const name = sanitizeDriveFolderName(folderName, "Submission");

  return {
    id: await ensureDriveFolder(client, name, formFolderId),
    name,
  };
}

export function extractSubmitterName(
  fields: FormBuilderField[],
  data: Record<string, string | boolean>,
) {
  const textLikeFields = fields.filter(
    (field) => field.type === "text" || field.type === "textarea",
  );

  for (const labelNeedle of SUBMITTER_NAME_LABELS) {
    const matchingField = textLikeFields.find((field) =>
      field.label.toLowerCase().includes(labelNeedle),
    );
    const value = matchingField ? data[matchingField.id] : null;

    if (typeof value === "string" && value.trim()) {
      return sanitizeDriveFolderName(value, "", 60) || null;
    }
  }

  return null;
}

export async function uploadFileToDrive(
  client: GoogleDriveClient,
  input: {
    file: File;
    fileName: string;
    mimeType: string;
    parentFolder: GoogleDriveFolderReference;
    formFolder: GoogleDriveFolderReference;
    submissionFolder: GoogleDriveFolderReference;
  },
): Promise<GoogleDriveFileMetadata> {
  const fileName = sanitizeDriveFileName(input.fileName);
  const fileBuffer = Buffer.from(await input.file.arrayBuffer());
  const metadata = {
    name: fileName,
    parents: [input.submissionFolder.id],
  };

  const searchParams = new URLSearchParams({
    uploadType: "resumable",
    fields: "id,name,mimeType,size,webViewLink,webContentLink",
    supportsAllDrives: "true",
  });

  logDriveDiagnostic("Starting Google Drive resumable upload.", {
    fileName,
    mimeType: input.mimeType,
    size: input.file.size,
    bufferSize: fileBuffer.length,
    parentFolderId: input.parentFolder.id,
    formFolderId: input.formFolder.id,
    submissionFolderId: input.submissionFolder.id,
  });

  const sessionResponse = await fetch(
    `${GOOGLE_DRIVE_UPLOAD_URL}?${searchParams.toString()}`,
    {
      method: "POST",
      headers: {
        ...uploadHeaders(client),
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Type": input.mimeType,
        "X-Upload-Content-Length": String(fileBuffer.length),
      },
      body: JSON.stringify(metadata),
    },
  );

  if (!sessionResponse.ok) {
    const error = await readGoogleApiError(sessionResponse);
    logDriveError("Google Drive resumable upload session failed.", {
      status: error.status,
      message: error.message,
      fileName,
      mimeType: input.mimeType,
      size: input.file.size,
      parentFolderId: input.parentFolder.id,
      formFolderId: input.formFolder.id,
      submissionFolderId: input.submissionFolder.id,
    });
    throw new Error("Unable to start Google Drive upload session.");
  }

  const uploadUrl = sessionResponse.headers.get("location");

  if (!uploadUrl) {
    logDriveError("Google Drive resumable upload session missing location.", {
      fileName,
      mimeType: input.mimeType,
      size: input.file.size,
      parentFolderId: input.parentFolder.id,
      formFolderId: input.formFolder.id,
      submissionFolderId: input.submissionFolder.id,
    });
    throw new Error("Google Drive did not return an upload location.");
  }

  logDriveDiagnostic("Google Drive resumable upload session created.", {
    fileName,
    mimeType: input.mimeType,
    size: input.file.size,
    parentFolderId: input.parentFolder.id,
    formFolderId: input.formFolder.id,
    submissionFolderId: input.submissionFolder.id,
  });

  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": input.mimeType,
      "Content-Length": String(fileBuffer.length),
    },
    body: fileBuffer,
  });

  if (!response.ok) {
    const error = await readGoogleApiError(response);
    logDriveError("Google Drive file upload failed.", {
      status: error.status,
      message: error.message,
      fileName,
      mimeType: input.mimeType,
      size: input.file.size,
      parentFolderId: input.parentFolder.id,
      formFolderId: input.formFolder.id,
      submissionFolderId: input.submissionFolder.id,
    });
    throw new Error("Unable to upload file to Google Drive.");
  }

  const uploadedFile = (await response.json()) as GoogleDriveUploadResponse;

  if (!uploadedFile.id) {
    throw new Error("Google Drive did not return a file id.");
  }

  logDriveDiagnostic("Google Drive file upload succeeded.", {
    driveFileId: uploadedFile.id,
    fileName: uploadedFile.name || fileName,
    mimeType: uploadedFile.mimeType || input.mimeType,
    size: Number(uploadedFile.size) || input.file.size,
  });

  return {
    provider: "google_drive",
    driveFileId: uploadedFile.id,
    fileName: uploadedFile.name || fileName,
    mimeType: uploadedFile.mimeType || input.mimeType,
    size: Number(uploadedFile.size) || input.file.size,
    webViewLink: uploadedFile.webViewLink || null,
    webContentLink: uploadedFile.webContentLink || null,
    uploadedAt: new Date().toISOString(),
    parentFolderId: input.parentFolder.id,
    parentFolderName: input.parentFolder.name,
    formFolderId: input.formFolder.id,
    formFolderName: input.formFolder.name,
    submissionFolderId: input.submissionFolder.id,
    submissionFolderName: input.submissionFolder.name,
  };
}

export async function disconnectGoogleDrive(userId: string) {
  await prisma.userIntegration.deleteMany({
    where: {
      userId,
      provider: IntegrationProvider.GOOGLE_DRIVE,
    },
  });
  await clearActiveUploadProviderIfMatches(userId, StorageProvider.GOOGLE_DRIVE);
}
