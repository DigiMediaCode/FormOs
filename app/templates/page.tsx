import type { Metadata } from "next";
import Link from "next/link";
import { PublicAdSection } from "@/components/ads/public-ad-section";
import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";
import { getTemplateLandingPages } from "@/lib/forms/templates/template-landing-pages";
import { getPlatformSettings } from "@/lib/platform/settings";

export const metadata: Metadata = {
  title: "Workflow Templates | FormOS",
  description:
    "Explore FormOS workflow templates for healthcare clinics, rentals, contractors, service bookings, and event agreements with signatures, uploads, office fields, and PDFs.",
  openGraph: {
    title: "Workflow Templates | FormOS",
    description:
      "Start with complete workflow templates for healthcare admin, signed forms, uploads, office processing, and finalized PDFs.",
    type: "website",
  },
};

const categories = [
  "Healthcare & Clinics",
  "Rental & Hire",
  "Trades & Services",
  "Booking & Events",
] as const;

export default async function TemplatesPage() {
  const [settings, pages] = await Promise.all([
    getPlatformSettings(),
    Promise.resolve(getTemplateLandingPages()),
  ]);
  const trialLabel = settings.trialEnabled
    ? `${settings.trialDays}-day free trial`
    : "Create your workflow";

  return (
    <main className="min-h-screen bg-slate-50 text-[#071124]">
      <PublicHeader />
      <section className="border-b border-blue-100 bg-gradient-to-b from-blue-50 via-white to-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
            FormOS Templates
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">
            Workflow templates for businesses that need the job finished.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
            Start from proven vertical workflows with healthcare admin intake,
            customer requests, signatures, uploads, Office Use Only processing,
            and PDF-ready records.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              href="/signup"
            >
              Start {trialLabel}
            </Link>
            <Link
              className="rounded-md border border-blue-100 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-blue-200 hover:bg-blue-50"
              href="/pricing"
            >
              View pricing
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-14">
        {categories.map((category, index) => {
          const categoryPages = pages.filter((page) => page.template.category === category);

          if (categoryPages.length === 0) {
            return null;
          }

          return (
            <div className="grid gap-10" key={category}>
              <div>
                <div className="mb-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                      {category}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                      {category} templates
                    </h2>
                  </div>
                </div>
                <div className="grid gap-5 lg:grid-cols-2">
                  {categoryPages.map((page) => (
                    <article
                      className="flex h-full flex-col rounded-2xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-950/5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
                      key={page.routeSlug}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          {page.template.category}
                        </span>
                        {page.template.featureBadges.slice(0, 3).map((badge) => (
                          <span
                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
                            key={badge}
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                      <h3 className="mt-5 text-xl font-semibold text-slate-950">
                        {page.template.title}
                      </h3>
                      <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
                        {page.template.description}
                      </p>
                      <Link
                        className="mt-5 inline-flex w-fit rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                        href={`/templates/${page.routeSlug}`}
                      >
                        View template
                      </Link>
                    </article>
                  ))}
                </div>
              </div>
              {index === 0 ? <PublicAdSection slot="middle" /> : null}
            </div>
          );
        })}
      </section>
      <PublicFooter />
    </main>
  );
}
