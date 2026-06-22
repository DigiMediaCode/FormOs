import type { Metadata } from "next";
import { PublicAdSection } from "@/components/ads/public-ad-section";
import { PricingCard } from "@/components/public/pricing-card";
import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";
import { getSessionUserId } from "@/lib/auth/session";
import { getTemplateLandingPages } from "@/lib/forms/templates/template-landing-pages";
import { getPlatformSettings } from "@/lib/platform/settings";

export const metadata: Metadata = {
  title: "Pricing | FormOS Workflow Plans",
  description:
    "Choose a FormOS plan for signed workflows, file uploads, Office Use Only fields, completed PDFs, storage integrations, and team review.",
};

const plans = [
  {
    name: "Free",
    slug: "free",
    price: "$0/month",
    description: "For testing one simple workflow.",
    trialEligible: false,
    ctaLabel: "Start free",
    features: [
      "1 form",
      "25 submissions / month",
      "Basic fields",
      "QR and embed sharing",
      "FormOS branding and ads",
    ],
  },
  {
    name: "Starter",
    slug: "starter",
    price: "AUD $19/month",
    description: "For small businesses moving away from paper forms.",
    trialEligible: true,
    features: [
      "Up to 5 forms",
      "500 submissions / month",
      "Google Drive",
      "PDF generation",
      "Templates",
      "Ad-free public forms",
    ],
  },
  {
    name: "Pro",
    slug: "pro",
    price: "AUD $45/month",
    description:
      "For businesses that need signatures, uploads, office review, and completed PDFs.",
    highlighted: true,
    trialEligible: true,
    features: [
      "Unlimited forms",
      "2,500 submissions / month",
      "Google Drive + Dropbox",
      "Office Use Only fields",
      "Finalization workflow",
      "All field types",
      "Conditional logic",
      "API access",
      "Custom branding",
    ],
  },
  {
    name: "Business",
    slug: "business",
    price: "AUD $89/month",
    description: "For teams managing higher-volume form workflows.",
    trialEligible: true,
    features: [
      "High-volume submissions",
      "3-5 staff seats",
      "All integrations",
      "Priority support",
      "Business branding",
      "Higher workflow quotas",
    ],
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    price: "From AUD $199/month",
    description: "For custom workflows and white-label requirements.",
    trialEligible: false,
    ctaLabel: "Contact us",
    href: "/contact",
    features: [
      "Custom limits",
      "White-label/custom branding",
      "Dedicated support",
      "Custom setup",
      "Custom workflow guidance",
    ],
  },
];

const comparisonRows = [
  ["Forms", "1", "5", "Unlimited", "Unlimited", "Custom"],
  ["Submissions / month", "25", "500", "2,500", "High volume", "Custom"],
  ["Templates", "Not included", "Included", "Included", "Included", "Custom"],
  ["Google Drive / Dropbox", "Not included", "Drive", "Drive + Dropbox", "All integrations", "Custom"],
  ["Office Use Only fields", "Not included", "Not included", "Included", "Included", "Custom"],
  ["Completed PDFs", "Not included", "Included", "Included", "Included", "Custom"],
  ["Team/staff", "Not included", "Not included", "Not included", "3-5 seats", "Custom"],
];

const faqs = [
  {
    question: "Can I try a paid plan before paying?",
    answer:
      "Yes. When trials are enabled, paid plans show the current free-trial length from the platform settings.",
  },
  {
    question: "What happens if my trial ends?",
    answer:
      "Your existing forms and submissions are not deleted. Premium actions become limited according to your effective plan until you subscribe.",
  },
  {
    question: "Can I use FormOS on WordPress or Shopify?",
    answer:
      "Yes. FormOS has embed support plus WordPress and Shopify integrations for placing workflows on existing sites.",
  },
];

export default async function PricingPage() {
  const [userId, platformSettings] = await Promise.all([
    getSessionUserId(),
    getPlatformSettings(),
  ]);
  const planHref = userId ? "/dashboard/settings/billing" : "/signup";
  const paidPlanHref = (slug: string) =>
    userId
      ? `/api/billing/start-trial?plan=${encodeURIComponent(slug)}&interval=monthly`
      : `/signup?plan=${encodeURIComponent(slug)}`;
  const trialLabel = platformSettings.trialEnabled
    ? `${platformSettings.trialDays}-day free trial`
    : undefined;
  const templatePages = getTemplateLandingPages();

  return (
    <main className="min-h-screen bg-slate-50">
      <PublicHeader />
      <section className="mx-auto max-w-7xl px-5 py-16 text-center sm:px-6">
        <h1 className="mx-auto max-w-3xl text-5xl font-semibold tracking-tight text-slate-950">
          Pricing for workflows that collect, sign, file, and finish.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600">
          Start free for one simple workflow, then upgrade when you need
          templates, uploads, office review, completed PDFs, integrations, or
          staff access.
        </p>
        {trialLabel ? (
          <p className="mt-5 text-sm font-semibold text-blue-700">
            Try any paid plan free for {platformSettings.trialDays} days.
          </p>
        ) : null}
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 pb-16 sm:px-6 lg:grid-cols-5">
        {plans.map((plan) => (
          <PricingCard
            href={
              plan.href ??
              (plan.trialEligible ? paidPlanHref(plan.slug) : planHref)
            }
            key={plan.name}
            trialLabel={plan.trialEligible ? trialLabel : undefined}
            {...plan}
          />
        ))}
      </section>

      <PublicAdSection className="pb-16" slot="middle" />

      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-6">
        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                Workflow Templates
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                Start with a vertical workflow, then choose the plan that fits.
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                FormOS templates show the full workflow: customer details,
                uploads, signatures, office review, and completed PDFs.
              </p>
            </div>
            <a
              className="inline-flex w-fit rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              href="/templates"
            >
              Browse templates
            </a>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            {templatePages.map((page) => (
              <a
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50"
                href={`/templates/${page.routeSlug}`}
                key={page.routeSlug}
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  {page.template.category}
                </span>
                <span className="mt-2 block text-sm font-semibold leading-5 text-slate-950">
                  {page.template.title}
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-950">
              <tr>
                <th className="px-5 py-4 font-semibold">Feature</th>
                <th className="px-5 py-4 font-semibold">Free</th>
                <th className="px-5 py-4 font-semibold">Starter</th>
                <th className="px-5 py-4 font-semibold">Pro</th>
                <th className="px-5 py-4 font-semibold">Business</th>
                <th className="px-5 py-4 font-semibold">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {comparisonRows.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell) => (
                    <td className="px-5 py-4" key={cell}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 pb-20 sm:px-6">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
          Frequently asked questions
        </h2>
        <div className="mt-8 grid gap-4">
          {faqs.map((faq) => (
            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" key={faq.question}>
              <h3 className="text-base font-semibold text-slate-950">{faq.question}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
