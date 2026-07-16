import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getAppRedirectUrl } from "@/lib/app-url";
import { disconnectLarkMail } from "@/lib/integrations/lark-mail/client";

export async function POST() {
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

  await disconnectLarkMail(user.id);

  return NextResponse.redirect(
    getAppRedirectUrl(
      "/dashboard/settings/integrations?success=Lark%20Mail%20disconnected.",
    ),
    { status: 303 },
  );
}
