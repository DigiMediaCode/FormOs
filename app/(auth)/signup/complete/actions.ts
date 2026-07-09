"use server";

import { AuthTokenType } from "@prisma/client";
import { redirect } from "next/navigation";
import { createSession } from "@/lib/auth/session";
import {
  findValidAuthToken,
  invalidateUnusedAuthTokens,
  markAuthTokenUsed,
} from "@/lib/auth/tokens";
import { hashPassword } from "@/lib/auth/password";
import { createTemplateFormForOwner } from "@/lib/forms/templates/apply-template";
import { sendSignupNotification } from "@/lib/notifications/auth-notifications";
import { prisma } from "@/lib/prisma";

function redirectWithError(token: string, message: string): never {
  redirect(
    `/signup/complete?token=${encodeURIComponent(token)}&error=${encodeURIComponent(message)}`,
  );
}

function safeName(value: FormDataEntryValue | null) {
  return String(value ?? "").trim().slice(0, 120);
}

function safeTemplateSlug(value: unknown) {
  const slug = String(value ?? "").trim();

  return /^[a-z0-9-]+$/.test(slug) ? slug : "";
}

export async function completeSignupAction(formData: FormData) {
  const rawToken = String(formData.get("token") ?? "").trim();
  const firstName = safeName(formData.get("firstName"));
  const lastName = safeName(formData.get("lastName"));
  const password = String(formData.get("password") ?? "");

  if (!rawToken) {
    redirect("/login?error=Signup completion token is missing.");
  }

  if (password.length < 8) {
    redirectWithError(rawToken, "Password must be at least 8 characters.");
  }

  const token = await findValidAuthToken(rawToken, AuthTokenType.PASSWORD_RESET);

  if (!token) {
    redirect("/login?error=This signup completion link is invalid or expired.");
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: token.userId
        ? [{ id: token.userId }, { email: token.email }]
        : [{ email: token.email }],
    },
    select: {
      id: true,
      email: true,
      name: true,
      subscription: {
        select: {
          metadata: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login?error=This signup completion link is invalid or expired.");
  }

  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(password),
      emailVerifiedAt: new Date(),
      name: fullName || user.name,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
    },
  });

  await markAuthTokenUsed(token.id);
  await invalidateUnusedAuthTokens({
    email: user.email,
    type: AuthTokenType.PASSWORD_RESET,
    exceptTokenId: token.id,
  });
  await createSession(user.id);

  // Trial accounts are verified via the secure completion link, so no email
  // verification is sent — but new users should still get the welcome email.
  await sendSignupNotification({
    email: user.email,
    firstName: firstName || null,
    lastName: lastName || null,
    name: fullName || user.name,
  });

  const metadata =
    typeof user.subscription?.metadata === "object" &&
    user.subscription.metadata !== null &&
    !Array.isArray(user.subscription.metadata)
      ? user.subscription.metadata
      : {};
  const templateSlug = safeTemplateSlug(
    (metadata as Record<string, unknown>).templateSlug,
  );

  if (templateSlug) {
    const applied = await createTemplateFormForOwner({
      ownerId: user.id,
      templateSlug,
    });

    if (applied.ok) {
      redirect(
        `/dashboard/forms?success=${encodeURIComponent("Your trial is active and your template is ready in Drafts.")}`,
      );
    }

    // Access/creation failed — fall back to the picker with it preselected.
    redirect(
      `/dashboard/forms/new?template=${encodeURIComponent(templateSlug)}`,
    );
  }

  redirect(
    `/dashboard?success=${encodeURIComponent("Your trial is active. Welcome to FormOS.")}`,
  );
}
