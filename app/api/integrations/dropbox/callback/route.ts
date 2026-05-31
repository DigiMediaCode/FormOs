import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { getAppRedirectUrl } from "@/lib/app-url";
import {
  exchangeDropboxCode,
  saveDropboxIntegration,
} from "@/lib/integrations/dropbox/client";
import { readDropboxOAuthState } from "@/lib/integrations/dropbox/oauth-state";

const OAUTH_STATE_COOKIE = "formos_dropbox_oauth_state";

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
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.redirect(getAppRedirectUrl("/login"));
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const dropboxError = request.nextUrl.searchParams.get("error");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;

  cookieStore.delete(OAUTH_STATE_COOKIE);

  if (dropboxError) {
    return redirectToIntegrations("error", "Dropbox connection was cancelled or denied.");
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectToIntegrations("error", "Dropbox connection could not be verified.");
  }

  const statePayload = readDropboxOAuthState(state);

  if (!statePayload || statePayload.userId !== userId) {
    return redirectToIntegrations("error", "Dropbox connection could not be verified.");
  }

  try {
    const tokenResponse = await exchangeDropboxCode(code);
    await saveDropboxIntegration(userId, tokenResponse);
  } catch {
    return redirectToIntegrations("error", "Dropbox connection failed.");
  }

  return redirectToIntegrations("success", "Dropbox connected.");
}
