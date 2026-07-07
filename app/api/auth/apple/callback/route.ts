import { NextRequest } from "next/server";
import {
  exchangeAppleAuthCode,
  getAppleProfile,
} from "@/lib/auth/oauth-providers/apple";
import { completeOAuthCallback } from "@/lib/auth/oauth-route-helpers";

// Apple uses response_mode=form_post, so the callback arrives as a POST.
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const codeField = formData.get("code");
  const stateField = formData.get("state");
  const userField = formData.get("user");

  return completeOAuthCallback({
    provider: "apple",
    providerLabel: "Apple",
    code: typeof codeField === "string" ? codeField : null,
    state: typeof stateField === "string" ? stateField : null,
    appleUserPayload: typeof userField === "string" ? userField : null,
    exchange: exchangeAppleAuthCode,
    getProfile: (token, appleUserPayload) =>
      getAppleProfile(token, appleUserPayload),
  });
}
