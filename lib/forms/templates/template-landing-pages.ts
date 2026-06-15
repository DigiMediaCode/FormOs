import { WORKFLOW_TEMPLATES } from "@/lib/forms/templates/vertical-workflow-templates";

export type TemplateLandingPage = {
  routeSlug: string;
  templateSlug: string;
  seoTitle: string;
  seoDescription: string;
  heroTitle: string;
  heroSubtitle: string;
  problemTitle: string;
  problemPoints: string[];
  workflowSteps: string[];
  includes: string[];
  audience: string[];
  faqs: Array<{
    question: string;
    answer: string;
  }>;
};

const COMMON_WORKFLOW_STEPS = [
  "Customer completes the form on mobile or desktop",
  "Uploads and signatures are collected in the same workflow",
  "Staff completes Office Use Only fields after review",
  "FormOS finalizes the submission into a completed PDF",
  "Files and records stay organized for follow-up",
];

const COMMON_FAQS = [
  {
    question: "Can I edit this template?",
    answer:
      "Yes. Templates create normal FormOS forms, so you can edit labels, fields, wording, options, required fields, and internal office fields before publishing.",
  },
  {
    question: "Can customers sign on mobile?",
    answer:
      "Yes. FormOS signature and initials fields are designed for mouse, touch, and phone-screen signing.",
  },
  {
    question: "Can uploaded files go to Google Drive or Dropbox?",
    answer:
      "Yes, when your plan and integration settings allow it. FormOS can route uploaded files to the storage provider selected by the form owner.",
  },
  {
    question: "Is this legal advice?",
    answer:
      "No. These templates are operational starting points. You should review wording and legal suitability for your business and jurisdiction.",
  },
];

