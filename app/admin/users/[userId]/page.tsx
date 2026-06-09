import Link from "next/link";
import {
  assignUserPlanAction,
  clearUserQuotaOverrideAction,
  saveUserQuotaOverrideAction,
} from "@/app/admin/users/[userId]/actions";
import {
  deleteUserAction,
  reactivateUserAction,
  suspendUserAction,
} from "@/app/admin/users/actions";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireSuperAdmin } from "@/lib/admin/auth";
import { fieldTypeLabel, SUPPORTED_FIELD_TYPES } from "@/lib/forms/fields";
import {
  allowedFieldTypeLabels,
  featureLabels,
  getUserPlanAccess,
  limitLabel,
  normalizePlanLimits,
  UNLIMITED_EVERYTHING_LIMITS,
  type PlanLimits,
} from "@/lib/plans/limits";
import { prisma } from "@/lib/prisma";

type AdminUserDetailPageProps = {
  params: Promise<{
    userId: string;
  }>;
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

const numericOverrideFields = [
  ["maxForms", "Max forms"],
  ["maxMonthlySubmissions", "Monthly submissions"],
  ["maxTeamMembers", "Team members"],
] as const;

const booleanOverrideFields = [
  ["allowGoogleDrive", "Google Drive uploads"],
  ["allowDropbox", "Dropbox uploads"],
  ["allowPdfGeneration", "Completed PDF generation"],
  ["allowOfficeUseFields", "Office Use Only fields"],
  ["allowTemplates", "Templates"],
  ["allowQrCode", "QR codes"],
  ["allowCustomBranding", "Custom branding"],
  ["allowTeamMembers", "Team members"],
  ["allowAdFreeForms", "Ad-free public forms"],
  ["allowEmbeds", "Form embeds"],
  ["allowApiAccess", "API access"],
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rawOverrideValue(value: unknown, key: keyof PlanLimits) {
  return isRecord(value) && key in value ? value[key] : undefined;
}

function numericMode(value: unknown) {
  if (value === undefined) {
    return "inherit";
  }

  return value === null ? "unlimited" : "custom";
}

function booleanMode(value: unknown) {
  if (value === undefined) {
    return "inherit";
  }

  return value === true ? "allow" : "block";
}

function allowedFieldTypesMode(value: unknown) {
  if (value === undefined) {
    return "inherit";
  }

  return value === null ? "all" : "custom";
}

function formatAuthMethods(user: {
  passwordHash: string | null;
  oauthAccounts: Array<{ provider: string }>;
}) {
  const methods = new Set<string>();

  if (user.passwordHash) {
    methods.add("Password");
  }

  user.oauthAccounts.forEach((account) => {
    if (account.provider === "google") {
      methods.add("Google");
    } else if (account.provider === "lark") {
      methods.add("Lark");
    }
  });

  return Array.from(methods).join(" + ") || "Not set";
}

function maskStripeId(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  if (value.length <= 12) {
    return value;
  }

  return `${value.slice(0, 8)}...${value.slice(-4)}`;
}

export default async function AdminUserDetailPage({
  params,
  searchParams,
}: AdminUserDetailPageProps) {
  await requireSuperAdmin();
  const { userId } = await params;
  const { error, success } = await searchParams;
  const [user, plans, access, override] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        passwordHash: true,
        role: true,
        suspendedAt: true,
        suspendedReason: true,
        oauthAccounts: {
          select: {
            provider: true,
          },
        },
        businessProfile: {
          select: {
            companyName: true,
            taxId: true,
            taxIdLabel: true,
            phone: true,
            billingEmail: true,
            billingName: true,
            country: true,
          },
        },
        subscription: {
          select: {
            planId: true,
            status: true,
            billingProvider: true,
            stripeCustomerId: true,
            stripeSubscriptionId: true,
            currentPeriodEnd: true,
          },
        },
        ownedWorkspace: {
          select: {
            name: true,
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
        apiTokens: {
          orderBy: {
            lastUsedAt: "desc",
          },
          select: {
            lastUsedAt: true,
            revokedAt: true,
          },
        },
      },
    }),
    prisma.subscriptionPlan.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
      },
    }),
    getUserPlanAccess(userId),
    prisma.userQuotaOverride.findUnique({
      where: { userId },
      select: {
        limits: true,
        reason: true,
      },
    }),
  ]);

  if (!user) {
    return (
      <main className="px-6 py-10">
        <div className="mx-auto max-w-4xl rounded-md border border-red-200 bg-red-50 p-6 text-red-800">
          User not found.
        </div>
      </main>
    );
  }

  const overrideLimits = override?.limits;
  const normalizedOverride = override ? normalizePlanLimits(override.limits) : null;
  const lastApiTokenUsed = user.apiTokens.find((token) => token.lastUsedAt)?.lastUsedAt;

  return (
    <main className="px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="border-b border-slate-200 pb-6">
          <Link className="text-sm font-medium text-blue-700 hover:text-blue-800" href="/admin/users">
            Users
          </Link>
          <h2 className="mt-3 text-3xl font-semibold text-slate-950">
            Manage {user.email}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {user.name || "No name"} · {user.role}
          </p>
          {user.suspendedAt ? (
            <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              Suspended: {user.suspendedReason || "No reason provided."}
            </p>
          ) : null}
        </header>

        {success ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</p> : null}
        {error ? <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}

        <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-6">
          <h3 className="text-xl font-semibold text-slate-950">Admin Safety Actions</h3>
          <div className="flex flex-wrap gap-3">
            {user.suspendedAt ? (
              <form action={reactivateUserAction.bind(null, user.id)}>
                <SubmitButton
                  className="rounded-md border border-emerald-200 bg-white px-4 py-2.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
                  pendingText="Reactivating user..."
                >
                  Reactivate User
                </SubmitButton>
              </form>
            ) : (
              <form action={suspendUserAction.bind(null, user.id)} className="flex flex-col gap-3 sm:flex-row">
                <input
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  name="suspendedReason"
                  placeholder="Suspension reason"
                />
                <ConfirmSubmitButton
                  confirmMessage="Suspend this user?"
                  pendingText="Suspending user..."
                >
                  Suspend User
                </ConfirmSubmitButton>
              </form>
            )}
            <form action={deleteUserAction.bind(null, user.id)}>
              <ConfirmSubmitButton
                confirmMessage="Delete this user? Active billing and linked data will block deletion."
                pendingText="Deleting user..."
              >
                Delete User
              </ConfirmSubmitButton>
            </form>
          </div>
        </section>

        <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-6">
          <h3 className="text-xl font-semibold text-slate-950">Current Access</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Plan</p>
              <p className="mt-1 font-semibold text-slate-950">{access.plan.name}</p>
            </div>
            <div className="rounded-md border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Forms</p>
              <p className="mt-1 font-semibold text-slate-950">
                {access.usage.formsUsed} / {limitLabel(access.limits.maxForms)}
              </p>
            </div>
            <div className="rounded-md border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Team members</p>
              <p className="mt-1 font-semibold text-slate-950">
                {limitLabel(access.limits.maxTeamMembers)}
              </p>
            </div>
            <div className="rounded-md border border-slate-200 p-4">
              <p className="text-sm text-slate-500">This month submissions</p>
              <p className="mt-1 font-semibold text-slate-950">
                {access.usage.monthlySubmissionsUsed} / {limitLabel(access.limits.maxMonthlySubmissions)}
              </p>
            </div>
          </div>
          {access.hasCustomQuota ? (
            <p className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              {access.isUnlimitedEverything
                ? "This user has unlimited access outside normal package limits."
                : "Custom quota applied."}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {featureLabels(access.limits).map((feature) => (
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  feature.allowed
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
                key={feature.label}
              >
                {feature.label}: {feature.allowed ? "Allowed" : "Blocked"}
              </span>
            ))}
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-950">
              Field types available
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-700">
              {allowedFieldTypeLabels(access.limits)}
            </p>
          </div>
        </section>

        <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-6">
          <h3 className="text-xl font-semibold text-slate-950">
            Profile Summary
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-sm text-slate-500">Workspace</p>
              <p className="mt-1 text-sm font-medium text-slate-950">
                {user.ownedWorkspace?.name || "Not created yet"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Team members</p>
              <p className="mt-1 text-sm font-medium text-slate-950">
                {user.ownedWorkspace
                  ? Math.max(user.ownedWorkspace._count.members - 1, 0)
                  : 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Plan allows team</p>
              <p className="mt-1 text-sm font-medium text-slate-950">
                {access.limits.allowTeamMembers ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Plan allows API access</p>
              <p className="mt-1 text-sm font-medium text-slate-950">
                {access.limits.allowApiAccess ? "Yes" : "No"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Active API tokens</p>
              <p className="mt-1 text-sm font-medium text-slate-950">
                {user.apiTokens.filter((token) => !token.revokedAt).length}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Last API token used</p>
              <p className="mt-1 text-sm font-medium text-slate-950">
                {lastApiTokenUsed
                  ? new Intl.DateTimeFormat("en", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(lastApiTokenUsed)
                  : "Never"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">First name</p>
              <p className="mt-1 text-sm font-medium text-slate-950">
                {user.firstName || "Not set"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Last name</p>
              <p className="mt-1 text-sm font-medium text-slate-950">
                {user.lastName || "Not set"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Phone</p>
              <p className="mt-1 text-sm font-medium text-slate-950">
                {user.phone || "Not set"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Auth methods</p>
              <p className="mt-1 text-sm font-medium text-slate-950">
                {formatAuthMethods(user)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Subscription status</p>
              <p className="mt-1 text-sm font-medium text-slate-950">
                {user.subscription?.status || "FREE"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Billing provider</p>
              <p className="mt-1 text-sm font-medium text-slate-950">
                {user.subscription?.billingProvider || "Not set"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Stripe customer</p>
              <p className="mt-1 text-sm font-medium text-slate-950">
                {maskStripeId(user.subscription?.stripeCustomerId)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Stripe subscription</p>
              <p className="mt-1 text-sm font-medium text-slate-950">
                {maskStripeId(user.subscription?.stripeSubscriptionId)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Current period end</p>
              <p className="mt-1 text-sm font-medium text-slate-950">
                {user.subscription?.currentPeriodEnd
                  ? new Intl.DateTimeFormat("en", {
                      dateStyle: "medium",
                    }).format(user.subscription.currentPeriodEnd)
                  : "Not set"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Company</p>
              <p className="mt-1 text-sm font-medium text-slate-950">
                {user.businessProfile?.companyName || "Not set"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">
                {user.businessProfile?.taxIdLabel || "Tax ID / ABN"}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-950">
                {user.businessProfile?.taxId || "Not set"}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Country</p>
              <p className="mt-1 text-sm font-medium text-slate-950">
                {user.businessProfile?.country || "Not set"}
              </p>
            </div>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-950">
              Billing profile
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-700">
              Billing name: {user.businessProfile?.billingName || "Not set"} ·
              Billing email: {user.businessProfile?.billingEmail || "Not set"} ·
              Business phone: {user.businessProfile?.phone || "Not set"}
            </p>
          </div>
          {override ? (
            <p className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              Effective access is using custom override.
            </p>
          ) : null}
        </section>

        <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-6">
          <h3 className="text-xl font-semibold text-slate-950">Assign Plan</h3>
          <form action={assignUserPlanAction.bind(null, user.id)} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <label className="flex flex-1 flex-col gap-2 text-sm font-medium text-slate-800">
              Plan
              <select
                className="rounded-md border border-slate-300 px-3 py-2"
                defaultValue={user.subscription?.planId ?? ""}
                name="planId"
              >
                <option value="">Free default</option>
                {plans
                  .filter((plan) => plan.isActive || plan.id === user.subscription?.planId)
                  .map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} ({plan.slug}
                      {plan.isActive ? "" : ", inactive"})
                    </option>
                  ))}
              </select>
            </label>
            <SubmitButton
              className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
              pendingText="Assigning plan..."
            >
              Assign Plan
            </SubmitButton>
          </form>
        </section>

        <section className="grid gap-4 rounded-md border border-slate-200 bg-white p-6">
          <h3 className="text-xl font-semibold text-slate-950">Quota Override</h3>
          <form action={saveUserQuotaOverrideAction.bind(null, user.id)} className="grid gap-5">
            <label className="flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-900">
              <input
                defaultChecked={
                  normalizedOverride
                    ? JSON.stringify(normalizedOverride) ===
                      JSON.stringify(UNLIMITED_EVERYTHING_LIMITS)
                    : false
                }
                name="unlimitedEverything"
                type="checkbox"
              />
              Grant unlimited/full access
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              {numericOverrideFields.map(([key, label]) => {
                const value = rawOverrideValue(overrideLimits, key);

                return (
                  <div className="rounded-md border border-slate-200 p-4" key={key}>
                    <p className="text-sm font-semibold text-slate-950">{label}</p>
                    <select className="mt-3 rounded-md border border-slate-300 px-3 py-2 text-sm" defaultValue={numericMode(value)} name={`${key}Mode`}>
                      <option value="inherit">Inherit plan</option>
                      <option value="custom">Custom number</option>
                      <option value="unlimited">Unlimited</option>
                    </select>
                    <input
                      className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                      defaultValue={typeof value === "number" ? value : ""}
                      min={0}
                      name={key}
                      placeholder="Custom number"
                      type="number"
                    />
                  </div>
                );
              })}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {booleanOverrideFields.map(([key, label]) => {
                const value = rawOverrideValue(overrideLimits, key);

                return (
                  <label className="flex flex-col gap-2 rounded-md border border-slate-200 p-4 text-sm font-medium text-slate-800" key={key}>
                    {label}
                    <select className="rounded-md border border-slate-300 px-3 py-2 text-sm" defaultValue={booleanMode(value)} name={`${key}Mode`}>
                      <option value="inherit">Inherit plan</option>
                      <option value="allow">Allow</option>
                      <option value="block">Block</option>
                    </select>
                  </label>
                );
              })}
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <h4 className="text-sm font-semibold text-slate-950">
                Allowed Field Types Override
              </h4>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Leave this on plan default unless this user needs field type
                access outside their package.
              </p>
              <select
                className="mt-4 rounded-md border border-slate-300 px-3 py-2 text-sm"
                defaultValue={allowedFieldTypesMode(
                  rawOverrideValue(overrideLimits, "allowedFieldTypes"),
                )}
                name="allowedFieldTypesMode"
              >
                <option value="inherit">Use plan default</option>
                <option value="all">Allow all field types</option>
                <option value="custom">Custom allowed field types</option>
              </select>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {SUPPORTED_FIELD_TYPES.map((fieldType) => {
                  const value = rawOverrideValue(overrideLimits, "allowedFieldTypes");
                  const checked =
                    value === null ||
                    (Array.isArray(value) && value.includes(fieldType));

                  return (
                    <label
                      className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                      key={fieldType}
                    >
                      <input
                        defaultChecked={checked}
                        name="allowedFieldTypes"
                        type="checkbox"
                        value={fieldType}
                      />
                      {fieldTypeLabel(fieldType)}
                    </label>
                  );
                })}
              </div>
            </div>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
              Reason
              <textarea className="min-h-20 rounded-md border border-slate-300 px-3 py-2" defaultValue={override?.reason ?? ""} name="reason" />
            </label>

            <div className="flex flex-wrap gap-3">
              <SubmitButton
                className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                pendingText="Saving quota override..."
              >
                Save Override
              </SubmitButton>
            </div>
          </form>
          <form action={clearUserQuotaOverrideAction.bind(null, user.id)}>
            <SubmitButton
              className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
              pendingText="Clearing quota override..."
            >
              Clear Override
            </SubmitButton>
          </form>
        </section>
      </div>
    </main>
  );
}
