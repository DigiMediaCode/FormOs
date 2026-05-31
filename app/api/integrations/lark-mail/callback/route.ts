import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAppRedirectUrl } from "@/lib/app-url";
import {
  exchangeLarkMailCode,
  saveLarkMailIntegration,
} from "@/lib/integrations/lark-mail/client";
import { readLarkMailOAuthState } from "@/lib/integrations/lark-mail/oauth-state";

const OAUTH_STATE_COOKIE = "formos_lark_mail_oauth_state";

function redirectToIntegrations(
  messageType: "error" | "success",
  message: string,
) {
  return NextResponse.redirect(
    getAppRedirectUrl(
      `/dashboard/settings/integrations?${messageType}=${encodeURIComponent(message)}`,
    ),
    { status: 303 },
  );
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(getAppRedirectUrl("/login"));
  }

  if (user.role !== UserRole.SUPER_ADMIN) {
    return redirectToIntegrations(
      "error",
      "Lark Mail can only be managed by a Super Admin.",
    );
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const larkError = request.nextUrl.searchParams.get("error");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;

  cookieStore.delete(OAUTH_STATE_COOKIE);

  if (larkError) {
    return redirectToIntegrations("error", "Lark Mail connection was cancelled or denied.");
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectToIntegrations("error", "Lark Mail connection could not be verified.");
  }

  const statePayload = readLarkMailOAuthState(state);

  if (!statePayload || statePayload.userId !== user.id) {
    return redirectToIntegrations("error", "Lark Mail connection could not be verified.");
  }

  try {
    const tokenResponse = await exchangeLarkMailCode(code);
    await saveLarkMailIntegration(user.id, tokenResponse);
  } catch {
    return redirectToIntegrations("error", "Lark Mail connection failed.");
  }

  return redirectToIntegrations("success", "Lark Mail connected.");
}