export const TEMPLATE_LANDING_PAGES: TemplateLandingPage[] = [
  {
    routeSlug: "vehicle-hire-agreement",
    templateSlug: "vehicle-hire-agreement",
    seoTitle: "Vehicle Hire Agreement Template Online | FormOS",
    seoDescription:
      "Create online vehicle hire agreements with driver details, licence uploads, signatures, office checks, and completed PDFs in FormOS.",
    heroTitle: "Vehicle hire agreements customers can complete on their phone.",
    heroSubtitle:
      "Collect driver details, licence uploads, signatures, office checks, and completed PDFs in one workflow.",
    problemTitle: "Stop chasing licences, signatures, and inspection notes.",
    problemPoints: [
      "Paper rental agreements are easy to misplace.",
      "Licence uploads and signed terms often arrive in separate emails.",
      "Vehicle checks, odometer readings, and bond notes need internal processing.",
      "Completed PDFs usually require manual assembly after the customer leaves.",
    ],
    workflowSteps: COMMON_WORKFLOW_STEPS,
    includes: [
      "Customer and driver identity fields",
      "Licence upload and hire date fields",
      "Additional driver and offence conditional questions",
      "Agreement acknowledgement, initials, and signature",
      "Office fields for vehicle, rego, odometer, bond, inspection, and approval",
    ],
    audience: [
      "vehicle hire companies",
      "car rental operators",
      "truck and van hire businesses",
      "equipment-plus-vehicle rental teams",
    ],
    faqs: COMMON_FAQS,
  },
  {
    routeSlug: "equipment-rental-agreement",
    templateSlug: "equipment-rental-agreement",
    seoTitle: "Equipment Rental Agreement Form with Signature | FormOS",
    seoDescription:
      "Use FormOS to collect equipment rental requests, proof uploads, safety acknowledgements, signatures, and internal approval fields.",
    heroTitle: "Equipment rental agreements with uploads, signatures, and return checks.",
    heroSubtitle:
      "Handle rental requests, delivery logic, proof uploads, safety terms, deposits, and approval status without scattered paperwork.",
    problemTitle: "Rental paperwork should not slow down the counter.",
    problemPoints: [
      "Customers forget proof of ID or business documents.",
      "Delivery instructions and operator requests get missed.",
      "Damage, loss, and late-return acknowledgements need a clear signature trail.",
      "Return condition and deposit notes belong in the same record.",
    ],
    workflowSteps: COMMON_WORKFLOW_STEPS,
    includes: [
      "Individual or business renter details",
      "Equipment request and rental date fields",
      "Pickup/delivery and operator conditional sections",
      "Proof upload, safety acknowledgement, and signature",
      "Office fields for asset ID, condition, deposit, return notes, and approval",
    ],
    audience: [
      "equipment rental shops",
      "tool hire companies",
      "event equipment providers",
      "construction rental operators",
    ],
    faqs: COMMON_FAQS,
  },
  {
    routeSlug: "contractor-job-intake-waiver",
    templateSlug: "contractor-job-intake-waiver",
    seoTitle: "Contractor Job Intake Form with Waiver | FormOS",
    seoDescription:
      "Build contractor job intake workflows with site details, photo uploads, access instructions, waiver consent, and office follow-up fields.",
    heroTitle: "Contractor job intake that captures the details before the site visit.",
    heroSubtitle:
      "Collect job context, photos, urgency, access instructions, consent, and internal quote/status fields in one place.",
    problemTitle: "Fewer missing details before the contractor arrives.",
    problemPoints: [
      "Job descriptions often arrive without photos or access notes.",
      "Urgent work needs extra context before dispatch.",
      "Permission and safety acknowledgements should be captured clearly.",
      "Quotes, risk notes, and follow-up status need internal fields.",
    ],
    workflowSteps: COMMON_WORKFLOW_STEPS,
    includes: [
      "Customer, phone, email, and job address fields",
      "Service type, preferred date/time, and job description",
      "Photo upload, urgent issue, and access conditional fields",
      "Permission, safety acknowledgement, and signature",
      "Office fields for assigned contractor, quote, risk notes, job status, and follow-up",
    ],
    audience: [
      "trade contractors",
      "repair businesses",
      "maintenance teams",
      "installation service providers",
    ],
    faqs: COMMON_FAQS,
  },
  {
    routeSlug: "service-booking-consent-form",
    templateSlug: "service-booking-consent",
    seoTitle: "Service Booking and Consent Form Template | FormOS",
    seoDescription:
      "Create service booking and consent forms with appointment requests, new-client logic, cancellation terms, signatures, and office scheduling fields.",
    heroTitle: "Service booking and consent in one clean customer workflow.",
    heroSubtitle:
      "Capture appointment preferences, special requirements, consent terms, signatures, and internal booking status without a separate paper trail.",
    problemTitle: "Turn appointment requests into complete booking records.",
    problemPoints: [
      "Booking requests often miss new-client background or special requirements.",
      "Consent and cancellation terms need clear acknowledgement.",
      "Staff need internal fields for confirmation, deposits, and booking status.",
      "Completed records should be PDF-ready for the business.",
    ],
    workflowSteps: COMMON_WORKFLOW_STEPS,
    includes: [
      "Client contact and new/returning client fields",
      "Service requested and appointment preference fields",
      "Conditional new-client, other service, and special requirement questions",
      "Consent terms, cancellation acknowledgement, and signature",
      "Office fields for confirmation, staff, deposit/payment status, notes, and booking status",
    ],
    audience: [
      "service providers",
      "clinics and consultants",
      "appointment-based businesses",
      "small operations teams",
    ],
    faqs: COMMON_FAQS,
  },
  {
    routeSlug: "photography-event-booking-agreement",
    templateSlug: "photography-event-booking-agreement",
    seoTitle: "Photography Booking Agreement Template | FormOS",
    seoDescription:
      "Collect photography and event booking details, package selections, reference uploads, portfolio consent, signatures, and internal booking fields.",
    heroTitle: "Photography and event bookings that end in a clean signed agreement.",
    heroSubtitle:
      "Collect event details, package choices, reference uploads, portfolio consent, signatures, and internal photographer/payment notes.",
    problemTitle: "Keep creative details, permissions, and payments together.",
    problemPoints: [
      "Event details and shot lists are often spread across messages.",
      "Privacy and portfolio consent need clear choices.",
      "Reference images should stay attached to the booking.",
      "Deposits, balances, and assigned photographer notes need internal tracking.",
    ],
    workflowSteps: COMMON_WORKFLOW_STEPS,
    includes: [
      "Client, event type, date, time, and location fields",
      "Package selection, guest count, and creative notes",
      "Mood board/reference upload and privacy conditional fields",
      "Portfolio consent, booking terms acknowledgement, and signature",
      "Office fields for photographer, package confirmation, deposit, balance, shot list, and status",
    ],
    audience: [
      "photographers",
      "event creators",
      "wedding suppliers",
      "creative studios",
    ],
    faqs: COMMON_FAQS,
  },
];

export function getTemplateLandingPage(routeSlug: string) {
  const page = TEMPLATE_LANDING_PAGES.find((item) => item.routeSlug === routeSlug);

  if (!page) {
    return null;
  }

  const template = WORKFLOW_TEMPLATES.find(
    (workflowTemplate) => workflowTemplate.slug === page.templateSlug,
  );

  if (!template) {
    return null;
  }

  return {
    ...page,
    template,
  };
}

export function getTemplateLandingPages() {
  return TEMPLATE_LANDING_PAGES.map((page) => getTemplateLandingPage(page.routeSlug)).filter(
    Boolean,
  ) as Array<NonNullable<ReturnType<typeof getTemplateLandingPage>>>;
}
