import { KeyRound, ShieldCheck } from "lucide-react";
import { CreateApiTokenForm } from "@/app/dashboard/settings/api-tokens/create-api-token-form";
import { revokeApiTokenAction } from "@/app/dashboard/settings/api-tokens/actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { getUserPlanAccess } from "@/lib/plans/limits";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceOwner } from "@/lib/workspaces/access";

function formatDate(date: Date | null | undefined) {
  if (!date) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function ApiTokensPage() {
  const context = await requireWorkspaceOwner();
  const [access, tokens] = await Promise.all([
    getUserPlanAccess(context.ownerId),
    prisma.apiToken.findMany({
      where: { userId: context.ownerId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        createdAt: true,
        lastUsedAt: true,
        revokedAt: true,
      },
    }),
  ]);
  const allowed = access.limits.allowApiAccess || access.limits.allowEmbeds;

  return (
    <main className="px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
            Workspace Settings
          </p>
          <h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold text-slate-950">
            <KeyRound className="size-7 text-blue-600" />
            API Tokens
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Create secure tokens for external integrations such as the FormOS
            Shopify app. Tokens can read safe published form metadata only; they
            cannot access submissions, storage tokens, billing data, or private
            account data.
          </p>
        </header>

        {!allowed ? (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="text-lg font-semibold text-amber-950">
              API tokens are not included in your current plan.
            </h2>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              Your current plan is {access.plan.name}. Upgrade your plan or ask
              Super Admin for a custom API token override.
            </p>
          </section>
        ) : (
          <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-blue-950">
              <ShieldCheck className="size-5" />
              API tokens enabled
            </h2>
            <p className="mt-2 text-sm leading-6 text-blue-900">
              Use Bearer tokens with <code>/api/external/forms</code> to fetch
              safe published form metadata for integrations like Shopify.
              Create a token here, then paste it into the FormOS Embed app inside
              Shopify Admin.
            </p>
          </section>
        )}

        <CreateApiTokenForm disabled={!allowed} />

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-950">Existing tokens</h2>
            <p className="mt-1 text-sm text-slate-600">
              Raw token values are never shown after creation.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-5 py-3 font-semibold">Created</th>
                  <th className="px-5 py-3 font-semibold">Last used</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tokens.map((token) => (
                  <tr key={token.id}>
                    <td className="px-5 py-4 font-medium text-slate-950">{token.name}</td>
                    <td className="px-5 py-4 text-slate-600">{formatDate(token.createdAt)}</td>
                    <td className="px-5 py-4 text-slate-600">{formatDate(token.lastUsedAt)}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          token.revokedAt
                            ? "bg-slate-100 text-slate-600"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {token.revokedAt ? "Revoked" : "Active"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {!token.revokedAt ? (
                        <form action={revokeApiTokenAction.bind(null, token.id)}>
                          <SubmitButton
                            className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                            pendingText="Revoking..."
                            showStatus={false}
                          >
                            Revoke
                          </SubmitButton>
                        </form>
                      ) : (
                        <span className="text-xs text-slate-400">No action</span>
                      )}
                    </td>
                  </tr>
                ))}
                {tokens.length === 0 ? (
                  <tr>
                    <td className="px-5 py-8 text-center text-sm text-slate-500" colSpan={5}>
                      No API tokens yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
