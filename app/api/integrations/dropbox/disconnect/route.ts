import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { getAppRedirectUrl } from "@/lib/app-url";
import { disconnectDropbox } from "@/lib/integrations/dropbox/client";

export async function POST() {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.redirect(getAppRedirectUrl("/login"));
  }

  await disconnectDropbox(userId);

  return NextResponse.redirect(
    getAppRedirectUrl(
      "/dashboard/settings/integrations?success=Dropbox%20disconnected.",
    ),
    { status: 303 },
  );
}
