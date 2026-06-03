import "server-only";

import { FormStatus, IntegrationProvider } from "@prisma/client";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

function formatAuthMethods(user: {
  passwordHash: string | null;
  oauthAccounts: Array<{ provider: string }>;
}) {
  const methods = new Set<string>();

  if (user.passwordHash) {
    methods.add("Password");
  }

  user.oauthAccounts.forEach((account) => {
    if (account.provider === "google") {
      methods.add("Google");
    } else if (account.provider === "lark") {
      methods.add("Lark");
    }
  });

  return Array.from(methods).join(" + ") || "Not set";
}

function maskStripeId(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  if (value.length <= 12) {
    return value;
  }

  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

export async function getAdminDashboardStats() {
  await requireSuperAdmin();

  const [
    totalUsers,
    totalForms,
    totalPublishedForms,
    totalSubmissions,
    googleDriveIntegrations,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.form.count(),
    prisma.form.count({ where: { status: FormStatus.PUBLISHED } }),
    prisma.formSubmission.count(),
    prisma.userIntegration.findMany({
      where: { provider: IntegrationProvider.GOOGLE_DRIVE },
      distinct: ["userId"],
      select: { userId: true },
    }),
  ]);

  return {
    totalUsers,
    totalForms,
    totalPublishedForms,
    totalSubmissions,
    totalGoogleDriveConnectedUsers: googleDriveIntegrations.length,
  };
}

export async function getAdminUsers() {
  await requireSuperAdmin();

  const [users, submissionCounts] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        passwordHash: true,
        role: true,
        createdAt: true,
        businessProfile: {
          select: {
            companyName: true,
            taxId: true,
            country: true,
          },
        },
        _count: { select: { forms: true } },
        integrations: {
          where: { provider: IntegrationProvider.GOOGLE_DRIVE },
          select: { id: true },
        },
        subscription: {
          select: {
            status: true,
            billingProvider: true,
            stripeCustomerId: true,
            stripeSubscriptionId: true,
            plan: {
              select: {
                name: true,
              },
            },
          },
        },
        quotaOverride: {
          select: {
            id: true,
          },
        },
        oauthAccounts: {
          select: {
            provider: true,
          },
        },
      },
    }),
    prisma.formSubmission.groupBy({
      by: ["ownerId"],
      _count: { _all: true },
    }),
  ]);
  const submissionsByOwner = new Map(
    submissionCounts.map((count) => [count.ownerId, count._count._all]),
  );

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    email: user.email,
    role: user.role,
    authMethods: formatAuthMethods(user),
    createdAt: user.createdAt,
    companyName: user.businessProfile?.companyName ?? null,
    taxId: user.businessProfile?.taxId ?? null,
    country: user.businessProfile?.country ?? null,
    formsCount: user._count.forms,
    submissionsCount: submissionsByOwner.get(user.id) ?? 0,
    googleDriveConnected: user.integrations.length > 0,
    planName: user.subscription?.plan?.name ?? "Free",
    subscriptionStatus: user.subscription?.status ?? "FREE",
    billingProvider: user.subscription?.billingProvider ?? null,
    stripeCustomerId: maskStripeId(user.subscription?.stripeCustomerId),
    stripeSubscriptionId: maskStripeId(user.subscription?.stripeSubscriptionId),
    hasQuotaOverride: Boolean(user.quotaOverride),
  }));
}

export async function getAdminForms() {
  await requireSuperAdmin();

  return prisma.form.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      mode: true,
      version: true,
      createdAt: true,
      updatedAt: true,
      owner: {
        select: {
          email: true,
        },
      },
      _count: {
        select: {
          submissions: true,
        },
      },
    },
  });
}
