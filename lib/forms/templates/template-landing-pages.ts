import { WORKFLOW_TEMPLATES } from "@/lib/forms/templates/vertical-workflow-templates";
import { TRADES, type TradeConfig } from "@/lib/forms/templates/trade-workflow-templates";

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
  safetyDisclaimer?: string;
  emergencyDisclaimer?: string;
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

const HEALTHCARE_SAFETY_DISCLAIMER =
  "FormOS supports administrative workflow forms for healthcare and service businesses. It is not an emergency medical service, electronic medical record system, practice management system, or substitute for professional clinical advice.";

const AUSTRALIA_EMERGENCY_DISCLAIMER =
  "If this is an emergency in Australia, call 000.";

const HEALTHCARE_FAQS = [
  {
    question: "Is FormOS an EMR or practice management system?",
    answer:
      "No. FormOS supports administrative workflows such as appointment requests, intake forms, consent acknowledgements, uploads, signatures, staff review, and PDFs. It is not an electronic medical record system, practice management system, Medicare billing system, or clinical advice tool.",
  },
  {
    question: "Can I edit the healthcare wording?",
    answer:
      "Yes. Healthcare templates create normal FormOS forms. Templates are starting points and should be reviewed and configured by the healthcare provider before use.",
  },
  {
    question: "Can patients sign on mobile?",
    answer:
      "Yes. Signature fields are designed for touch screens, phones, tablets, and desktop devices.",
  },
  {
    question: "Should patients use these forms for emergencies?",
    answer:
      "No. These templates are for administrative workflows only. If this is an emergency in Australia, call 000.",
  },
];

