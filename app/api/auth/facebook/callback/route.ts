import { NextRequest } from "next/server";
import {
  exchangeFacebookAuthCode,
  getFacebookProfile,
} from "@/lib/auth/oauth-providers/facebook";
import { completeOAuthCallback } from "@/lib/auth/oauth-route-helpers";

export function GET(request: NextRequest) {
  return completeOAuthCallback({
    provider: "facebook",
    providerLabel: "Facebook",
    code: request.nextUrl.searchParams.get("code"),
    state: request.nextUrl.searchParams.get("state"),
    exchange: exchangeFacebookAuthCode,
    getProfile: (token) => getFacebookProfile(token),
  });
}
