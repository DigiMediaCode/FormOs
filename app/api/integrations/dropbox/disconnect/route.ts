import { NextResponse } from "next/server";
import { getAppRedirectUrl } from "@/lib/app-url";
import { disconnectDropbox } from "@/lib/integrations/dropbox/client";
import { getWorkspaceContextForCurrentUser } from "@/lib/workspaces/access";

export async function POST() {
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

  await disconnectDropbox(context.user.id);

  return NextResponse.redirect(
    getAppRedirectUrl(
      "/dashboard/settings/integrations?success=Dropbox%20disconnected.",
    ),
    { status: 303 },
  );
}