function buildTradeLandingPage(trade: TradeConfig): TemplateLandingPage {
  const [firstIssue, secondIssue] = trade.issueOptions;
  const tradeLower = trade.trade.toLowerCase();

  return {
    routeSlug: `${trade.key}-job-request`,
    templateSlug: `${trade.key}-job-request`,
    seoTitle: `${trade.trade} Job, Quote & Service Forms | FormOS`,
    seoDescription: `Create online ${tradeLower} forms — job and quote requests, completion sign-off, and service agreements with photo uploads, signatures, and completed PDFs.`,
    heroTitle: `${trade.trade} forms your customers can complete on their phone.`,
    heroSubtitle: `Take ${tradeLower} quote requests, capture job sign-off with signatures and photos, and set up recurring service agreements — all finished as tidy PDFs.`,
    problemTitle: `Stop juggling calls, texts, and paper for every ${trade.professional} job.`,
    problemPoints: [
      `Quote requests for ${firstIssue.toLowerCase()}, ${secondIssue.toLowerCase()}, and more arrive by phone, text, and email and are easy to lose.`,
      "Job photos, addresses, and access details get scattered across messages.",
      "Completed work often needs a signed sign-off before you can invoice.",
      "Recurring maintenance customers are hard to track without a simple agreement.",
    ],
    workflowSteps: COMMON_WORKFLOW_STEPS,
    includes: [
      `${trade.trade} job request & quote form with ${trade.professional} job details and photo uploads`,
      "Urgency logic that flags emergency jobs",
      "Job completion & sign-off form with customer signature",
      "Service & maintenance agreement with schedule, term, and pricing",
      "Office Use Only fields for quotes, scheduling, invoicing, and status",
    ],
    audience: trade.audience,
    faqs: [
      {
        question: `Do I get more than one ${trade.professional} form?`,
        answer:
          "Yes. This workflow includes three ready-to-edit templates: a job request and quote form, a job completion and sign-off form, and a service and maintenance agreement. Create the ones you need from your dashboard.",
      },
      {
        question: "Can customers add photos of the job?",
        answer:
          "Yes. The request and completion forms include optional photo upload fields, so you can quote and document work accurately.",
      },
      ...COMMON_FAQS,
    ],
  };
}

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
  {
    routeSlug: "gp-appointment-request",
    templateSlug: "gp-appointment-request",
    seoTitle: "GP Appointment Request Form Template | FormOS",
    seoDescription:
      "Create a GP appointment request form for clinic administrative workflows with patient contact details, appointment preferences, urgency acknowledgement, and staff review fields.",
    heroTitle: "GP appointment request forms for clinic admin workflows.",
    heroSubtitle:
      "Let patients request appointments online while staff review urgency, assign practitioners, and confirm appointment details inside FormOS.",
    problemTitle: "Appointment requests need structure before staff can respond.",
    problemPoints: [
      "Phone and email requests can miss preferred dates, contact details, or urgency context.",
      "New-patient requests often need a simple way to capture referral source or clinic discovery.",
      "Urgent requests need clear emergency guidance without turning the form into a clinical triage system.",
      "Staff need internal fields for appointment status, assigned practitioner, notes, and follow-up.",
    ],
    workflowSteps: [
      "Patient submits contact details and appointment preferences",
      "Urgency acknowledgement and emergency guidance are shown where needed",
      "Staff reviews the request and assigns a practitioner",
      "Confirmed appointment details and staff notes are saved internally",
      "FormOS keeps a PDF-ready administrative record",
    ],
    includes: [
      "Patient full name, date of birth, phone, and email",
      "Preferred appointment date and time",
      "New/existing patient question with conditional referral source field",
      "Urgent request question with emergency warning text",
      "Office fields for appointment status, practitioner, confirmed date/time, notes, and follow-up",
    ],
    audience: [
      "GP clinics",
      "medical reception teams",
      "allied health practices",
      "small healthcare administration teams",
    ],
    safetyDisclaimer: HEALTHCARE_SAFETY_DISCLAIMER,
    emergencyDisclaimer: AUSTRALIA_EMERGENCY_DISCLAIMER,
    faqs: HEALTHCARE_FAQS,
  },
  {
    routeSlug: "new-patient-intake",
    templateSlug: "new-patient-intake",
    seoTitle: "New Patient Intake Form Template | FormOS",
    seoDescription:
      "Create a new patient intake form for clinic administration with contact details, emergency contact, optional referral upload, privacy acknowledgement, and office review fields.",
    heroTitle: "New patient intake forms that keep admin details organized.",
    heroSubtitle:
      "Collect basic patient details, emergency contact information, optional documents, and internal review notes without building a clinical record system.",
    problemTitle: "New patient admin details should arrive before the appointment.",
    problemPoints: [
      "Front desk teams often chase missing contact, address, and emergency contact details.",
      "Referral documents can arrive separately from the intake record.",
      "Private insurance details and preferred pharmacy information may be optional and conditional.",
      "Staff need a simple way to mark ID checked, referral received, file created, and intake reviewed.",
    ],
    workflowSteps: [
      "Patient completes basic administrative details",
      "Optional referral or document upload appears only when needed",
      "Patient accepts contact and privacy acknowledgements",
      "Staff completes internal intake review fields",
      "FormOS keeps the intake organized for follow-up and PDF records",
    ],
    includes: [
      "Patient contact details and address",
      "Emergency contact name and phone",
      "Optional Medicare, private insurance, and pharmacy fields",
      "Referral/document upload conditional logic",
      "Office fields for file creation, ID check, referral status, reviewer, and notes",
    ],
    audience: [
      "GP clinics",
      "allied health practices",
      "specialist rooms",
      "clinic administration teams",
    ],
    safetyDisclaimer: HEALTHCARE_SAFETY_DISCLAIMER,
    faqs: HEALTHCARE_FAQS,
  },
  {
    routeSlug: "patient-consent-form",
    templateSlug: "patient-consent-procedure-acknowledgement",
    seoTitle: "Patient Consent Form Template | FormOS",
    seoDescription:
      "Create a patient consent acknowledgement form for clinic administrative workflows with service details, acknowledgement text, questions, signature, and practitioner review fields.",
    heroTitle: "Patient consent acknowledgements with signatures and staff review.",
    heroSubtitle:
      "Capture administrative consent acknowledgements, patient questions, signatures, and internal practitioner review fields in one PDF-ready workflow.",
    problemTitle: "Consent acknowledgement records need to be clear and easy to review.",
    problemPoints: [
      "Paper acknowledgement forms can be hard to find when staff need them.",
      "Patients may need a structured place to note questions or concerns.",
      "Signature capture should work on mobile without a separate tool.",
      "Practitioners need internal review fields without exposing office notes publicly.",
    ],
    workflowSteps: [
      "Patient reviews acknowledgement wording",
      "Patient enters questions or concerns where needed",
      "Patient signs on mobile or desktop",
      "Staff/practitioner completes internal review fields",
      "FormOS creates a PDF-ready acknowledgement record",
    ],
    includes: [
      "Patient contact and date of birth fields",
      "Service/procedure name",
      "Consent statement and information acknowledgement",
      "Questions/concerns field and patient signature",
      "Office fields for practitioner review, consent status, practitioner name, and notes",
    ],
    audience: [
      "GP clinics",
      "allied health providers",
      "minor procedure rooms",
      "administrative consent workflows",
    ],
    safetyDisclaimer: HEALTHCARE_SAFETY_DISCLAIMER,
    faqs: HEALTHCARE_FAQS,
  },
  ...TRADES.map(buildTradeLandingPage),
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
