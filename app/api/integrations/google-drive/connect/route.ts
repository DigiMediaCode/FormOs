import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { getAppRedirectUrl } from "@/lib/app-url";
import { getGoogleDriveAuthUrl } from "@/lib/integrations/google-drive/client";
import { createGoogleDriveOAuthState } from "@/lib/integrations/google-drive/oauth-state";

const OAUTH_STATE_COOKIE = "formos_google_drive_oauth_state";

export async function GET(request: NextRequest) {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.redirect(getAppRedirectUrl("/login"));
  }

  const state = createGoogleDriveOAuthState(userId);
  const authUrl = getGoogleDriveAuthUrl(state);

  if (!authUrl) {
    return NextResponse.redirect(
      getAppRedirectUrl(
        "/dashboard/settings/integrations?error=Google%20Drive%20OAuth%20is%20not%20configured.",
      ),
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60,
    path: "/",
  });

  return NextResponse.redirect(authUrl);
}
