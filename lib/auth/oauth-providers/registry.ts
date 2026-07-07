import "server-only";

import { isGoogleAuthConfigured } from "@/lib/auth/oauth-providers/google";
import { isMicrosoftAuthConfigured } from "@/lib/auth/oauth-providers/microsoft";
import { isAppleAuthConfigured } from "@/lib/auth/oauth-providers/apple";
import { isFacebookAuthConfigured } from "@/lib/auth/oauth-providers/facebook";
import type { OAuthLoginProvider } from "@/lib/auth/oauth-state";

export type OAuthProviderMeta = {
  id: OAuthLoginProvider;
  label: string;
};

const PROVIDERS: Array<OAuthProviderMeta & { isConfigured: () => boolean }> = [
  { id: "google", label: "Google", isConfigured: isGoogleAuthConfigured },
  { id: "microsoft", label: "Microsoft", isConfigured: isMicrosoftAuthConfigured },
  { id: "apple", label: "Apple", isConfigured: isAppleAuthConfigured },
  { id: "facebook", label: "Facebook", isConfigured: isFacebookAuthConfigured },
];

/**
 * Only providers with all required environment credentials are returned, so the
 * login/signup UI never shows a button that would fail on click.
 */
export function getEnabledOAuthProviders(): OAuthProviderMeta[] {
  return PROVIDERS.filter((provider) => provider.isConfigured()).map(
    ({ id, label }) => ({ id, label }),
  );
}
