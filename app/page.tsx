import Link from "next/link";
import { PackageCarousel } from "@/components/public/package-carousel";
import { PublicFooter } from "@/components/public/public-footer";
import { PlatformBrand } from "@/components/ui/platform-brand";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  DEFAULT_PLAN_DEFINITIONS,
  featureLabels,
  limitLabel,
  normalizePlanLimits,
} from "@/lib/plans/limits";
import { getAppUrl } from "@/lib/app-url";
import { getPlatformSettings } from "@/lib/platform/settings";
import { prisma } from "@/lib/prisma";

const features = [
  {
    title: "Form Builder",
    description: "Create clean forms for intake, agreements, bookings, and approvals.",
  },
  {
    title: "eSignatures and Initials",
    description: "Collect signatures and initials directly inside public forms.",
  },
  {
    title: "File Uploads",
    description: "Send uploaded files to Google Drive or Dropbox without storing them in FormOS.",
  },
  {
    title: "Office Use Only Fields",
    description: "Let staff complete internal details after the public submission arrives.",
  },
  {
    title: "Completed PDF Delivery",
    description: "Finalize submissions and email completed PDFs to owners and submitters.",
  },
  {
    title: "QR Code Form Sharing",
    description: "Share public forms with links or downloadable QR codes.",
  },
  {
    title: "Activity Timeline",
    description: "Track key submission actions with a simple owner-visible timeline.",
  },
  {
    title: "Templates",
    description: "Start quickly with ready-to-edit workflow templates.",
  },
];

const useCases = [
  "Vehicle hire agreements",
  "Client intake forms",
  "Consent forms",
  "Service agreements",
  "Onboarding forms",
  "Document collection forms",
];

const steps = [
  "Create your form",
  "Share link or QR code",
  "Collect signatures and documents",
  "Complete office fields and send PDF",
];

type LandingPlan = {
  id: string;
  name: string;
  description: string | null;
  priceMonthly: unknown;
  priceYearly: unknown;
  currency: string;
  slug: string;
  limits: unknown;
};

