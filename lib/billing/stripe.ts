import "server-only";

import { Prisma } from "@prisma/client";
import Stripe from "stripe";
import { getAppUrl } from "@/lib/app-url";
import { createBillingEvent } from "@/lib/billing/events";
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
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
  };
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

  const customerId = await createOrGetStripeCustomer(userId);
  const appUrl = getAppUrl();
  const stripe = getStripeClient();

  try {
    const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
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
      metadata: {
        formosUserId: userId,
        planId: plan.id,
        interval,
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
      cancelAtPeriodEnd: mapped.cancelAtPeriodEnd,
      billingProvider: "stripe",
    },
  });
}
