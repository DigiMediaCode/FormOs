import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAppRedirectUrl } from "@/lib/app-url";
import { getDropboxOAuthUrl } from "@/lib/integrations/dropbox/client";
import { createDropboxOAuthState } from "@/lib/integrations/dropbox/oauth-state";
import { requireIntegrationOwner } from "@/lib/auth/permissions";

const OAUTH_STATE_COOKIE = "formos_dropbox_oauth_state";

export async function GET() {
  const context = await requireIntegrationOwner();

  const state = createDropboxOAuthState(context.user.id);
  const authUrl = getDropboxOAuthUrl(state);

  if (!authUrl) {
    return NextResponse.redirect(
      getAppRedirectUrl(
        "/dashboard/settings/integrations?error=Dropbox%20OAuth%20is%20not%20configured.",
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
