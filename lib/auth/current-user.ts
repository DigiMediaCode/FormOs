import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";

export type CurrentUser = {
  id: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  email: string;
  emailVerifiedAt: Date | null;
  suspendedAt: Date | null;
  suspendedReason: string | null;
  role: "USER" | "SUPER_ADMIN";
  createdAt: Date;
};

export const getCurrentUser = cache(async () => {
  const userId = await getSessionUserId();

  if (!userId) {
    return null;
  }

  try {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        emailVerifiedAt: true,
        suspendedAt: true,
        suspendedReason: true,
        role: true,
        createdAt: true,
      },
    });
  } catch (error) {
    if (!(error instanceof Error) || error.name !== "PrismaClientValidationError") {
      throw error;
    }

    console.warn("[formos:auth] Falling back to minimal current user query.", {
      message: error.message.split("\n")[0],
    });

    const fallbackUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (!fallbackUser) {
      return null;
    }

    return {
      ...fallbackUser,
      firstName: null,
      lastName: null,
      phone: null,
      emailVerifiedAt: null,
      suspendedAt: null,
      suspendedReason: null,
      role: "USER",
    } satisfies CurrentUser;
  }
});
