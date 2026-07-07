import { NextRequest } from "next/server";
import { getMicrosoftLoginUrl } from "@/lib/auth/oauth-providers/microsoft";
import { beginOAuthLogin } from "@/lib/auth/oauth-route-helpers";

export function GET(request: NextRequest) {
  return beginOAuthLogin(request, {
    provider: "microsoft",
    providerLabel: "Microsoft",
    buildAuthUrl: getMicrosoftLoginUrl,
  });
}
