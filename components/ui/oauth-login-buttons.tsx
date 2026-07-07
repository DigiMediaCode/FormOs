import { PendingLink } from "@/components/ui/pending-link";
import {
  AppleLogo,
  FacebookLogo,
  GoogleLogo,
  MicrosoftLogo,
} from "@/components/ui/oauth-provider-icons";
import { getEnabledOAuthProviders } from "@/lib/auth/oauth-providers/registry";
import type { OAuthLoginProvider } from "@/lib/auth/oauth-state";

const PROVIDER_ICONS: Record<
  OAuthLoginProvider,
  (props: { className?: string }) => React.ReactElement
> = {
  google: GoogleLogo,
  microsoft: MicrosoftLogo,
  apple: AppleLogo,
  facebook: FacebookLogo,
};

/**
 * Renders a "Continue with …" button for each social provider that is fully
 * configured via environment variables. Renders nothing when none are set up.
 */
export function OAuthLoginButtons({
  contextSuffix,
}: {
  contextSuffix: string;
}) {
  const providers = getEnabledOAuthProviders();

  if (providers.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 grid gap-3">
      {providers.map((provider) => {
        const Icon = PROVIDER_ICONS[provider.id];

        return (
          <PendingLink
            className="flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
            href={`/api/auth/${provider.id}/login${contextSuffix}`}
            key={provider.id}
            pendingText={`Redirecting to ${provider.label}...`}
          >
            <Icon />
            Continue with {provider.label}
          </PendingLink>
        );
      })}
    </div>
  );
}
