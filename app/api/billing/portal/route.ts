import { NextResponse } from "next/server";
import { getAppRedirectUrl } from "@/lib/app-url";
import { createCustomerPortalSession } from "@/lib/billing/stripe";
import { getWorkspaceContextForCurrentUser } from "@/lib/workspaces/access";

function redirectToBilling(message: string) {
  return NextResponse.redirect(
    getAppRedirectUrl(
      `/dashboard/settings/billing?error=${encodeURIComponent(message)}`,
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
    return redirectToBilling("Only the workspace owner can manage billing.");
  }

  try {
    const session = await createCustomerPortalSession(context.user.id);

    return NextResponse.redirect(session.url, { status: 303 });
  } catch (error) {
    return redirectToBilling(
      error instanceof Error ? error.message : "Unable to open billing portal.",
    );
  }
}
