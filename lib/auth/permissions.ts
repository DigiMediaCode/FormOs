import "server-only";

import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import {
  requireWorkspaceAdminOrOwner,
  requireWorkspaceMember,
  requireWorkspaceOwner,
} from "@/lib/workspaces/access";

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.suspendedAt) {
    redirect("/account-suspended");
  }

  return user;
}

export async function requireSuperAdmin() {
  const user = await requireAuth();

  if (user.role !== "SUPER_ADMIN") {
    notFound();
  }

  return user;
}

export async function requireBillingOwner() {
  return requireWorkspaceOwner();
}

export async function requireIntegrationOwner() {
  return requireWorkspaceOwner();
}

export async function requireTeamOwner() {
  return requireWorkspaceOwner();
}

export async function requireOwnerOrWorkspaceMemberForForm(formId: string) {
  const context = await requireWorkspaceMember();
  const form = await prisma.form.findFirst({
    where: {
      id: formId,
      ownerId: context.ownerId,
    },
    select: {
      id: true,
      ownerId: true,
    },
  });

  if (!form) {
    notFound();
  }

  return {
    context,
    form,
  };
}

export async function requireOwnerOrWorkspaceMemberForSubmission(
  formId: string,
  submissionId: string,
) {
  const { context, form } = await requireOwnerOrWorkspaceMemberForForm(formId);
  const submission = await prisma.formSubmission.findFirst({
    where: {
      id: submissionId,
      formId: form.id,
      ownerId: context.ownerId,
    },
    select: {
      id: true,
      ownerId: true,
      formId: true,
    },
  });

  if (!submission) {
    notFound();
  }

  return {
    context,
    form,
    submission,
  };
}

export {
  requireWorkspaceAdminOrOwner,
  requireWorkspaceMember,
  requireWorkspaceOwner,
};
