import { NextRequest, NextResponse } from "next/server";
import { getAppRedirectUrl } from "@/lib/app-url";
import { getSessionUserId } from "@/lib/auth/session";
import {
  createCheckoutSession,
  type BillingInterval,
} from "@/lib/billing/stripe";

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

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.redirect(getAppRedirectUrl("/login"), { status: 303 });
  }

  const formData = await request.formData();
  const planId = String(formData.get("planId") ?? "").trim();
  const interval = String(formData.get("interval") ?? "").trim();

  if (!planId || !isBillingInterval(interval)) {
    return redirectToBilling("Choose a valid plan and billing interval.");
  }

  try {
    const session = await createCheckoutSession({ userId, planId, interval });

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
