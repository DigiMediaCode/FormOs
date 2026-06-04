import { NextResponse } from "next/server";
import { getAppRedirectUrl } from "@/lib/app-url";
import { resumeStripeSubscription } from "@/lib/billing/stripe";
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
    await resumeStripeSubscription(context.user.id);
  } catch (error) {
    return redirectToBilling(
      "error",
      error instanceof Error ? error.message : "Unable to resume subscription.",
    );
  }

  return redirectToBilling(
    "success",
    "Your subscription cancellation has been removed.",
  );
}
