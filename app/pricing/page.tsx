import type { Metadata } from "next";
import { PublicAdSection } from "@/components/ads/public-ad-section";
import { PricingCard } from "@/components/public/pricing-card";
import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";
import { getSessionUserId } from "@/lib/auth/session";
import { getPlatformSettings } from "@/lib/platform/settings";

export const metadata: Metadata = {
  title: "Pricing | FormOS",
  description: "Simple pricing for forms, agreements, and signed workflows.",
};

const plans = [
  {
    name: "Starter",
    price: "$19/month",
    description: "For small businesses starting with online forms.",
    features: [
      "Up to 5 forms",
      "Up to 100 submissions / month",
      "Public form sharing",
      "Signatures & initials",
      "QR code sharing",
      "Basic templates",
      "PDF generation",
    ],
  },
  {
    name: "Pro",
    price: "$49/month",
    description: "For operators collecting files, signatures, and internal details.",
    highlighted: true,
    features: [
      "Up to 25 forms",
      "Up to 1,000 submissions / month",
      "Google Drive integration",
      "Dropbox integration",
      "Office Use Only fields",
      "Completed PDF email delivery",
      "Activity timeline",
      "Priority support",
    ],
  },
  {
    name: "Business",
    price: "$99/month",
    description: "For higher-volume workflows and growing teams.",
    features: [
      "Unlimited forms",
      "Up to 10,000 submissions / month",
      "All Pro features",
      "Advanced branding",
      "Team-ready workflows",
      "Advanced templates",
      "Better support",
    ],
  },
];

const comparisonRows = [
  ["Forms", "5", "25", "Unlimited"],
  ["Submissions / month", "100", "1,000", "10,000"],
  ["Signatures & initials", "Included", "Included", "Included"],
  ["Google Drive / Dropbox", "Not included", "Included", "Included"],
  ["Office Use Only fields", "Not included", "Included", "Included"],
  ["Completed PDF email", "Included", "Included", "Included"],
  ["Activity timeline", "Basic", "Included", "Included"],
];

const faqs = [
  {
    question: "Is billing active yet?",
    answer: "Not yet. These plans are a preview while FormOS prepares subscription packages.",
  },
  {
    question: "Can I use Google Drive or Dropbox?",
    answer: "Yes. Connected storage is included on Pro and Business plans.",
  },
  {
    question: "Can I change plans later?",
    answer: "Plan changes will be available when billing is implemented.",
  },
];

export default async function PricingPage() {
  const [userId, platformSettings] = await Promise.all([
    getSessionUserId(),
    getPlatformSettings(),
  ]);
  const planHref = userId ? "/dashboard/settings/billing" : "/signup";
  const trialLabel = platformSettings.trialEnabled
    ? `${platformSettings.trialDays}-day free trial`
    : undefined;

  return (
    <main className="min-h-screen bg-slate-50">
      <PublicHeader />
      <section className="mx-auto max-w-7xl px-5 py-16 text-center sm:px-6">
        <h1 className="mx-auto max-w-3xl text-5xl font-semibold tracking-tight text-slate-950">
          Simple pricing for forms, agreements, and signed workflows.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600">
          Choose the plan that fits your forms, submissions, storage, and
          completed PDF delivery needs.
        </p>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 pb-16 sm:px-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <PricingCard href={planHref} key={plan.name} trialLabel={trialLabel} {...plan} />
        ))}
      </section>

      <PublicAdSection className="pb-16" slot="middle" />

      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-950">
              <tr>
                <th className="px-5 py-4 font-semibold">Feature</th>
                <th className="px-5 py-4 font-semibold">Starter</th>
                <th className="px-5 py-4 font-semibold">Pro</th>
                <th className="px-5 py-4 font-semibold">Business</th>
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
