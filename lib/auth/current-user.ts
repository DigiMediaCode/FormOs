import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/auth/session";

export const getCurrentUser = cache(async () => {
  const userId = await getSessionUserId();

  if (!userId) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
});
