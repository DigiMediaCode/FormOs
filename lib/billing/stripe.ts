import "server-only";

import { Prisma } from "@prisma/client";
import Stripe from "stripe";
import { getAppUrl } from "@/lib/app-url";
import { createBillingEvent } from "@/lib/billing/events";
import { getPlatformSettings } from "@/lib/platform/settings";
import { prisma } from "@/lib/prisma";

export type BillingInterval = "monthly" | "yearly";

let stripeClient: Stripe | null = null;

function getStripeSecretKey() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Stripe is not configured.");
  }

  return secretKey;
}

export function getStripeClient() {
  if (!stripeClient) {
    stripeClient = new Stripe(getStripeSecretKey());
  }

  return stripeClient;
}

function toDateFromUnix(value: unknown) {
  return typeof value === "number" ? new Date(value * 1000) : null;
}

function normalizeStatus(status: string | null | undefined) {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "trialing":
      return "TRIALING";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
      return "CANCELED";
    case "incomplete":
    case "incomplete_expired":
      return "INCOMPLETE";
    default:
      return status ? status.toUpperCase() : "INCOMPLETE";
  }
}

function getSubscriptionPriceId(subscription: Stripe.Subscription) {
  return subscription.items.data[0]?.price.id ?? null;
}

function moneyToCents(value: Prisma.Decimal | number | string | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  const amount = Number(value);

  if (!Number.isFinite(amount) || amount < 0) {
    return null;
  }

  return Math.round(amount * 100);
}

function safeStripeError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown Stripe error";

  return message.slice(0, 500);
}

async function archiveStripePrice(priceId: string | null | undefined) {
  if (!priceId) {
    return;
  }

  try {
    await getStripeClient().prices.update(priceId, { active: false });
  } catch (error) {
    console.warn("[formos:stripe] Unable to archive old price safely.", {
      priceId,
      error: safeStripeError(error),
    });
  }
}

async function shouldCreateStripePrice({
  priceId,
  unitAmount,
  currency,
  interval,
}: {
  priceId: string | null;
  unitAmount: number;
  currency: string;
  interval: "month" | "year";
}) {
  if (!priceId) {
    return true;
  }

  try {
    const price = await getStripeClient().prices.retrieve(priceId);

    return (
      price.unit_amount !== unitAmount ||
      price.currency !== currency ||
      price.recurring?.interval !== interval
    );
  } catch {
    return true;
  }
}

export function mapStripeSubscriptionStatus(subscription: Stripe.Subscription) {
  const trialStart = (subscription as unknown as { trial_start?: number | null }).trial_start;
  const trialEnd = (subscription as unknown as { trial_end?: number | null }).trial_end;

  return {
    status: normalizeStatus(subscription.status),
    stripeSubscriptionId: subscription.id,
    stripeCustomerId:
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id,
    stripePriceId: getSubscriptionPriceId(subscription),
    currentPeriodStart: toDateFromUnix(
      (subscription as unknown as { current_period_start?: number }).current_period_start,
    ),
    currentPeriodEnd: toDateFromUnix(
      (subscription as unknown as { current_period_end?: number }).current_period_end,
    ),
    trialStartedAt: toDateFromUnix(trialStart),
    trialEndsAt: toDateFromUnix(trialEnd),
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
  };
}

function isPaidStripeStatus(status: string | null | undefined) {
  return ["ACTIVE", "TRIALING", "PAST_DUE", "INCOMPLETE"].includes(
    status?.toUpperCase() ?? "",
  );
}

export async function findPlanByStripePriceId(priceId: string | null | undefined) {
  if (!priceId) {
    return null;
  }

  return prisma.subscriptionPlan.findFirst({
    where: {
      OR: [
        { stripeMonthlyPriceId: priceId },
        { stripeYearlyPriceId: priceId },
      ],
    },
    select: {
      id: true,
      name: true,
    },
  });
}

export async function createOrUpdateStripeProduct(plan: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  stripeProductId: string | null;
}) {
  const stripe = getStripeClient();
  const productData = {
    name: plan.name,
    description: plan.description ?? undefined,
    metadata: {
      formosPlanId: plan.id,
      formosPlanSlug: plan.slug,
    },
  };

  if (!plan.stripeProductId) {
    return stripe.products.create(productData);
  }

  try {
    return await stripe.products.update(plan.stripeProductId, productData);
  } catch {
    return stripe.products.create(productData);
  }
}

