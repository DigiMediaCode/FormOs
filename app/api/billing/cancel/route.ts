import { NextResponse } from "next/server";
import { getAppRedirectUrl } from "@/lib/app-url";
import { getSessionUserId } from "@/lib/auth/session";
import { cancelStripeSubscriptionAtPeriodEnd } from "@/lib/billing/stripe";

function redirectToBilling(messageType: "error" | "success", message: string) {
  return NextResponse.redirect(
    getAppRedirectUrl(
      `/dashboard/settings/billing?${messageType}=${encodeURIComponent(message)}`,
    ),
    { status: 303 },
  );
}

export async function POST() {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.redirect(getAppRedirectUrl("/login"), { status: 303 });
  }

  try {
    await cancelStripeSubscriptionAtPeriodEnd(userId);
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
