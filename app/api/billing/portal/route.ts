import { NextResponse } from "next/server";
import { getAppRedirectUrl } from "@/lib/app-url";
import { createCustomerPortalSession } from "@/lib/billing/stripe";
import { requireBillingOwner } from "@/lib/auth/permissions";

function redirectToBilling(message: string) {
  return NextResponse.redirect(
    getAppRedirectUrl(
      `/dashboard/settings/billing?error=${encodeURIComponent(message)}`,
    ),
    { status: 303 },
  );
}

export async function POST() {
  const context = await requireBillingOwner();

  try {
    const session = await createCustomerPortalSession(context.user.id);

    return NextResponse.redirect(session.url, { status: 303 });
  } catch (error) {
    return redirectToBilling(
      error instanceof Error ? error.message : "Unable to open billing portal.",
    );
  }
}