export async function createStripeRecurringPrice({
  productId,
  planId,
  interval,
  amount,
  currency,
}: {
  productId: string;
  planId: string;
  interval: BillingInterval;
  amount: Prisma.Decimal | number | string | null | undefined;
  currency: string;
}) {
  const unitAmount = moneyToCents(amount);

  if (!unitAmount || unitAmount <= 0) {
    return null;
  }

  const stripeInterval = interval === "monthly" ? "month" : "year";

  return getStripeClient().prices.create({
    product: productId,
    unit_amount: unitAmount,
    currency: currency.toLowerCase(),
    recurring: {
      interval: stripeInterval,
    },
    metadata: {
      formosPlanId: planId,
      interval,
    },
  });
}

export async function syncPlanToStripe(planId: string) {
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      priceMonthly: true,
      priceYearly: true,
      currency: true,
      stripeProductId: true,
      stripeMonthlyPriceId: true,
      stripeYearlyPriceId: true,
    },
  });

  if (!plan) {
    throw new Error("Plan not found.");
  }

  try {
    if (!plan.name || !plan.currency) {
      throw new Error("Plan name and currency are required before syncing.");
    }

    const product = await createOrUpdateStripeProduct(plan);
    const monthlyCents = moneyToCents(plan.priceMonthly);
    const yearlyCents = moneyToCents(plan.priceYearly);

    if ((monthlyCents === null || monthlyCents === 0) && (yearlyCents === null || yearlyCents === 0)) {
      await prisma.subscriptionPlan.update({
        where: { id: plan.id },
        data: {
          stripeProductId: product.id,
          stripeMonthlyPriceId: null,
          stripeYearlyPriceId: null,
          stripeSyncedAt: new Date(),
          stripeSyncStatus: "synced",
          stripeSyncError: null,
        },
      });

      return {
        productId: product.id,
        monthlyPriceId: null,
        yearlyPriceId: null,
      };
    }

    let monthlyPriceId = plan.stripeMonthlyPriceId;
    let yearlyPriceId = plan.stripeYearlyPriceId;

    if (monthlyCents && monthlyCents > 0) {
      const shouldCreateMonthly = await shouldCreateStripePrice({
        priceId: plan.stripeMonthlyPriceId,
        unitAmount: monthlyCents,
        currency: plan.currency.toLowerCase(),
        interval: "month",
      });

      if (shouldCreateMonthly) {
        const oldPriceId = plan.stripeMonthlyPriceId;
        const price = await createStripeRecurringPrice({
          productId: product.id,
          planId: plan.id,
          interval: "monthly",
          amount: plan.priceMonthly,
          currency: plan.currency,
        });

        monthlyPriceId = price?.id ?? null;
        await archiveStripePrice(oldPriceId);
      }
    } else {
      await archiveStripePrice(plan.stripeMonthlyPriceId);
      monthlyPriceId = null;
    }

    if (yearlyCents && yearlyCents > 0) {
      const shouldCreateYearly = await shouldCreateStripePrice({
        priceId: plan.stripeYearlyPriceId,
        unitAmount: yearlyCents,
        currency: plan.currency.toLowerCase(),
        interval: "year",
      });

      if (shouldCreateYearly) {
        const oldPriceId = plan.stripeYearlyPriceId;
        const price = await createStripeRecurringPrice({
          productId: product.id,
          planId: plan.id,
          interval: "yearly",
          amount: plan.priceYearly,
          currency: plan.currency,
        });

        yearlyPriceId = price?.id ?? null;
        await archiveStripePrice(oldPriceId);
      }
    } else {
      await archiveStripePrice(plan.stripeYearlyPriceId);
      yearlyPriceId = null;
    }

    await prisma.subscriptionPlan.update({
      where: { id: plan.id },
      data: {
        stripeProductId: product.id,
        stripeMonthlyPriceId: monthlyPriceId,
        stripeYearlyPriceId: yearlyPriceId,
        stripeSyncedAt: new Date(),
        stripeSyncStatus: "synced",
        stripeSyncError: null,
      },
    });

    await createBillingEvent({
      eventType: "stripe_plan_sync_succeeded",
      status: "PROCESSED",
      message: "Plan synced to Stripe.",
      metadata: {
        planId: plan.id,
        stripeProductId: product.id,
        monthlyPriceId,
        yearlyPriceId,
      },
      processedAt: new Date(),
    });

    return {
      productId: product.id,
      monthlyPriceId,
      yearlyPriceId,
    };
  } catch (error) {
    const stripeSyncError = safeStripeError(error);

    await prisma.subscriptionPlan.update({
      where: { id: plan.id },
      data: {
        stripeSyncStatus: "error",
        stripeSyncError,
      },
    });

    await createBillingEvent({
      eventType: "stripe_plan_sync_failed",
      status: "FAILED",
      message: stripeSyncError,
      metadata: {
        planId: plan.id,
      },
      processedAt: new Date(),
    });

    throw new Error(stripeSyncError);
  }
}

