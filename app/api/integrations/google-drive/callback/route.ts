import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getAppRedirectUrl } from "@/lib/app-url";
import {
  exchangeGoogleDriveCode,
  saveGoogleDriveIntegration,
} from "@/lib/integrations/google-drive/client";
import { readGoogleDriveOAuthState } from "@/lib/integrations/google-drive/oauth-state";
import { getWorkspaceContextForCurrentUser } from "@/lib/workspaces/access";

const OAUTH_STATE_COOKIE = "formos_google_drive_oauth_state";

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
  const context = await getWorkspaceContextForCurrentUser();

  if (!context) {
    return NextResponse.redirect(getAppRedirectUrl("/login"));
  }

  if (!context.isOwner) {
    return redirectToIntegrations("error", "Only the workspace owner can manage integrations.");
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;

  cookieStore.delete(OAUTH_STATE_COOKIE);

  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectToIntegrations("error", "Google Drive connection could not be verified.");
  }

  const statePayload = readGoogleDriveOAuthState(state);

  if (!statePayload || statePayload.userId !== context.user.id) {
    return redirectToIntegrations("error", "Google Drive connection could not be verified.");
  }

  try {
    const tokenResponse = await exchangeGoogleDriveCode(code);
    await saveGoogleDriveIntegration(context.user.id, tokenResponse);
  } catch {
    return redirectToIntegrations("error", "Google Drive connection failed.");
  }

  return redirectToIntegrations("success", "Google Drive connected.");
}
