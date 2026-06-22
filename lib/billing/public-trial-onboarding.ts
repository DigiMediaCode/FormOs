import "server-only";

import { AuthTokenType } from "@prisma/client";
import Stripe from "stripe";
import {
  getStripeClient,
  syncStripeSubscription,
} from "@/lib/billing/stripe";
import { createBillingEvent } from "@/lib/billing/events";
import { prisma } from "@/lib/prisma";
import { createAuthToken } from "@/lib/auth/tokens";

export type PublicTrialCheckoutResult =
  | {
      status: "complete_signup";
      email: string;
      planName: string;
      rawToken: string;
    }
  | {
      status: "existing_user";
      email: string;
      planName: string;
    }
  | {
      status: "trial_ineligible";
      email: string;
      planName: string;
    }
  | {
      status: "ready";
      planName: string;
      templateSlug: string | null;
    };

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function splitName(name: string | null | undefined) {
  const trimmed = String(name ?? "").trim();

  if (!trimmed) {
    return {
      name: null,
      firstName: null,
      lastName: null,
    };
  }

  const [firstName, ...rest] = trimmed.split(/\s+/);

  return {
    name: trimmed,
    firstName: firstName || null,
    lastName: rest.join(" ") || null,
  };
}

function getStripeId(value: string | Stripe.Customer | Stripe.Subscription | null) {
  return typeof value === "string" ? value : value?.id ?? null;
}

function customerEmail(session: Stripe.Checkout.Session) {
  const expandedCustomer =
    typeof session.customer === "object" && session.customer !== null
      ? session.customer
      : null;
  const expandedEmail =
    expandedCustomer && "email" in expandedCustomer
      ? expandedCustomer.email
      : null;

  return (
    session.customer_details?.email ??
    expandedEmail ??
    (typeof session.customer_email === "string" ? session.customer_email : null)
  );
}

function customerName(session: Stripe.Checkout.Session) {
  const expandedCustomer =
    typeof session.customer === "object" && session.customer !== null
      ? session.customer
      : null;
  const expandedName =
    expandedCustomer && "name" in expandedCustomer ? expandedCustomer.name : null;

  return session.customer_details?.name ?? expandedName ?? null;
}

