import { NextRequest, NextResponse } from "next/server";
import { getAppRedirectUrl } from "@/lib/app-url";
import {
  createCheckoutSession,
  type BillingInterval,
} from "@/lib/billing/stripe";
import { requireBillingOwner } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

function redirectToBilling(message: string) {
  return NextResponse.redirect(
    getAppRedirectUrl(
      `/dashboard/settings/billing?error=${encodeURIComponent(message)}`,
    ),
    { status: 303 },
  );
}

function isBillingInterval(value: string): value is BillingInterval {
  return value === "monthly" || value === "yearly";
}

function safePlanSlug(value: string | null) {
  const plan = String(value ?? "").trim().toLowerCase();

  return /^[a-z0-9-]+$/.test(plan) ? plan : "";
}

export async function GET(request: NextRequest) {
  const context = await requireBillingOwner();
  const planSlug = safePlanSlug(request.nextUrl.searchParams.get("plan"));
  const intervalParam = String(
    request.nextUrl.searchParams.get("interval") ?? "monthly",
  ).trim();
  const interval = isBillingInterval(intervalParam) ? intervalParam : "monthly";

  if (!planSlug || planSlug === "free") {
    return redirectToBilling("Choose a valid paid plan to start checkout.");
  }

  const plan = await prisma.subscriptionPlan.findFirst({
    where: {
      slug: planSlug,
      isActive: true,
      isPublic: true,
    },
    select: {
      id: true,
    },
  });

  if (!plan) {
    return redirectToBilling("That plan is not available.");
  }

  try {
    const session = await createCheckoutSession({
      userId: context.user.id,
      planId: plan.id,
      interval,
    });

    if (!session.url) {
      return redirectToBilling("Stripe Checkout did not return a redirect URL.");
    }

    return NextResponse.redirect(session.url, { status: 303 });
  } catch (error) {
    return redirectToBilling(
      error instanceof Error ? error.message : "Unable to start checkout.",
    );
  }
}
