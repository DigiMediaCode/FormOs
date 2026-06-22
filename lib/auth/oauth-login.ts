import "server-only";

import { startLoginVerification } from "@/lib/auth/login-verification";
import {
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

async function requireLoginVerification(
  user: LoginVerificationUser,
  nextPath?: string | null,
) {
  const verification = await startLoginVerification({
    user,
    nextPath: nextPath || "/dashboard",
  });

  if (!verification.ok) {
    throw new Error(verification.message);
  }
}

type LoginVerificationUser = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
};

export async function loginWithOAuthProfile(
  profile: NormalizedOAuthProfile,
  nextPath?: string | null,
) {
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
    await requireLoginVerification(linkedAccount.user, nextPath);

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

    await requireLoginVerification(user, nextPath);

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

  await sendSignupNotification(user);
  await requireLoginVerification(user, nextPath);

  return {
    userId: user.id,
    createdUser: true,
    linkedExistingUser: false,
  };
}
