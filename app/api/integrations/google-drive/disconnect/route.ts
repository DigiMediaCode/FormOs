import { NextRequest, NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";
import { disconnectGoogleDrive } from "@/lib/integrations/google-drive/client";

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  await disconnectGoogleDrive(userId);

  return NextResponse.redirect(
    new URL(
      "/dashboard/settings/integrations?success=Google%20Drive%20disconnected.",
      request.url,
    ),
    { status: 303 },
  );
}
