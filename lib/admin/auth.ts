import "server-only";

import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function requireSuperAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== UserRole.SUPER_ADMIN) {
    redirect("/dashboard");
  }

  return user;
}
