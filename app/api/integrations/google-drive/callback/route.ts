import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import {
  exchangeGoogleDriveCode,
  saveGoogleDriveIntegration,
} from "@/lib/integrations/google-drive/client";
import { readGoogleDriveOAuthState } from "@/lib/integrations/google-drive/oauth-state";

const OAUTH_STATE_COOKIE = "formos_google_drive_oauth_state";

function redirectToIntegrations(
  request: NextRequest,
  messageType: "error" | "success",
  message: string,
) {
  return NextResponse.redirect(
    new URL(
      `/dashboard/settings/integrations?${messageType}=${encodeURIComponent(message)}`,
      request.url,
    ),
    { status: 303 },
  );
}

export async function GET(request: NextRequest) {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;

  cookieStore.delete(OAUTH_STATE_COOKIE);

  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectToIntegrations(request, "error", "Google Drive connection could not be verified.");
  }

  const statePayload = readGoogleDriveOAuthState(state);

  if (!statePayload || statePayload.userId !== userId) {
    return redirectToIntegrations(request, "error", "Google Drive connection could not be verified.");
  }

  try {
    const tokenResponse = await exchangeGoogleDriveCode(code);
    await saveGoogleDriveIntegration(userId, tokenResponse);
  } catch {
    return redirectToIntegrations(request, "error", "Google Drive connection failed.");
  }

  return redirectToIntegrations(request, "success", "Google Drive connected.");
}
