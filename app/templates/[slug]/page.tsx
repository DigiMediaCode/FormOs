import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";
import { getSessionUserId } from "@/lib/auth/session";
import { getAppUrl } from "@/lib/app-url";
import {
  getTemplateLandingPage,
  getTemplateLandingPages,
} from "@/lib/forms/templates/template-landing-pages";
import { getPlatformSettings } from "@/lib/platform/settings";

type TemplateLandingPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return getTemplateLandingPages().map((page) => ({
    slug: page.routeSlug,
  }));
}

export async function generateMetadata({
  params,
}: TemplateLandingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getTemplateLandingPage(slug);

  if (!page) {
    return {
      title: "Template Not Found | FormOS",
    };
  }

  const canonical = `${getAppUrl()}/templates/${page.routeSlug}`;

  return {
    title: page.seoTitle,
    description: page.seoDescription,
    alternates: {
      canonical,
    },
    openGraph: {
      title: page.seoTitle,
      description: page.seoDescription,
      url: canonical,
      type: "website",
    },
  };
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
      {children}
    </span>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
      ) : null}
    </div>
  );
}

export default async function TemplateLandingPage({
  params,
}: TemplateLandingPageProps) {
  const { slug } = await params;
  const page = getTemplateLandingPage(slug);

  if (!page) {
    notFound();
  }

  const [settings, userId] = await Promise.all([
    getPlatformSettings(),
    getSessionUserId(),
  ]);
  const isLoggedIn = Boolean(userId);
  const primaryHref = isLoggedIn
    ? "/dashboard/forms/new"
    : `/signup?template=${encodeURIComponent(page.routeSlug)}`;
  const primaryLabel = isLoggedIn
    ? "Use this template"
    : settings.trialEnabled
      ? `Start ${settings.trialDays}-day free trial`
      : "Create account";
  const trialText = settings.trialEnabled
    ? `Start with a ${settings.trialDays}-day free trial. No need to build from scratch.`
    : "Create your account and start from this workflow template.";

  return (
    <main className="min-h-screen bg-white text-[#071124]">
      <PublicHeader />
      <section className="overflow-hidden border-b border-blue-100 bg-gradient-to-br from-blue-50 via-white to-violet-50">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge>{page.template.category}</Badge>
              {page.template.featureBadges.slice(0, 4).map((badge) => (
                <Badge key={badge}>{badge}</Badge>
              ))}
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
              {page.heroTitle}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
              {page.heroSubtitle}
            </p>
            <p className="mt-4 text-sm font-medium text-blue-700">{trialText}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                href={primaryHref}
              >
                {primaryLabel}
              </Link>
              <Link
                className="rounded-md border border-blue-100 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-blue-200 hover:bg-blue-50"
                href="/pricing"
              >
                View pricing
              </Link>
            </div>
          </div>
          <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-xl shadow-blue-950/10">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                Template preview
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950">
                {page.template.title}
              </h2>
              <div className="mt-5 grid gap-3">
                {page.includes.slice(0, 5).map((item) => (
                  <div
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
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

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-16 lg:grid-cols-[0.9fr_1.1fr]">
        <SectionTitle eyebrow="Problem" title={page.problemTitle} />
        <div className="grid gap-3">
          {page.problemPoints.map((point) => (
            <div
              className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-6 text-slate-700"
              key={point}
            >
              {point}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <SectionTitle
            eyebrow="Workflow"
            title="From customer submission to finished document."
            description="FormOS connects intake, uploads, signatures, staff review, and PDF finalization in one workflow."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {page.workflowSteps.map((step, index) => (
              <article
                className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-950/5"
                key={step}
              >
                <span className="inline-flex size-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <p className="mt-4 text-sm font-medium leading-6 text-slate-800">
                  {step}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-16 lg:grid-cols-2">
        <div>
          <SectionTitle eyebrow="Includes" title="What this template includes" />
          <div className="mt-6 grid gap-3">
            {page.includes.map((item) => (
              <div
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm"
                key={item}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
        <div>
          <SectionTitle eyebrow="For" title="Who this workflow is for" />
          <div className="mt-6 grid gap-3">
            {page.audience.map((item) => (
              <div
                className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium capitalize text-blue-900"
                key={item}
              >
                {item}
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
            <strong>Template disclaimer:</strong> FormOS templates are starting
            points for operational workflows and are not legal advice. Review
            wording for your business, location, and use case before publishing.
          </div>
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <SectionTitle eyebrow="FAQ" title="Common questions" />
          <div className="mt-8 grid gap-4">
            {page.faqs.map((faq) => (
              <article
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                key={faq.question}
              >
                <h3 className="text-base font-semibold text-slate-950">
                  {faq.question}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {faq.answer}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-3xl bg-blue-600 px-6 py-12 text-center text-white shadow-xl shadow-blue-950/20">
          <h2 className="text-3xl font-semibold tracking-tight">
            Turn this template into a complete online workflow today.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-blue-50">
            Build, sign, upload, review, and finalize with FormOS.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              className="rounded-md bg-white px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
              href={primaryHref}
            >
              {primaryLabel}
            </Link>
            <Link
              className="rounded-md border border-blue-300 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
              href="/templates"
            >
              Browse templates
            </Link>
          </div>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}
