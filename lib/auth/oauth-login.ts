import "server-only";

import { createSession } from "@/lib/auth/session";
import {
  sendLoginNotification,
  sendSignupNotification,
} from "@/lib/notifications/auth-notifications";
import { prisma } from "@/lib/prisma";
import type { OAuthLoginProvider } from "@/lib/auth/oauth-state";

export type NormalizedOAuthProfile = {
  provider: OAuthLoginProvider;
  providerUserId: string;
  email: string;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function safeMetadata(profile: NormalizedOAuthProfile) {
  return {
    avatarUrl: profile.avatarUrl ?? null,
    linkedAt: new Date().toISOString(),
  };
}

function splitName(name: string | null | undefined) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return {
      firstName: null,
      lastName: null,
    };
  }

  return {
    firstName: parts[0] ?? null,
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : null,
  };
}

export async function loginWithOAuthProfile(profile: NormalizedOAuthProfile) {
  const email = normalizeEmail(profile.email);

  if (!email || !profile.providerUserId) {
    throw new Error("OAuth profile is missing required identity data.");
  }

  const linkedAccount = await prisma.userOAuthAccount.findUnique({
    where: {
      provider_providerUserId: {
        provider: profile.provider,
        providerUserId: profile.providerUserId,
      },
    },
    select: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          name: true,
        },
      },
    },
  });

  if (linkedAccount) {
    await createSession(linkedAccount.user.id);
    await sendLoginNotification(linkedAccount.user);

    return {
      userId: linkedAccount.user.id,
      createdUser: false,
      linkedExistingUser: false,
    };
  }

  const nameParts = splitName(profile.name);
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      emailVerifiedAt: true,
    },
  });

  if (existingUser) {
    const user = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        name: existingUser.name || profile.name || undefined,
        firstName:
          existingUser.firstName || profile.firstName || nameParts.firstName || undefined,
        lastName:
          existingUser.lastName || profile.lastName || nameParts.lastName || undefined,
        emailVerifiedAt: existingUser.emailVerifiedAt ?? new Date(),
        oauthAccounts: {
          create: {
            provider: profile.provider,
            providerUserId: profile.providerUserId,
            providerEmail: email,
            metadata: safeMetadata(profile),
          },
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
      },
    });

    await createSession(user.id);
    await sendLoginNotification(user);

    return {
      userId: user.id,
      createdUser: false,
      linkedExistingUser: true,
    };
  }

  const user = await prisma.user.create({
    data: {
      name: profile.name || null,
      firstName: profile.firstName || nameParts.firstName,
      lastName: profile.lastName || nameParts.lastName,
      email,
      passwordHash: null,
      emailVerifiedAt: new Date(),
      oauthAccounts: {
        create: {
          provider: profile.provider,
          providerUserId: profile.providerUserId,
          providerEmail: email,
          metadata: safeMetadata(profile),
        },
      },
    },
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  });

  await createSession(user.id);
  await sendSignupNotification(user);
  await sendLoginNotification(user);

  return {
    userId: user.id,
    createdUser: true,
    linkedExistingUser: false,
  };
}