export async function createOrGetStripeCustomer(userId: string) {
  const existingSubscription = await prisma.userSubscription.findUnique({
    where: { userId },
    select: {
      stripeCustomerId: true,
    },
  });

  if (existingSubscription?.stripeCustomerId) {
    return existingSubscription.stripeCustomerId;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      businessProfile: {
        select: {
          companyName: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  const stripe = getStripeClient();
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.businessProfile?.companyName || user.name || undefined,
    metadata: {
      formosUserId: user.id,
      email: user.email,
    },
  });

  await prisma.userSubscription.upsert({
    where: { userId },
    create: {
      userId,
      status: "INCOMPLETE",
      stripeCustomerId: customer.id,
      billingProvider: "stripe",
    },
    update: {
      stripeCustomerId: customer.id,
    },
  });

  return customer.id;
}

export async function createCheckoutSession({
  userId,
  planId,
  interval,
}: {
  userId: string;
  planId: string;
  interval: BillingInterval;
}) {
  const plan = await prisma.subscriptionPlan.findFirst({
    where: {
      id: planId,
      isActive: true,
      isPublic: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      priceMonthly: true,
      priceYearly: true,
      stripeMonthlyPriceId: true,
      stripeYearlyPriceId: true,
    },
  });

  if (!plan) {
    throw new Error("Plan is not available.");
  }

  const selectedAmount = interval === "monthly" ? plan.priceMonthly : plan.priceYearly;
  const selectedCents = moneyToCents(selectedAmount);

  if (!selectedCents || selectedCents <= 0) {
    throw new Error("Free plans do not use Stripe Checkout.");
  }

  const priceId =
    interval === "monthly" ? plan.stripeMonthlyPriceId : plan.stripeYearlyPriceId;

  if (!priceId) {
    throw new Error("This plan is not configured for Stripe Checkout yet.");
  }

  const currentSubscription = await prisma.userSubscription.findUnique({
    where: { userId },
    select: {
      planId: true,
      status: true,
      trialUsedAt: true,
    },
  });
  const currentStatus = currentSubscription?.status?.toUpperCase();

  if (
    currentSubscription?.planId === plan.id &&
    (currentStatus === "ACTIVE" || currentStatus === "TRIALING")
  ) {
    throw new Error("You are already subscribed to this plan.");
  }

  const customerId = await createOrGetStripeCustomer(userId);
  const appUrl = getAppUrl();
  const stripe = getStripeClient();
  const platformSettings = await getPlatformSettings();
  const eligibleForTrial =
    platformSettings.trialEnabled &&
    !currentSubscription?.trialUsedAt &&
    !isPaidStripeStatus(currentStatus);

  try {
    const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    payment_method_collection: eligibleForTrial ? "always" : "if_required",
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/dashboard/settings/billing?checkout=success`,
    cancel_url: `${appUrl}/dashboard/settings/billing?checkout=cancelled`,
    metadata: {
      formosUserId: userId,
      planId: plan.id,
      interval,
    },
    subscription_data: {
      ...(eligibleForTrial
        ? {
            trial_period_days: platformSettings.trialDays,
          }
        : {}),
      metadata: {
        formosUserId: userId,
        planId: plan.id,
        interval,
        trialEligible: eligibleForTrial ? "true" : "false",
      },
    },
  });

    await createBillingEvent({
      eventType: "checkout_session_created",
      userId,
      customerId,
      status: "PROCESSED",
      message: "Stripe Checkout session created.",
      metadata: {
        planId: plan.id,
        interval,
        priceId,
        userId,
        customerId,
        checkoutSessionId: session.id,
        trialEligible: eligibleForTrial,
        trialDays: eligibleForTrial ? platformSettings.trialDays : null,
      },
      processedAt: new Date(),
    });

    return session;
  } catch (error) {
    await createBillingEvent({
      eventType: "checkout_session_failed",
      userId,
      customerId,
      status: "FAILED",
      message: error instanceof Error ? error.message : "Unable to create checkout session.",
      metadata: {
        planId: plan.id,
        interval,
        priceId,
      },
      processedAt: new Date(),
    });

    throw error;
  }
}

function safeMetadataValue(value: string | null | undefined) {
  return String(value ?? "").slice(0, 200);
}

export async function createPublicTrialCheckoutSession({
  planSlug,
  interval,
  templateSlug,
  source,
}: {
  planSlug: string;
  interval: BillingInterval;
  templateSlug?: string | null;
  source?: string | null;
}) {
  const plan = await prisma.subscriptionPlan.findFirst({
    where: {
      slug: planSlug,
      isActive: true,
      isPublic: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      priceMonthly: true,
      priceYearly: true,
      stripeMonthlyPriceId: true,
      stripeYearlyPriceId: true,
    },
  });

  if (!plan || plan.slug === "free") {
    throw new Error("Choose a valid paid plan to start a trial.");
  }

  const selectedAmount = interval === "monthly" ? plan.priceMonthly : plan.priceYearly;
  const selectedCents = moneyToCents(selectedAmount);

  if (!selectedCents || selectedCents <= 0) {
    throw new Error("Free plans do not use Stripe Checkout.");
  }

  const priceId =
    interval === "monthly" ? plan.stripeMonthlyPriceId : plan.stripeYearlyPriceId;

  if (!priceId) {
    throw new Error("This plan is not configured for Stripe Checkout yet.");
  }

  const platformSettings = await getPlatformSettings();

  if (!platformSettings.trialEnabled) {
    throw new Error("Paid plan trials are not enabled right now.");
  }

  const appUrl = getAppUrl();
  const stripe = getStripeClient();
  const metadata = {
    planId: plan.id,
    planSlug: plan.slug,
    planName: plan.name,
    interval,
    trialDays: String(platformSettings.trialDays),
    source: safeMetadataValue(source) || "public_pricing",
    templateSlug: safeMetadataValue(templateSlug),
    trialEligible: "true",
  };

  try {
    const cancelParams = new URLSearchParams({
      plan: "free",
      checkout_cancelled: "1",
    });

    if (metadata.templateSlug) {
      cancelParams.set("template", metadata.templateSlug);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_collection: "always",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/signup/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/signup?${cancelParams.toString()}`,
      metadata,
      subscription_data: {
        trial_period_days: platformSettings.trialDays,
        metadata,
      },
    });

    await createBillingEvent({
      eventType: "public_trial_checkout_session_created",
      status: "PROCESSED",
      message: "Public Stripe trial Checkout session created.",
      metadata: {
        planId: plan.id,
        planSlug: plan.slug,
        interval,
        priceId,
        checkoutSessionId: session.id,
        trialDays: platformSettings.trialDays,
        source: metadata.source,
        templateSlug: metadata.templateSlug || null,
      },
      processedAt: new Date(),
    });

    return session;
  } catch (error) {
    await createBillingEvent({
      eventType: "public_trial_checkout_session_failed",
      status: "FAILED",
      message:
        error instanceof Error
          ? error.message
          : "Unable to create public trial Checkout session.",
      metadata: {
        planId: plan.id,
        planSlug: plan.slug,
        interval,
        priceId,
      },
      processedAt: new Date(),
    });

    throw error;
  }
}

