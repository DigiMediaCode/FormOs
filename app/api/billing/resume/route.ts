import { NextResponse } from "next/server";
import { getAppRedirectUrl } from "@/lib/app-url";
import { getSessionUserId } from "@/lib/auth/session";
import { resumeStripeSubscription } from "@/lib/billing/stripe";

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
    await resumeStripeSubscription(userId);
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
