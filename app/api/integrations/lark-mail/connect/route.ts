import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAppRedirectUrl } from "@/lib/app-url";
import { getLarkMailAuthUrl } from "@/lib/integrations/lark-mail/client";
import { createLarkMailOAuthState } from "@/lib/integrations/lark-mail/oauth-state";

const OAUTH_STATE_COOKIE = "formos_lark_mail_oauth_state";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(getAppRedirectUrl("/login"));
  }

  if (user.suspendedAt) {
    return NextResponse.redirect(getAppRedirectUrl("/account-suspended"), {
      status: 303,
    });
  }

  if (user.role !== UserRole.SUPER_ADMIN) {
    return NextResponse.redirect(
      getAppRedirectUrl(
        "/dashboard/settings/integrations?error=Lark%20Mail%20can%20only%20be%20managed%20by%20a%20Super%20Admin.",
      ),
      { status: 303 },
    );
  }

  const state = createLarkMailOAuthState(user.id);
  const authUrl = getLarkMailAuthUrl(state);

  if (!authUrl) {
    return NextResponse.redirect(
      getAppRedirectUrl(
        "/dashboard/settings/integrations?error=Lark%20Mail%20OAuth%20is%20not%20configured.",
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