function formatMoney(value: unknown, currency: string) {
  if (value === null || value === undefined) {
    return "Contact us";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "Contact us";
  }

  if (amount === 0) {
    return "Free";
  }

  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

function PlanCheck() {
  return (
    <svg
      aria-hidden="true"
      className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.5"
      viewBox="0 0 24 24"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function safeAppUrl() {
  try {
    return getAppUrl();
  } catch {
    return "https://formos.com.au";
  }
}

function defaultLandingPlans(): LandingPlan[] {
  return DEFAULT_PLAN_DEFINITIONS.filter((plan) => plan.isActive && plan.isPublic).map(
    (plan) => ({
      id: plan.slug,
      name: plan.name,
      description: plan.description,
      priceMonthly: plan.priceMonthly,
      priceYearly: plan.priceYearly,
      currency: plan.currency,
      slug: plan.slug,
      limits: plan.limits,
    }),
  );
}

async function getLandingPlans() {
  const subscriptionPlanDelegate = (
    prisma as unknown as {
      subscriptionPlan?: {
        findMany: (args: unknown) => Promise<LandingPlan[]>;
      };
    }
  ).subscriptionPlan;

  if (!subscriptionPlanDelegate?.findMany) {
    return defaultLandingPlans();
  }

  try {
    const plans = await subscriptionPlanDelegate.findMany({
      where: {
        isActive: true,
        isPublic: true,
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        description: true,
        priceMonthly: true,
        priceYearly: true,
        currency: true,
        slug: true,
        limits: true,
      },
    });

    return plans.length > 0 ? plans : defaultLandingPlans();
  } catch (error) {
    console.warn("[formos:landing] Could not load subscription plans.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });

    return defaultLandingPlans();
  }
}

export default async function HomePage() {
  const [user, settings, plans] = await Promise.all([
    getCurrentUser(),
    getPlatformSettings(),
    getLandingPlans(),
  ]);
  const packageHref = user ? "/dashboard/settings/billing" : "/signup";
  const appUrl = safeAppUrl();
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: settings.siteName,
        url: appUrl,
      },
      {
        "@type": "SoftwareApplication",
        name: settings.siteName,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: appUrl,
        description:
          "FormOS is an online form builder for forms, agreements, signatures, file uploads, office-use workflows, completed PDFs, and submission automation.",
        offers: plans.map((plan) => ({
          "@type": "Offer",
          name: plan.name,
          price: Number(plan.priceMonthly) || 0,
          priceCurrency: plan.currency,
          url: `${appUrl}/pricing`,
        })),
      },
    ],
  };

  return (
    <main className="min-h-screen bg-white text-[#071124]">
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        type="application/ld+json"
      />
      <header className="sticky top-0 z-20 border-b border-blue-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <PlatformBrand
            href="/"
            imageClassName="h-auto max-w-[120px] object-contain"
            textClassName="text-xl font-semibold text-[#071124]"
          />
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a className="hover:text-blue-600" href="#features">
              Features
            </a>
            <a className="hover:text-blue-600" href="#use-cases">
              Use Cases
            </a>
            <a className="hover:text-blue-600" href="#how-it-works">
              How It Works
            </a>
            <a className="hover:text-blue-600" href="#packages">
              Packages
            </a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Link
                className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
                href="/dashboard"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  className="hidden rounded-md border border-blue-100 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:border-blue-200 hover:bg-blue-50 sm:inline-flex"
                  href="/login"
                >
                  Login
                </Link>
                <Link
                  className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
                  href="/signup"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-blue-100 bg-slate-50">
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-blue-100/90 via-violet-100/40 to-transparent" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-28">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              {settings.siteName}
            </p>
            <h1 className="mt-5 max-w-4xl text-5xl font-semibold tracking-tight text-[#071124] sm:text-6xl">
              Build forms, agreements, and signed workflows in minutes.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">
              FormOS helps businesses create online forms, collect signatures,
              receive file uploads, complete office-use fields, and send finished
              PDFs automatically.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className="rounded-md bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                href="/signup"
              >
                Get Started Free
              </Link>
              <Link
                className="rounded-md border border-blue-100 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-800 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
                href="/login"
              >
                Login
              </Link>
            </div>
            <p className="mt-5 text-sm font-medium text-slate-600">
              No code required. Works with Google Drive and Dropbox.
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-xl shadow-blue-950/10">
            <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-slate-50 to-blue-50/50 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#071124]">
                    Vehicle Hire Agreement
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Published form</p>
                </div>
                <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800">
                  Live
                </span>
              </div>
              <div className="mt-5 grid gap-3">
                {["Driver details", "ID uploads", "Signature", "Office fields", "Completed PDF"].map((item) => (
                  <div
                    className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
                    key={item}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20" id="features">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Features
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#071124]">
            Everything needed for signed submission workflows.
          </h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <article
              className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-950/5 transition hover:border-blue-200 hover:shadow-md"
              key={feature.title}
            >
              <h3 className="text-base font-semibold text-[#071124]">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-b from-slate-50 to-blue-50/50" id="use-cases">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Use Cases
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#071124]">
              Practical forms for real business operations.
            </h2>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {useCases.map((useCase) => (
              <div
                className="rounded-xl border border-blue-100 bg-white px-5 py-4 text-sm font-medium text-slate-800 shadow-sm shadow-blue-950/5"
                key={useCase}
              >
                {useCase}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20" id="how-it-works">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            How It Works
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#071124]">
            From draft to completed PDF.
          </h2>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-4">
          {steps.map((step, index) => (
            <article
              className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-950/5"
              key={step}
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-sm font-semibold text-white">
                {index + 1}
              </span>
              <h3 className="mt-4 text-base font-semibold text-[#071124]">
                {step}
              </h3>
            </article>
          ))}
        </div>
      </section>

      {plans.length > 0 ? (
        <section className="mx-auto max-w-7xl px-6 py-20" id="packages">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Packages
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#071124]">
              Choose the plan that fits your workflow.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Packages are managed dynamically from FormOS plans, so your public
              pricing reflects the active plans configured by Super Admin.
            </p>
          </div>
          <PackageCarousel>
            {plans.map((plan) => {
              const limits = normalizePlanLimits(plan.limits);
              const includedFeatures = featureLabels(limits)
                .filter((feature) => feature.allowed)
                .slice(0, 4);
              const isHighlighted = plan.slug === "pro";

              return (
                <article
                  className={`flex min-w-[min(82vw,22rem)] snap-start flex-col rounded-2xl border bg-white p-6 shadow-sm shadow-blue-950/5 lg:min-w-[22rem] ${
                    isHighlighted
                      ? "border-blue-300 ring-4 ring-blue-100"
                      : "border-blue-100"
                  }`}
                  data-package-card
                  key={plan.id}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-[#071124]">
                        {plan.name}
                      </h3>
                      <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">
                        {plan.description ?? "Flexible FormOS package."}
                      </p>
                    </div>
                    {isHighlighted ? (
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        Popular
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-6">
                    <p className="text-4xl font-semibold tracking-tight text-[#071124]">
                      {formatMoney(plan.priceMonthly, plan.currency)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Monthly package
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-700">
                      Yearly: {formatMoney(plan.priceYearly, plan.currency)}
                    </p>
                  </div>
                  <ul className="mt-6 grid gap-3 text-sm text-slate-700">
                    <li className="flex gap-2">
                      <PlanCheck />
                      <span>{limitLabel(limits.maxForms)} forms</span>
                    </li>
                    <li className="flex gap-2">
                      <PlanCheck />
                      <span>
                        {limitLabel(limits.maxMonthlySubmissions)} submissions / month
                      </span>
                    </li>
                    {includedFeatures.map((feature) => (
                      <li className="flex gap-2" key={feature.label}>
                        <PlanCheck />
                        <span>{feature.label}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    className={`mt-6 inline-flex w-full justify-center rounded-md px-4 py-2.5 text-sm font-semibold transition ${
                      isHighlighted
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "border border-blue-100 bg-white text-slate-800 hover:border-blue-200 hover:bg-blue-50"
                    }`}
                    href={packageHref}
                  >
                    {user ? "Manage Package" : "Get Started"}
                  </Link>
                </article>
              );
            })}
          </PackageCarousel>
          <div className="mt-6 text-center">
            <Link
              className="text-sm font-semibold text-blue-700 hover:text-blue-800"
              href="/pricing"
            >
              View full pricing details
            </Link>
          </div>
        </section>
      ) : null}

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-5xl rounded-2xl bg-gradient-to-br from-blue-600 via-blue-600 to-violet-700 px-6 py-14 text-center shadow-xl shadow-blue-950/20">
          <h2 className="text-3xl font-semibold tracking-tight text-white">
            Ready to create your first form?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-blue-50">
            Start with a blank form or use a template, then share a public link
            or QR code when you are ready.
          </p>
          <Link
            className="mt-8 inline-flex rounded-md bg-white px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            href="/signup"
          >
            Create Free Account
          </Link>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