function metadataString(metadata: Stripe.Metadata | null | undefined, key: string) {
  const value = metadata?.[key];

  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isExistingPaidStatus(status: string | null | undefined) {
  return ["ACTIVE", "TRIALING", "PAST_DUE", "INCOMPLETE"].includes(
    status?.toUpperCase() ?? "",
  );
}

function metadataForSubscription(input: {
  checkoutSessionId: string;
  planId: string | null;
  planSlug: string | null;
  source: string | null;
  templateSlug: string | null;
}) {
  const metadata: Record<string, string> = {
    checkoutSessionId: input.checkoutSessionId,
  };

  if (input.source) {
    metadata.publicTrialSource = input.source;
  }

  if (input.planId) {
    metadata.planId = input.planId;
  }

  if (input.planSlug) {
    metadata.planSlug = input.planSlug;
  }

  if (input.templateSlug) {
    metadata.templateSlug = input.templateSlug;
  }

  return metadata;
}

export async function completePublicTrialCheckout(input: {
  sessionId: string;
  currentUserId?: string | null;
}): Promise<PublicTrialCheckoutResult> {
  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(input.sessionId, {
    expand: ["customer", "subscription"],
  });

  if (session.mode !== "subscription" || session.status !== "complete") {
    throw new Error("Stripe Checkout is not complete.");
  }

  const stripeSubscriptionId = getStripeId(
    session.subscription as string | Stripe.Subscription | null,
  );

  if (!stripeSubscriptionId) {
    throw new Error("Stripe Checkout did not include a subscription.");
  }

  const email = customerEmail(session);

  if (!email) {
    throw new Error("Stripe Checkout did not return a customer email address.");
  }

  const normalizedEmail = normalizeEmail(email);
  const planId = metadataString(session.metadata, "planId");
  const planSlug = metadataString(session.metadata, "planSlug");
  const source = metadataString(session.metadata, "source");
  const templateSlug = metadataString(session.metadata, "templateSlug");
  const plan = planId
    ? await prisma.subscriptionPlan.findUnique({
        where: { id: planId },
        select: {
          id: true,
          name: true,
          slug: true,
        },
      })
    : null;
  const planName = plan?.name ?? metadataString(session.metadata, "planName") ?? "paid plan";
  const nameParts = splitName(customerName(session));
  let user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
      emailVerifiedAt: true,
      subscription: {
        select: {
          status: true,
          trialUsedAt: true,
        },
      },
    },
  });
  const trialIneligible =
    Boolean(user?.subscription?.trialUsedAt) ||
    isExistingPaidStatus(user?.subscription?.status);

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: nameParts.name,
        firstName: nameParts.firstName,
        lastName: nameParts.lastName,
        emailVerifiedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        emailVerifiedAt: true,
        subscription: {
          select: {
            status: true,
            trialUsedAt: true,
          },
        },
      },
    });
  } else if (!user.emailVerifiedAt) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        name: user.name ?? nameParts.name,
        firstName: nameParts.firstName ?? undefined,
        lastName: nameParts.lastName ?? undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        emailVerifiedAt: true,
        subscription: {
          select: {
            status: true,
            trialUsedAt: true,
          },
        },
      },
    });
  }

  const stripeCustomerId = getStripeId(session.customer as string | Stripe.Customer | null);

  if (stripeCustomerId) {
    await stripe.customers.update(stripeCustomerId, {
      metadata: {
        formosUserId: user.id,
        email: user.email,
      },
    });
  }

  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
    metadata: {
      ...subscription.metadata,
      formosUserId: user.id,
      planId: plan?.id ?? planId ?? "",
      planSlug: plan?.slug ?? planSlug ?? "",
      source: source ?? "public_pricing",
      templateSlug: templateSlug ?? "",
    },
  });

  if (trialIneligible) {
    const canceledSubscription = await stripe.subscriptions.cancel(
      updatedSubscription.id,
    );

    await syncStripeSubscription(canceledSubscription);
    await createBillingEvent({
      eventType: "public_trial_checkout_duplicate_blocked",
      userId: user.id,
      customerId: stripeCustomerId,
      subscriptionId: canceledSubscription.id,
      status: "PROCESSED",
      message: "Public trial Checkout was canceled because this user is not trial eligible.",
      metadata: {
        checkoutSessionId: session.id,
        planId: plan?.id ?? planId,
        planSlug: plan?.slug ?? planSlug,
        source,
        templateSlug,
      },
      processedAt: new Date(),
    });

    return {
      status: "trial_ineligible",
      email: user.email,
      planName,
    };
  }

  const synced = await syncStripeSubscription(updatedSubscription);

  if (synced) {
    await prisma.userSubscription.update({
      where: { userId: synced.userId },
      data: {
        metadata: metadataForSubscription({
          checkoutSessionId: session.id,
          planId: plan?.id ?? planId,
          planSlug: plan?.slug ?? planSlug,
          source,
          templateSlug,
        }),
      },
    });
  }

  await createBillingEvent({
    eventType: "public_trial_checkout_reconciled",
    userId: user.id,
    customerId: stripeCustomerId,
    subscriptionId: updatedSubscription.id,
    status: "PROCESSED",
    message: "Public trial Checkout session reconciled to FormOS user.",
    metadata: {
      checkoutSessionId: session.id,
      planId: plan?.id ?? planId,
      planSlug: plan?.slug ?? planSlug,
      source,
      templateSlug,
    },
    processedAt: new Date(),
  });

  if (input.currentUserId === user.id && user.passwordHash) {
    return {
      status: "ready",
      planName,
      templateSlug,
    };
  }

  if (user.passwordHash) {
    return {
      status: "existing_user",
      email: user.email,
      planName,
    };
  }

  const token = await createAuthToken({
    email: user.email,
    type: AuthTokenType.PASSWORD_RESET,
    userId: user.id,
  });

  return {
    status: "complete_signup",
    email: user.email,
    planName,
    rawToken: token.rawToken,
  };
}
