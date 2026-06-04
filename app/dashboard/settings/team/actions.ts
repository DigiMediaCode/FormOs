"use server";

import { WorkspaceRole } from "@prisma/client";
import { createHash, randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppUrl } from "@/lib/app-url";
import { sendWorkspaceInviteNotification } from "@/lib/notifications/team-notifications";
import { getUserPlanAccess } from "@/lib/plans/limits";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitKey } from "@/lib/security/rate-limit";
import {
  getOrCreateUserWorkspace,
  requireWorkspaceOwner,
} from "@/lib/workspaces/access";

const TEAM_PATH = "/dashboard/settings/team";
const INVITE_EXPIRY_DAYS = 7;

function redirectWith(type: "success" | "error", message: string): never {
  redirect(`${TEAM_PATH}?${type}=${encodeURIComponent(message)}`);
}

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parseRole(value: string) {
  return value === WorkspaceRole.ADMIN ? WorkspaceRole.ADMIN : WorkspaceRole.STAFF;
}

function hashInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function assertTeamAllowed(ownerId: string, workspaceId: string) {
  const access = await getUserPlanAccess(ownerId);

  if (!access.limits.allowTeamMembers) {
    throw new Error("Team access is available on Business plans.");
  }

  const [activeMembers, pendingInvites] = await Promise.all([
    prisma.workspaceMember.count({
      where: {
        workspaceId,
        status: "ACTIVE",
        role: {
          not: WorkspaceRole.OWNER,
        },
      },
    }),
    prisma.workspaceInvite.count({
      where: {
        workspaceId,
        acceptedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    }),
  ]);

  const usedSeats = activeMembers + pendingInvites;

  if (
    access.limits.maxTeamMembers !== null &&
    usedSeats >= access.limits.maxTeamMembers
  ) {
    throw new Error(
      `Your current plan allows up to ${access.limits.maxTeamMembers} staff members.`,
    );
  }
}

export async function inviteWorkspaceMember(formData: FormData) {
  const context = await requireWorkspaceOwner();
  const workspace = await getOrCreateUserWorkspace(context.ownerId);
  const email = normalizeEmail(readString(formData, "email"));
  const role = parseRole(readString(formData, "role"));

  if (!isValidEmail(email)) {
    redirectWith("error", "Enter a valid staff email address.");
  }

  if (email === context.user.email.toLowerCase()) {
    redirectWith("error", "You are already the workspace owner.");
  }

  const rateLimit = checkRateLimit({
    key: rateLimitKey("staff-invite", context.user.id),
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    redirectWith(
      "error",
      `Too many invites sent. Please try again in ${rateLimit.retryAfterSeconds} seconds.`,
    );
  }

  try {
    await assertTeamAllowed(context.ownerId, workspace.id);

    const existingMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId: workspace.id,
        user: {
          email,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingMember) {
      throw new Error("That user is already a team member.");
    }

    const rawToken = randomBytes(32).toString("base64url");
    const tokenHash = hashInviteToken(rawToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

    await prisma.workspaceInvite.create({
      data: {
        workspaceId: workspace.id,
        email,
        role,
        tokenHash,
        expiresAt,
        invitedBy: context.user.id,
      },
    });

    const inviteUrl = `${getAppUrl()}/team/invite/accept?token=${encodeURIComponent(rawToken)}`;
    const emailResult = await sendWorkspaceInviteNotification({
      to: email,
      workspaceName: workspace.name || "My Workspace",
      inviteUrl,
    });

    revalidatePath(TEAM_PATH);

    if (!emailResult.ok) {
      redirectWith(
        "error",
        "Invite was created, but the email could not be sent. Please check email settings.",
      );
    }
  } catch (error) {
    redirectWith(
      "error",
      error instanceof Error ? error.message : "Unable to invite staff member.",
    );
  }

  redirectWith("success", "Staff invite sent.");
}

export async function removeWorkspaceMember(memberId: string) {
  const context = await requireWorkspaceOwner();
  const workspace = await getOrCreateUserWorkspace(context.ownerId);

  const member = await prisma.workspaceMember.findFirst({
    where: {
      id: memberId,
      workspaceId: workspace.id,
      role: {
        not: WorkspaceRole.OWNER,
      },
    },
    select: {
      id: true,
    },
  });

  if (!member) {
    redirectWith("error", "Team member not found.");
  }

  await prisma.workspaceMember.delete({
    where: { id: member.id },
  });

  revalidatePath(TEAM_PATH);
  redirectWith("success", "Team member removed.");
}

export async function updateWorkspaceMemberRole(memberId: string, formData: FormData) {
  const context = await requireWorkspaceOwner();
  const workspace = await getOrCreateUserWorkspace(context.ownerId);
  const role = parseRole(readString(formData, "role"));

  const member = await prisma.workspaceMember.findFirst({
    where: {
      id: memberId,
      workspaceId: workspace.id,
      role: {
        not: WorkspaceRole.OWNER,
      },
    },
    select: {
      id: true,
    },
  });

  if (!member) {
    redirectWith("error", "Team member not found.");
  }

  await prisma.workspaceMember.update({
    where: { id: member.id },
    data: { role },
  });

  revalidatePath(TEAM_PATH);
  redirectWith("success", "Team member role updated.");
}