export async function cancelStripeSubscriptionAtPeriodEnd(userId: string) {
  const subscription = await prisma.userSubscription.findUnique({
    where: { userId },
    select: {
      stripeSubscriptionId: true,
      stripeCustomerId: true,
      status: true,
    },
  });

  if (!subscription?.stripeSubscriptionId) {
    throw new Error("No active Stripe subscription was found.");
  }

  if (subscription.status === "CANCELED") {
    throw new Error("This subscription is already canceled.");
  }

  const updatedSubscription = await getStripeClient().subscriptions.update(
    subscription.stripeSubscriptionId,
    {
      cancel_at_period_end: true,
    },
  );

  await prisma.userSubscription.update({
    where: { userId },
    data: {
      cancelAtPeriodEnd: true,
      currentPeriodEnd: mapStripeSubscriptionStatus(updatedSubscription).currentPeriodEnd,
    },
  });

  await createBillingEvent({
    eventType: "subscription_cancel_at_period_end_set",
    userId,
    customerId: subscription.stripeCustomerId,
    subscriptionId: subscription.stripeSubscriptionId,
    status: "PROCESSED",
    message: "Subscription will cancel at period end.",
    processedAt: new Date(),
  });
}

export async function resumeStripeSubscription(userId: string) {
  const subscription = await prisma.userSubscription.findUnique({
    where: { userId },
    select: {
      stripeSubscriptionId: true,
      stripeCustomerId: true,
      status: true,
    },
  });

  if (!subscription?.stripeSubscriptionId) {
    throw new Error("No active Stripe subscription was found.");
  }

  if (subscription.status === "CANCELED") {
    throw new Error("Canceled subscriptions cannot be resumed here.");
  }

  const updatedSubscription = await getStripeClient().subscriptions.update(
    subscription.stripeSubscriptionId,
    {
      cancel_at_period_end: false,
    },
  );

  await prisma.userSubscription.update({
    where: { userId },
    data: {
      cancelAtPeriodEnd: false,
      currentPeriodEnd: mapStripeSubscriptionStatus(updatedSubscription).currentPeriodEnd,
    },
  });

  await createBillingEvent({
    eventType: "subscription_cancel_at_period_end_removed",
    userId,
    customerId: subscription.stripeCustomerId,
    subscriptionId: subscription.stripeSubscriptionId,
    status: "PROCESSED",
    message: "Subscription cancellation was removed.",
    processedAt: new Date(),
  });
}

