import { NextResponse } from "next/server";
import { getAppRedirectUrl } from "@/lib/app-url";
import { cancelStripeSubscriptionAtPeriodEnd } from "@/lib/billing/stripe";
import { getWorkspaceContextForCurrentUser } from "@/lib/workspaces/access";

function redirectToBilling(messageType: "error" | "success", message: string) {
  return NextResponse.redirect(
    getAppRedirectUrl(
      `/dashboard/settings/billing?${messageType}=${encodeURIComponent(message)}`,
    ),
    { status: 303 },
  );
}

export async function POST() {
  const context = await getWorkspaceContextForCurrentUser();

  if (!context) {
    return NextResponse.redirect(getAppRedirectUrl("/login"), { status: 303 });
  }

  if (!context.isOwner) {
    return redirectToBilling("error", "Only the workspace owner can manage billing.");
  }

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
