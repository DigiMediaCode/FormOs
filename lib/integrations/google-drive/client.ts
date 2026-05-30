import "server-only";

import { IntegrationProvider } from "@prisma/client";
import {
  decryptIntegrationToken,
  encryptIntegrationToken,
} from "@/lib/integrations/tokens";
import { prisma } from "@/lib/prisma";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files";
const GOOGLE_DRIVE_UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files";
const GOOGLE_DRIVE_FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";
const ROOT_UPLOAD_FOLDER_NAME = "FormOS Uploads";
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

export type GoogleDriveFileMetadata = {
  provider: "google_drive";
  driveFileId: string;
  fileName: string;
  mimeType: string;
  size: number;
  webViewLink: string | null;
  webContentLink: string | null;
  uploadedAt: string;
};

type GoogleDriveUploadResponse = {
  id?: string;
  name?: string;
  mimeType?: string;
  size?: string;
  webViewLink?: string;
  webContentLink?: string;
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
  const cleaned = fileName
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || "upload";
}

function uploadHeaders(client: GoogleDriveClient) {
  return {
    Authorization: `Bearer ${client.accessToken}`,
  };
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
    },
  });

  if (!integration) {
    return {
      connected: false,
      scope: null,
      expiresAt: null,
      connectedAt: null,
      updatedAt: null,
    };
  }

  return {
    connected: true,
    scope: integration.scope,
    expiresAt: integration.expiresAt,
    connectedAt: integration.createdAt,
    updatedAt: integration.updatedAt,
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

  return Boolean(integration);
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
  });
  const searchResponse = await fetch(
    `${GOOGLE_DRIVE_FILES_URL}?${searchParams.toString()}`,
    {
      headers: uploadHeaders(client),
    },
  );

  if (!searchResponse.ok) {
    throw new Error("Unable to access Google Drive folders.");
  }

  const searchResult = (await searchResponse.json()) as {
    files?: Array<{ id?: string }>;
  };
  const existingFolderId = searchResult.files?.find((file) => file.id)?.id;

  if (existingFolderId) {
    return existingFolderId;
  }

  const createResponse = await fetch(GOOGLE_DRIVE_FILES_URL, {
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
  });

  if (!createResponse.ok) {
    throw new Error("Unable to create a Google Drive folder.");
  }

  const createdFolder = (await createResponse.json()) as { id?: string };

  if (!createdFolder.id) {
    throw new Error("Google Drive did not return a folder id.");
  }

  return createdFolder.id;
}

export async function ensureFormOSRootFolder(client: GoogleDriveClient) {
  return ensureDriveFolder(client, ROOT_UPLOAD_FOLDER_NAME);
}

export async function uploadFileToDrive(
  client: GoogleDriveClient,
  input: {
    file: File;
    fileName: string;
    mimeType: string;
    parentFolderId: string;
  },
): Promise<GoogleDriveFileMetadata> {
  const fileName = sanitizeDriveFileName(input.fileName);
  const metadata = {
    name: fileName,
    mimeType: input.mimeType,
    parents: [input.parentFolderId],
  };
  const body = new FormData();

  body.append(
    "metadata",
    new Blob([JSON.stringify(metadata)], { type: "application/json" }),
  );
  body.append("file", input.file, fileName);

  const searchParams = new URLSearchParams({
    uploadType: "multipart",
    fields: "id,name,mimeType,size,webViewLink,webContentLink",
  });
  const response = await fetch(
    `${GOOGLE_DRIVE_UPLOAD_URL}?${searchParams.toString()}`,
    {
      method: "POST",
      headers: uploadHeaders(client),
      body,
    },
  );

  if (!response.ok) {
    throw new Error("Unable to upload file to Google Drive.");
  }

  const uploadedFile = (await response.json()) as GoogleDriveUploadResponse;

  if (!uploadedFile.id) {
    throw new Error("Google Drive did not return a file id.");
  }

  return {
    provider: "google_drive",
    driveFileId: uploadedFile.id,
    fileName: uploadedFile.name || fileName,
    mimeType: uploadedFile.mimeType || input.mimeType,
    size: Number(uploadedFile.size) || input.file.size,
    webViewLink: uploadedFile.webViewLink || null,
    webContentLink: uploadedFile.webContentLink || null,
    uploadedAt: new Date().toISOString(),
  };
}

export async function disconnectGoogleDrive(userId: string) {
  await prisma.userIntegration.deleteMany({
    where: {
      userId,
      provider: IntegrationProvider.GOOGLE_DRIVE,
    },
  });
}
