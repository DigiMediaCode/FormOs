import { NextRequest } from "next/server";
import { getFacebookLoginUrl } from "@/lib/auth/oauth-providers/facebook";
import { beginOAuthLogin } from "@/lib/auth/oauth-route-helpers";

export function GET(request: NextRequest) {
  return beginOAuthLogin(request, {
    provider: "facebook",
    providerLabel: "Facebook",
    buildAuthUrl: getFacebookLoginUrl,
  });
}
