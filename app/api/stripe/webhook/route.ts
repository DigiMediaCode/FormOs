import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  getStripeClient,
  syncStripeSubscription,
} from "@/lib/billing/stripe";
import {
  createBillingEvent,
  findBillingEventByStripeEventId,
  markBillingEventFailed,
  markBillingEventProcessed,
} from "@/lib/billing/events";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function getWebhookSecret() {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("Stripe webhook secret is not configured.");
  }

  return webhookSecret;
}

function safeLog(message: string, details?: Record<string, unknown>) {
  console.warn("[formos:stripe-webhook]", message, details ?? {});
}

async function retrieveSubscription(subscriptionId: string) {
  const stripe = getStripeClient();

  return stripe.subscriptions.retrieve(subscriptionId);
}

function subscriptionIdFromInvoice(invoice: Stripe.Invoice) {
  const subscription = (invoice as unknown as { subscription?: string | null }).subscription;

  return typeof subscription === "string" ? subscription : null;
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : null;

  if (!subscriptionId) {
    safeLog("Checkout session completed without subscription id.", {
      sessionId: session.id,
    });
    return;
  }

  const subscription = await retrieveSubscription(subscriptionId);
  await syncStripeSubscription(subscription);
}

async function handleInvoiceStatus(
  invoice: Stripe.Invoice,
  status: "PAST_DUE" | "ACTIVE",
) {
  const subscriptionId = subscriptionIdFromInvoice(invoice);

  if (!subscriptionId) {
    safeLog("Invoice event had no subscription id.", {
      invoiceId: invoice.id,
      status,
    });
    return;
  }

  const subscription = await retrieveSubscription(subscriptionId);
  const synced = await syncStripeSubscription(subscription);

  if (synced && status === "PAST_DUE") {
    await prisma.userSubscription.update({
      where: { userId: synced.userId },
      data: {
        status,
        billingProvider: "stripe",
      },
    });
  }
}

function getEventObjectIds(event: Stripe.Event) {
  const object = event.data.object as unknown as Record<string, unknown>;
  const customer = object.customer;
  const subscription = object.subscription;
  const metadata =
    typeof object.metadata === "object" && object.metadata !== null
      ? (object.metadata as Record<string, unknown>)
      : {};

  return {
    customerId:
      typeof customer === "string"
        ? customer
        : typeof customer === "object" &&
            customer !== null &&
            "id" in customer &&
            typeof (customer as { id?: unknown }).id === "string"
          ? (customer as { id: string }).id
          : null,
    subscriptionId:
      typeof subscription === "string"
        ? subscription
        : typeof object.id === "string" && event.type.startsWith("customer.subscription")
          ? object.id
          : null,
    userId:
      typeof metadata.formosUserId === "string" ? metadata.formosUserId : null,
  };
}

export async function POST(request: NextRequest) {
  const stripe = getStripeClient();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, getWebhookSecret());
  } catch (error) {
    await createBillingEvent({
      eventType: "webhook_signature_failed",
      status: "FAILED",
      message: error instanceof Error ? error.message : "Invalid Stripe webhook signature.",
      processedAt: new Date(),
    });
    return NextResponse.json({ error: "Invalid Stripe webhook signature." }, { status: 400 });
  }

  const existingEvent = await findBillingEventByStripeEventId(event.id);

  if (existingEvent?.status === "PROCESSED") {
    return NextResponse.json({ received: true, duplicate: true });
  }

  const ids = getEventObjectIds(event);
  const billingEvent =
    existingEvent ??
    (await createBillingEvent({
      eventId: event.id,
      eventType: event.type,
      userId: ids.userId,
      customerId: ids.customerId,
      subscriptionId: ids.subscriptionId,
      status: "RECEIVED",
      message: "Stripe webhook received.",
      metadata: {
        livemode: event.livemode,
        apiVersion: event.api_version,
      },
    }));

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncStripeSubscription(event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_failed":
        await handleInvoiceStatus(event.data.object as Stripe.Invoice, "PAST_DUE");
        break;
      case "invoice.payment_succeeded":
        await handleInvoiceStatus(event.data.object as Stripe.Invoice, "ACTIVE");
        break;
      default:
        break;
    }
    if (billingEvent) {
      await markBillingEventProcessed(billingEvent.id, "Stripe webhook processed.", {
        eventType: event.type,
      });
    }
  } catch (error) {
    safeLog("Webhook handling failed safely.", {
      eventType: event.type,
      error: error instanceof Error ? error.message : "Unknown Stripe webhook error",
    });
    if (billingEvent) {
      await markBillingEventFailed(
        billingEvent.id,
        error instanceof Error ? error.message : "Stripe webhook processing failed.",
      );
    }
    await createBillingEvent({
      eventType: "webhook_processing_failed",
      status: "FAILED",
      eventId: null,
      userId: ids.userId,
      customerId: ids.customerId,
      subscriptionId: ids.subscriptionId,
      message: error instanceof Error ? error.message : "Stripe webhook processing failed.",
      metadata: {
        stripeEventId: event.id,
        stripeEventType: event.type,
      },
      processedAt: new Date(),
    });
    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}
