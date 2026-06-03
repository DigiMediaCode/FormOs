import { NextResponse } from "next/server";
import { getAppRedirectUrl } from "@/lib/app-url";
import { getSessionUserId } from "@/lib/auth/session";
import { createCustomerPortalSession } from "@/lib/billing/stripe";

function redirectToBilling(message: string) {
  return NextResponse.redirect(
    getAppRedirectUrl(
      `/dashboard/settings/billing?error=${encodeURIComponent(message)}`,
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
    const session = await createCustomerPortalSession(userId);

    return NextResponse.redirect(session.url, { status: 303 });
  } catch (error) {
    return redirectToBilling(
      error instanceof Error ? error.message : "Unable to open billing portal.",
    );
  }
}
