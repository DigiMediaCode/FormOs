import { NextResponse } from "next/server";
import { getAppRedirectUrl } from "@/lib/app-url";
import { disconnectDropbox } from "@/lib/integrations/dropbox/client";
import { requireIntegrationOwner } from "@/lib/auth/permissions";

export async function POST() {
  const context = await requireIntegrationOwner();

  await disconnectDropbox(context.user.id);

  return NextResponse.redirect(
    getAppRedirectUrl(
      "/dashboard/settings/integrations?success=Dropbox%20disconnected.",
    ),
    { status: 303 },
  );
}
