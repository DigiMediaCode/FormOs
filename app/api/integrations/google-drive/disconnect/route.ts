import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { getAppRedirectUrl } from "@/lib/app-url";
import { disconnectGoogleDrive } from "@/lib/integrations/google-drive/client";

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.redirect(getAppRedirectUrl("/login"));
  }

  await disconnectGoogleDrive(userId);

  return NextResponse.redirect(
    getAppRedirectUrl(
      "/dashboard/settings/integrations?success=Google%20Drive%20disconnected.",
    ),
    { status: 303 },
  );
}
