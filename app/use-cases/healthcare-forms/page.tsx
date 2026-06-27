import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarCheck,
  ClipboardCheck,
  FileSignature,
  FileText,
  ShieldAlert,
  Upload,
} from "lucide-react";
import { PublicAdSection } from "@/components/ads/public-ad-section";
import { PublicFooter } from "@/components/public/public-footer";
import { PublicHeader } from "@/components/public/public-header";
import { getPlatformSettings } from "@/lib/platform/settings";

export const metadata: Metadata = {
  title: "Healthcare Forms for Clinics | FormOS",
  description:
    "Create healthcare administrative workflow forms for GP appointment requests, new patient intake, consent acknowledgements, uploads, signatures, office review, and PDFs.",
  openGraph: {
    title: "Healthcare Forms for Clinics | FormOS",
    description:
      "Healthcare administrative workflow forms for appointment requests, patient intake, consent acknowledgements, uploads, signatures, office review, and PDFs.",
    type: "website",
  },
};

const healthcareTemplates = [
  {
    title: "GP Appointment Request",
    href: "/templates/gp-appointment-request",
    description:
      "Let patients request appointments with preferred date/time, urgency acknowledgement, and staff review fields.",
  },
  {
    title: "New Patient Intake",
    href: "/templates/new-patient-intake",
    description:
      "Collect basic administrative details, emergency contact, optional referral upload, and intake review status.",
  },
  {
    title: "Patient Consent Form",
    href: "/templates/patient-consent-form",
    description:
      "Capture acknowledgement wording, questions or concerns, patient signature, and practitioner review fields.",
  },
];

const healthcareSafetyStatement =
  "FormOS supports administrative workflow forms for healthcare and service businesses. It is not an emergency medical service, electronic medical record system, practice management system, or substitute for professional clinical advice.";

const workflowSections = [
  {
    icon: CalendarCheck,
    title: "GP appointment request workflow",
    points: [
      "Patient contact and date of birth",
      "Preferred appointment date and time",
      "New/existing patient question",
      "Urgency acknowledgement with emergency guidance",
      "Office fields for status, practitioner, notes, and follow-up",
    ],
  },
  {
    icon: FileText,
    title: "New patient intake workflow",
    points: [
      "Basic patient and address details",
      "Emergency contact details",
      "Optional Medicare/private insurance/pharmacy fields",
      "Conditional referral or document upload",
      "Internal file creation and intake review fields",
    ],
  },
  {
    icon: FileSignature,
    title: "Consent / acknowledgement workflow",
    points: [
      "Patient details",
      "Service or procedure name",
      "Acknowledgement statement",
      "Questions or concerns field",
      "Signature and practitioner review fields",
    ],
  },
];

const features = [
  {
    icon: Upload,
    title: "Uploads",
    description:
      "Collect optional referrals or administrative documents and keep upload metadata with the submission.",
  },
  {
    icon: FileSignature,
    title: "Signatures",
    description:
      "Patients can sign acknowledgements on desktop, tablet, or phone.",
  },
  {
    icon: ClipboardCheck,
    title: "Office review",
    description:
      "Office Use Only fields let staff complete appointment status, practitioner review, and internal notes.",
  },
  {
    icon: FileText,
    title: "PDF records",
    description:
      "Generate clean PDF records for administrative workflow follow-up where your plan allows PDF generation.",
  },
];

const faqs = [
  {
    question: "Is FormOS an EMR, EHR, or practice management system?",
    answer:
      "No. FormOS supports administrative workflow forms such as appointment requests, intake forms, consent acknowledgements, uploads, signatures, office review, and PDFs. It is not an electronic medical record system, practice management system, Medicare billing system, or clinical advice tool.",
  },
  {
    question: "Can these templates be customized?",
    answer:
      "Yes. Healthcare templates create normal FormOS forms. Clinics should review field labels, wording, acknowledgements, and internal fields before publishing.",
  },
  {
    question: "Does FormOS provide clinical advice or emergency triage?",
    answer:
      "No. FormOS does not provide clinical advice, diagnosis, treatment, emergency triage, or emergency response. If this is an emergency in Australia, call 000.",
  },
  {
    question: "Can uploaded documents go to Google Drive or Dropbox?",
    answer:
      "Yes, if the owner's plan and integration settings allow storage integrations. FormOS can route uploaded files to the selected storage provider.",
  },
];

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
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

