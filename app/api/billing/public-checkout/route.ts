import { NextRequest, NextResponse } from "next/server";
import { getAppRedirectUrl } from "@/lib/app-url";
import {
  createPublicTrialCheckoutSession,
  type BillingInterval,
} from "@/lib/billing/stripe";

function isBillingInterval(value: string): value is BillingInterval {
  return value === "monthly" || value === "yearly";
}

function safeSlug(value: string | null) {
  const slug = String(value ?? "").trim().toLowerCase();

  return /^[a-z0-9-]+$/.test(slug) ? slug : "";
}

function safeSource(value: string | null) {
  const source = String(value ?? "").trim().toLowerCase();

  return /^[a-z0-9_-]+$/.test(source) ? source : "";
}

function redirectToPricing(message: string) {
  return NextResponse.redirect(
    getAppRedirectUrl(`/pricing?error=${encodeURIComponent(message)}`),
    { status: 303 },
  );
}

export async function GET(request: NextRequest) {
  const planSlug = safeSlug(request.nextUrl.searchParams.get("plan"));
  const templateSlug = safeSlug(request.nextUrl.searchParams.get("template"));
  const source = safeSource(request.nextUrl.searchParams.get("source"));
  const intervalParam = String(
    request.nextUrl.searchParams.get("interval") ?? "monthly",
  ).trim();
  const interval = isBillingInterval(intervalParam) ? intervalParam : "monthly";

  if (!planSlug || planSlug === "free") {
    const params = new URLSearchParams({ plan: "free" });

    if (templateSlug) {
      params.set("template", templateSlug);
    }

    return NextResponse.redirect(getAppRedirectUrl(`/signup?${params.toString()}`), {
      status: 303,
    });
  }

  try {
    const session = await createPublicTrialCheckoutSession({
      planSlug,
      interval,
      templateSlug,
      source: source || "public_pricing",
    });

    if (!session.url) {
      return redirectToPricing("Stripe Checkout did not return a redirect URL.");
    }

    return NextResponse.redirect(session.url, { status: 303 });
  } catch (error) {
    return redirectToPricing(
      error instanceof Error ? error.message : "Unable to start trial checkout.",
    );
  }
}
