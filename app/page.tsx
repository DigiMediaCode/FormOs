import Link from "next/link";
import { PlatformBrand } from "@/components/ui/platform-brand";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPlatformSettings } from "@/lib/platform/settings";

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

export default async function HomePage() {
  const [user, settings] = await Promise.all([
    getCurrentUser(),
    getPlatformSettings(),
  ]);

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <PlatformBrand
            href="/"
            imageClassName="h-auto max-w-[120px] object-contain"
            textClassName="text-xl font-semibold text-slate-950"
          />
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-700 md:flex">
            <a className="hover:text-slate-950" href="#features">
              Features
            </a>
            <a className="hover:text-slate-950" href="#use-cases">
              Use Cases
            </a>
            <a className="hover:text-slate-950" href="#how-it-works">
              How It Works
            </a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Link
                className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                href="/dashboard"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  className="hidden rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50 sm:inline-flex"
                  href="/login"
                >
                  Login
                </Link>
                <Link
                  className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                  href="/signup"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-slate-200 bg-slate-50">
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-teal-100/70 to-transparent" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-28">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
              {settings.siteName}
            </p>
            <h1 className="mt-5 max-w-4xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
              Build forms, agreements, and signed workflows in minutes.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">
              FormOS helps businesses create online forms, collect signatures,
              receive file uploads, complete office-use fields, and send finished
              PDFs automatically.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className="rounded-md bg-teal-700 px-5 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
                href="/signup"
              >
                Get Started Free
              </Link>
              <Link
                className="rounded-md border border-slate-300 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
                href="/login"
              >
                Login
              </Link>
            </div>
            <p className="mt-5 text-sm font-medium text-slate-600">
              No code required. Works with Google Drive and Dropbox.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
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
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            Features
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            Everything needed for signed submission workflows.
          </h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <article
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              key={feature.title}
            >
              <h3 className="text-base font-semibold text-slate-950">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-slate-50" id="use-cases">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
              Use Cases
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Practical forms for real business operations.
            </h2>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {useCases.map((useCase) => (
              <div
                className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-800 shadow-sm"
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
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            How It Works
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            From draft to completed PDF.
          </h2>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-4">
          {steps.map((step, index) => (
            <article
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              key={step}
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-teal-700 text-sm font-semibold text-white">
                {index + 1}
              </span>
              <h3 className="mt-4 text-base font-semibold text-slate-950">
                {step}
              </h3>
            </article>
          ))}
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-5xl rounded-2xl bg-slate-950 px-6 py-14 text-center shadow-xl">
          <h2 className="text-3xl font-semibold tracking-tight text-white">
            Ready to create your first form?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-300">
            Start with a blank form or use a template, then share a public link
            or QR code when you are ready.
          </p>
          <Link
            className="mt-8 inline-flex rounded-md bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            href="/signup"
          >
            Create Free Account
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <PlatformBrand
              href="/"
              imageClassName="h-auto max-w-[110px] object-contain"
              textClassName="text-lg font-semibold text-slate-950"
            />
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
              Create online forms, agreements, signatures, file uploads, and
              completed PDFs with {settings.siteName}.
            </p>
            <p className="mt-3 text-xs text-slate-500">
              &copy; {new Date().getFullYear()} {settings.siteName}. All rights reserved.
            </p>
          </div>
          <div className="flex gap-4 text-sm font-medium text-slate-700">
            <Link className="hover:text-slate-950" href="/login">
              Login
            </Link>
            <Link className="hover:text-slate-950" href="/signup">
              Signup
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
