import "server-only";

import { WorkspaceRole } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser, type CurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

export type WorkspaceContext = {
  user: CurrentUser;
  workspace: {
    id: string;
    ownerId: string;
    name: string | null;
  };
  role: WorkspaceRole;
  ownerId: string;
  isOwner: boolean;
  isAdmin: boolean;
  canManageOwnerSettings: boolean;
  canManageTeam: boolean;
};

function workspaceNameFrom(owner: {
  name: string | null;
  businessProfile: { companyName: string | null } | null;
}) {
  if (owner.businessProfile?.companyName) {
    return `${owner.businessProfile.companyName} Workspace`;
  }

  if (owner.name) {
    return `${owner.name}'s Workspace`;
  }

  return "My Workspace";
}

export async function getOrCreateUserWorkspace(ownerId: string) {
  const existingWorkspace = await prisma.workspace.findUnique({
    where: { ownerId },
    select: {
      id: true,
      ownerId: true,
      name: true,
    },
  });

  if (existingWorkspace) {
    await prisma.workspaceMember.upsert({
      where: {
        workspaceId_userId: {
          workspaceId: existingWorkspace.id,
          userId: ownerId,
        },
      },
      create: {
        workspaceId: existingWorkspace.id,
        userId: ownerId,
        role: WorkspaceRole.OWNER,
        status: "ACTIVE",
      },
      update: {
        role: WorkspaceRole.OWNER,
        status: "ACTIVE",
      },
    });

    return existingWorkspace;
  }

  const owner = await prisma.user.findUnique({
    where: { id: ownerId },
    select: {
      id: true,
      name: true,
      businessProfile: {
        select: {
          companyName: true,
        },
      },
    },
  });

  if (!owner) {
    notFound();
  }

  const workspace = await prisma.workspace.create({
    data: {
      ownerId,
      name: workspaceNameFrom(owner),
      members: {
        create: {
          userId: ownerId,
          role: WorkspaceRole.OWNER,
          status: "ACTIVE",
        },
      },
    },
    select: {
      id: true,
      ownerId: true,
      name: true,
    },
  });

  return workspace;
}

export async function getCurrentWorkspaceContext(): Promise<WorkspaceContext | null> {
  return getWorkspaceContextForCurrentUser();
}

export async function getWorkspaceContextForCurrentUser(): Promise<WorkspaceContext | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const staffMembership = await prisma.workspaceMember.findFirst({
    where: {
      userId: user.id,
      status: "ACTIVE",
      workspace: {
        ownerId: {
          not: user.id,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      role: true,
      workspace: {
        select: {
          id: true,
          ownerId: true,
          name: true,
        },
      },
    },
  });

  if (staffMembership) {
    const isAdmin = staffMembership.role === WorkspaceRole.ADMIN;

    return {
      user,
      workspace: staffMembership.workspace,
      role: staffMembership.role,
      ownerId: staffMembership.workspace.ownerId,
      isOwner: false,
      isAdmin,
      canManageOwnerSettings: false,
      canManageTeam: false,
    };
  }

  const ownedWorkspace = await prisma.workspace.findUnique({
    where: { ownerId: user.id },
    select: {
      id: true,
      ownerId: true,
      name: true,
    },
  });

  if (!ownedWorkspace) {
    const workspace = await getOrCreateUserWorkspace(user.id);

    return {
      user,
      workspace,
      role: WorkspaceRole.OWNER,
      ownerId: user.id,
      isOwner: true,
      isAdmin: true,
      canManageOwnerSettings: true,
      canManageTeam: true,
    };
  }

  return {
    user,
    workspace: ownedWorkspace,
    role: WorkspaceRole.OWNER,
    ownerId: user.id,
    isOwner: true,
    isAdmin: true,
    canManageOwnerSettings: true,
    canManageTeam: true,
  };
}

export async function requireWorkspaceMember() {
  const context = await getWorkspaceContextForCurrentUser();

  if (!context) {
    redirect("/login");
  }

  return context;
}

export async function requireWorkspaceOwner() {
  const context = await requireWorkspaceMember();

  if (!context.isOwner) {
    redirect("/dashboard?error=Only the workspace owner can access that area.");
  }

  return context;
}

export async function requireWorkspaceAdminOrOwner() {
  const context = await requireWorkspaceMember();

  if (!context.isAdmin) {
    redirect("/dashboard?error=You do not have permission to manage forms.");
  }

  return context;
}

export function canManageWorkspaceForms(context: WorkspaceContext) {
  return context.isOwner || context.role === WorkspaceRole.ADMIN;
}

export function canViewWorkspaceSubmissions(context: WorkspaceContext) {
  return Boolean(context);
}

export function canCompleteOfficeFields(context: WorkspaceContext) {
  return Boolean(context);
}
