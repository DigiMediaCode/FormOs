import { NextResponse } from "next/server";
import { getAppRedirectUrl } from "@/lib/app-url";
import { cancelStripeSubscriptionAtPeriodEnd } from "@/lib/billing/stripe";
import { requireBillingOwner } from "@/lib/auth/permissions";

function redirectToBilling(messageType: "error" | "success", message: string) {
  return NextResponse.redirect(
    getAppRedirectUrl(
      `/dashboard/settings/billing?${messageType}=${encodeURIComponent(message)}`,
    ),
    { status: 303 },
  );
}

export async function POST() {
  const context = await requireBillingOwner();

  try {
    await cancelStripeSubscriptionAtPeriodEnd(context.user.id);
  } catch (error) {
    return redirectToBilling(
      "error",
      error instanceof Error ? error.message : "Unable to cancel subscription.",
    );
  }

  return redirectToBilling(
    "success",
    "Your subscription will cancel at the end of the current billing period.",
  );
}