export async function createCustomerPortalSession(userId: string) {
  const subscription = await prisma.userSubscription.findUnique({
    where: { userId },
    select: {
      stripeCustomerId: true,
    },
  });

  if (!subscription?.stripeCustomerId) {
    throw new Error("No Stripe customer exists for this account.");
  }

  const stripe = getStripeClient();

  try {
    const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url:
      process.env.STRIPE_BILLING_PORTAL_RETURN_URL ||
      `${getAppUrl()}/dashboard/settings/billing`,
  });

    await createBillingEvent({
      eventType: "customer_portal_session_created",
      userId,
      customerId: subscription.stripeCustomerId,
      status: "PROCESSED",
      message: "Stripe Customer Portal session created.",
      metadata: {
        portalSessionId: session.id,
      },
      processedAt: new Date(),
    });

    return session;
  } catch (error) {
    await createBillingEvent({
      eventType: "customer_portal_session_failed",
      userId,
      customerId: subscription.stripeCustomerId,
      status: "FAILED",
      message: error instanceof Error ? error.message : "Unable to create portal session.",
      processedAt: new Date(),
    });

    throw error;
  }
}

export async function syncStripeSubscription(subscription: Stripe.Subscription) {
  const mapped = mapStripeSubscriptionStatus(subscription);
  const plan = await findPlanByStripePriceId(mapped.stripePriceId);
  const metadataUserId =
    typeof subscription.metadata.formosUserId === "string"
      ? subscription.metadata.formosUserId
      : null;
  const existing = await prisma.userSubscription.findFirst({
    where: {
      OR: [
        { stripeSubscriptionId: mapped.stripeSubscriptionId },
        { stripeCustomerId: mapped.stripeCustomerId },
        ...(metadataUserId ? [{ userId: metadataUserId }] : []),
      ],
    },
    select: {
      userId: true,
      trialUsedAt: true,
    },
  });
  const userId = existing?.userId ?? metadataUserId;

  if (!userId) {
    console.warn("[formos:stripe] Subscription webhook had no matching user.", {
      stripeSubscriptionId: mapped.stripeSubscriptionId,
      stripeCustomerId: mapped.stripeCustomerId,
      hasPriceId: Boolean(mapped.stripePriceId),
    });
    return null;
  }

  const trialUsedAt =
    mapped.status === "TRIALING" ? existing?.trialUsedAt ?? new Date() : undefined;

  return prisma.userSubscription.upsert({
    where: { userId },
    create: {
      userId,
      planId: plan?.id ?? null,
      status: mapped.status,
      stripeCustomerId: mapped.stripeCustomerId,
      stripeSubscriptionId: mapped.stripeSubscriptionId,
      stripePriceId: mapped.stripePriceId,
      currentPeriodStart: mapped.currentPeriodStart,
      currentPeriodEnd: mapped.currentPeriodEnd,
      trialStartedAt: mapped.trialStartedAt,
      trialEndsAt: mapped.trialEndsAt,
      trialPlanId: mapped.status === "TRIALING" ? plan?.id ?? null : null,
      trialUsedAt: trialUsedAt ?? null,
      cancelAtPeriodEnd: mapped.cancelAtPeriodEnd,
      billingProvider: "stripe",
    },
    update: {
      planId: plan?.id ?? null,
      status: mapped.status,
      stripeCustomerId: mapped.stripeCustomerId,
      stripeSubscriptionId: mapped.stripeSubscriptionId,
      stripePriceId: mapped.stripePriceId,
      currentPeriodStart: mapped.currentPeriodStart,
      currentPeriodEnd: mapped.currentPeriodEnd,
      trialStartedAt: mapped.trialStartedAt,
      trialEndsAt: mapped.trialEndsAt,
      trialPlanId: mapped.status === "TRIALING" ? plan?.id ?? null : undefined,
      trialUsedAt,
      cancelAtPeriodEnd: mapped.cancelAtPeriodEnd,
      billingProvider: "stripe",
    },
  });
}
