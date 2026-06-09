"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspaceOwner } from "@/lib/workspaces/access";
import { generateApiToken, hashApiToken } from "@/lib/api-tokens";
import { getUserPlanAccess } from "@/lib/plans/limits";
import { prisma } from "@/lib/prisma";

const API_TOKENS_PATH = "/dashboard/settings/api-tokens";

export type CreateApiTokenState = {
  error?: string;
  rawToken?: string;
  tokenName?: string;
};

function readTokenName(formData: FormData) {
  return String(formData.get("name") ?? "").trim().slice(0, 80);
}

export async function createApiTokenAction(
  _state: CreateApiTokenState,
  formData: FormData,
): Promise<CreateApiTokenState> {
  const context = await requireWorkspaceOwner();
  const access = await getUserPlanAccess(context.ownerId);

  if (!access.limits.allowApiAccess && !access.limits.allowEmbeds) {
    return {
      error: "API tokens are not included in your current plan.",
    };
  }

  const name = readTokenName(formData);

  if (!name) {
    return {
      error: "Token name is required.",
    };
  }

  const rawToken = generateApiToken();

  await prisma.apiToken.create({
    data: {
      userId: context.ownerId,
      name,
      tokenHash: hashApiToken(rawToken),
      scopes: ["forms:read"],
    },
  });

  revalidatePath(API_TOKENS_PATH);

  return {
    rawToken,
    tokenName: name,
  };
}

export async function revokeApiTokenAction(tokenId: string) {
  const context = await requireWorkspaceOwner();

  await prisma.apiToken.updateMany({
    where: {
      id: tokenId,
      userId: context.ownerId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  revalidatePath(API_TOKENS_PATH);
}
