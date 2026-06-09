"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import {
  createApiTokenAction,
  type CreateApiTokenState,
} from "@/app/dashboard/settings/api-tokens/actions";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: CreateApiTokenState = {};

export function CreateApiTokenForm({ disabled }: { disabled: boolean }) {
  const [state, formAction] = useActionState(createApiTokenAction, initialState);

  return (
    <form action={formAction} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950">
          <KeyRound className="size-5 text-blue-600" />
          Create API token
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Use API tokens for external integrations such as Shopify form pickers.
          The token is shown once after creation.
        </p>
      </div>

      {state.error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.error}
        </p>
      ) : null}

      {state.rawToken ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-950">
            Token created: {state.tokenName}
          </p>
          <p className="mt-1 text-xs leading-5 text-emerald-800">
            Copy this now. For security, FormOS will not show it again.
          </p>
          <code className="mt-3 block break-all rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs text-slate-950">
            {state.rawToken}
          </code>
        </div>
      ) : null}

      <label className="grid gap-2 text-sm font-medium text-slate-800">
        Token name
        <input
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
          disabled={disabled}
          maxLength={80}
          name="name"
          placeholder="Shopify development store"
          required
        />
      </label>

      <SubmitButton
        className="w-fit rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled}
        pendingText="Creating token..."
      >
        Create Token
      </SubmitButton>
    </form>
  );
}
