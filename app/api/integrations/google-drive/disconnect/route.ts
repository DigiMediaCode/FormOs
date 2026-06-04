import { NextRequest, NextResponse } from "next/server";
import { getAppRedirectUrl } from "@/lib/app-url";
import { disconnectGoogleDrive } from "@/lib/integrations/google-drive/client";
import { getWorkspaceContextForCurrentUser } from "@/lib/workspaces/access";

export async function POST(request: NextRequest) {
  const context = await getWorkspaceContextForCurrentUser();

  if (!context) {
    return NextResponse.redirect(getAppRedirectUrl("/login"));
  }

  if (!context.isOwner) {
    return NextResponse.redirect(
      getAppRedirectUrl(
        "/dashboard?error=Only%20the%20workspace%20owner%20can%20manage%20integrations.",
      ),
      { status: 303 },
    );
  }

  await disconnectGoogleDrive(context.user.id);

  return NextResponse.redirect(
    getAppRedirectUrl(
      "/dashboard/settings/integrations?success=Google%20Drive%20disconnected.",
    ),
    { status: 303 },
  );
}