export default async function HealthcareFormsPage() {
  const settings = await getPlatformSettings();
  const trialLabel = settings.trialEnabled
    ? `Start ${settings.trialDays}-day free trial`
    : "Start free trial";

  return (
    <main className="min-h-screen bg-white text-[#071124]">
      <PublicHeader />

      <section className="overflow-hidden border-b border-blue-100 bg-gradient-to-br from-blue-50 via-white to-emerald-50">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
              Healthcare & Clinics
            </p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
              Healthcare forms for clinic admin workflows.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-700">
              FormOS helps clinics collect appointment requests, new patient
              intake details, consent acknowledgements, uploads, signatures,
              office review notes, and PDF-ready administrative records.
            </p>
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
              <p className="font-semibold">
                Healthcare safety note
              </p>
              <p className="mt-1">{healthcareSafetyStatement}</p>
              <p className="mt-1 font-semibold">
                If this is an emergency in Australia, call 000.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                href="/templates/gp-appointment-request"
              >
                Explore healthcare templates
              </Link>
              <Link
                className="rounded-md border border-blue-100 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-blue-200 hover:bg-blue-50"
                href="/pricing"
              >
                {trialLabel}
              </Link>
              <Link
                className="rounded-md border border-blue-100 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-blue-200 hover:bg-blue-50"
                href="/templates"
              >
                View all templates
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-xl shadow-blue-950/10">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                Workflow preview
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950">
                Appointment request to office review
              </h2>
              <div className="mt-5 grid gap-3">
                {[
                  "Patient submits admin details",
                  "Urgency warning appears if needed",
                  "Staff assigns practitioner",
                  "Office notes stay internal",
                  "PDF-ready record is available",
                ].map((item) => (
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

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-16 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionHeading
          eyebrow="Why clinics"
          title="Clinic forms need more than a basic contact form."
          description="Reception and admin teams need structured requests, safe acknowledgements, internal review fields, and records that stay organized."
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            "Appointment requests need preferred dates, contact details, and staff follow-up.",
            "New patient intake should collect admin details before the visit.",
            "Consent acknowledgements need mobile signatures and PDF-ready records.",
            "Office notes and practitioner review fields should stay hidden from public users.",
          ].map((point) => (
            <div
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-700"
              key={point}
            >
              {point}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <SectionHeading
            eyebrow="Templates"
            title="Three healthcare-safe workflows to start from."
            description="Each template is administrative, editable, and designed to avoid unnecessary clinical data collection."
          />
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {healthcareTemplates.map((template) => (
              <Link
                className="flex h-full flex-col rounded-2xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-950/5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
                href={template.href}
                key={template.title}
              >
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                  Healthcare & Clinics
                </span>
                <h3 className="mt-4 text-xl font-semibold text-slate-950">
                  {template.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
                  {template.description}
                </p>
                <span className="mt-5 text-sm font-semibold text-blue-700">
                  View template
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeading
          eyebrow="Workflows"
          title="Administrative workflows for appointment, intake, and acknowledgement."
        />
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {workflowSections.map((section) => (
            <article
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              key={section.title}
            >
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <section.icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-slate-950">
                {section.title}
              </h3>
              <ul className="mt-4 grid gap-2 text-sm leading-6 text-slate-600">
                {section.points.map((point) => (
                  <li className="flex gap-2" key={point}>
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-blue-600" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <PublicAdSection className="pb-12" slot="middle" />

      <section className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <SectionHeading
            eyebrow="Capabilities"
            title="Files, signatures, office review, and PDFs in one flow."
            description="The same FormOS workflow engine also supports service, rental, contractor, booking, contract, and agreement use cases."
          />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <article
                className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-950/5"
                key={feature.title}
              >
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <feature.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-slate-950">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm leading-6 text-amber-950">
          <div className="flex gap-3">
            <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <div>
              <h2 className="text-lg font-semibold text-amber-950">
                Healthcare safety disclaimer
              </h2>
              <p className="mt-2">
                {healthcareSafetyStatement}
              </p>
              <p className="mt-2 font-semibold">
                If this is an emergency in Australia, call 000.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <SectionHeading eyebrow="FAQ" title="Common healthcare workflow questions" />
          <div className="mt-8 grid gap-4">
            {faqs.map((faq) => (
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
            Start with a healthcare admin workflow template.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-blue-50">
            Choose a GP appointment request, new patient intake, or patient
            consent acknowledgement template and customize it for your clinic.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              className="rounded-md bg-white px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
              href="/templates/gp-appointment-request"
            >
              View GP template
            </Link>
            <Link
              className="rounded-md border border-blue-300 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
              href="/pricing"
            >
              {trialLabel}
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
