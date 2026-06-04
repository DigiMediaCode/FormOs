import { NextRequest, NextResponse } from "next/server";
import { getAppRedirectUrl } from "@/lib/app-url";
import { disconnectGoogleDrive } from "@/lib/integrations/google-drive/client";
import { requireIntegrationOwner } from "@/lib/auth/permissions";

export async function POST(request: NextRequest) {
  const context = await requireIntegrationOwner();

  await disconnectGoogleDrive(context.user.id);

  return NextResponse.redirect(
    getAppRedirectUrl(
      "/dashboard/settings/integrations?success=Google%20Drive%20disconnected.",
    ),
    { status: 303 },
  );
}
