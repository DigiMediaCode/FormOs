import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAppRedirectUrl } from "@/lib/app-url";
import { getGoogleDriveAuthUrl } from "@/lib/integrations/google-drive/client";
import { createGoogleDriveOAuthState } from "@/lib/integrations/google-drive/oauth-state";
import { getWorkspaceContextForCurrentUser } from "@/lib/workspaces/access";

const OAUTH_STATE_COOKIE = "formos_google_drive_oauth_state";

export async function GET(request: NextRequest) {
  const context = await getWorkspaceContextForCurrentUser();

  if (!context) {
    return NextResponse.redirect(getAppRedirectUrl("/login"));
  }

  if (!context.isOwner) {
    return NextResponse.redirect(
      getAppRedirectUrl(
        "/dashboard?error=Only%20the%20workspace%20owner%20can%20manage%20integrations.",
      ),
    );
  }

  const state = createGoogleDriveOAuthState(context.user.id);
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
