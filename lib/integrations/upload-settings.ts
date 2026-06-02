import "server-only";

import { IntegrationProvider, StorageProvider } from "@prisma/client";
import { assertCanUseStorageProvider } from "@/lib/plans/limits";
import { prisma } from "@/lib/prisma";

type UploadSettingsDelegate = {
  findUnique(args: {
    where: { userId: string };
    select: { activeProvider: true };
  }): Promise<{ activeProvider: StorageProvider | null } | null>;
  upsert(args: {
    where: { userId: string };
    create: { userId: string; activeProvider: StorageProvider };
    update: { activeProvider: StorageProvider };
  }): Promise<unknown>;
  updateMany(args: {
    where: { userId: string; activeProvider: StorageProvider };
    data: { activeProvider: null };
  }): Promise<unknown>;
};

export type ResolvedUploadProvider = {
  activeProvider: StorageProvider | null;
  connectedProviders: StorageProvider[];
  uploadsAvailable: boolean;
  needsExplicitSelection: boolean;
};

function integrationProviderFor(storageProvider: StorageProvider) {
  return storageProvider === StorageProvider.GOOGLE_DRIVE
    ? IntegrationProvider.GOOGLE_DRIVE
    : IntegrationProvider.DROPBOX;
}

function getUploadSettingsDelegate() {
  return (prisma as unknown as { userUploadSettings?: UploadSettingsDelegate })
    .userUploadSettings ?? null;
}

export function uploadProviderLabel(provider: StorageProvider | null) {
  if (provider === StorageProvider.GOOGLE_DRIVE) {
    return "Google Drive";
  }

  if (provider === StorageProvider.DROPBOX) {
    return "Dropbox";
  }

  return "connected storage provider";
}

export async function getConnectedUploadProviders(userId: string) {
  const integrations = await prisma.userIntegration.findMany({
    where: {
      userId,
      provider: {
        in: [IntegrationProvider.GOOGLE_DRIVE, IntegrationProvider.DROPBOX],
      },
    },
    select: {
      provider: true,
    },
  });
  const providers = new Set(integrations.map((integration) => integration.provider));
  const connectedProviders: StorageProvider[] = [];

  if (providers.has(IntegrationProvider.GOOGLE_DRIVE)) {
    connectedProviders.push(StorageProvider.GOOGLE_DRIVE);
  }

  if (providers.has(IntegrationProvider.DROPBOX)) {
    connectedProviders.push(StorageProvider.DROPBOX);
  }

  return connectedProviders;
}

export async function getResolvedUploadProvider(
  userId: string,
): Promise<ResolvedUploadProvider> {
  const uploadSettings = getUploadSettingsDelegate();
  const [settings, connectedProviders] = await Promise.all([
    uploadSettings
      ? uploadSettings.findUnique({
          where: {
            userId,
          },
          select: {
            activeProvider: true,
          },
        })
      : Promise.resolve(null),
    getConnectedUploadProviders(userId),
  ]);
  const activeProvider =
    settings?.activeProvider && connectedProviders.includes(settings.activeProvider)
      ? settings.activeProvider
      : connectedProviders.length === 1
        ? connectedProviders[0]
        : null;

  return {
    activeProvider,
    connectedProviders,
    uploadsAvailable: Boolean(activeProvider),
    needsExplicitSelection:
      connectedProviders.length > 1 && !settings?.activeProvider,
  };
}

export async function getUserUploadStorageStatus(userId: string) {
  return getResolvedUploadProvider(userId);
}

export async function setActiveUploadProvider(
  userId: string,
  provider: StorageProvider,
) {
  await assertCanUseStorageProvider(userId, provider);

  const integration = await prisma.userIntegration.findUnique({
    where: {
      userId_provider: {
        userId,
        provider: integrationProviderFor(provider),
      },
    },
    select: {
      id: true,
    },
  });

  if (!integration) {
    throw new Error(`Connect ${uploadProviderLabel(provider)} before setting it as active.`);
  }

  const uploadSettings = getUploadSettingsDelegate();

  if (!uploadSettings) {
    throw new Error("Upload settings are not available. Regenerate Prisma Client and restart the app.");
  }

  await uploadSettings.upsert({
    where: {
      userId,
    },
    create: {
      userId,
      activeProvider: provider,
    },
    update: {
      activeProvider: provider,
    },
  });
}

export async function clearActiveUploadProviderIfMatches(
  userId: string,
  provider: StorageProvider,
) {
  const uploadSettings = getUploadSettingsDelegate();

  if (!uploadSettings) {
    return;
  }

  await uploadSettings.updateMany({
    where: {
      userId,
      activeProvider: provider,
    },
    data: {
      activeProvider: null,
    },
  });
}
