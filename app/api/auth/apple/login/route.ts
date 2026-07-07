import { NextRequest } from "next/server";
import { getAppleLoginUrl } from "@/lib/auth/oauth-providers/apple";
import { beginOAuthLogin } from "@/lib/auth/oauth-route-helpers";

export function GET(request: NextRequest) {
  return beginOAuthLogin(request, {
    provider: "apple",
    providerLabel: "Apple",
    buildAuthUrl: getAppleLoginUrl,
    // Apple returns via a cross-site POST, so the state cookie must be SameSite=None.
    sameSite: "none",
  });
}
