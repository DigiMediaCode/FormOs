import { NextRequest } from "next/server";
import {
  exchangeMicrosoftAuthCode,
  getMicrosoftProfile,
} from "@/lib/auth/oauth-providers/microsoft";
import { completeOAuthCallback } from "@/lib/auth/oauth-route-helpers";

export function GET(request: NextRequest) {
  return completeOAuthCallback({
    provider: "microsoft",
    providerLabel: "Microsoft",
    code: request.nextUrl.searchParams.get("code"),
    state: request.nextUrl.searchParams.get("state"),
    exchange: exchangeMicrosoftAuthCode,
    getProfile: (token) => getMicrosoftProfile(token),
  });
}
