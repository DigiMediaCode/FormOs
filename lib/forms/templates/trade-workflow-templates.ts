import { FormMode, FormStatus } from "@prisma/client";
import type { FormBuilderField } from "@/lib/forms/fields";
import {
  condition,
  conditionalHtml,
  createTemplateFields,
  html,
  input,
  legalNotice,
  section,
} from "@/lib/forms/templates/template-fields";
import type { WorkflowTemplateDefinition } from "@/lib/forms/templates/vertical-workflow-templates";

/**
 * Config-driven "Trades & Services" templates.
 *
 * Each trade in `TRADES` is expanded into three complete workflows — Job Request
 * & Quote, Job Completion & Sign-off, and Service & Maintenance Agreement — by
 * the shared builders below. Adding a new trade is a single config entry; the
 * form structure, plan gating, and builder flow are all inherited.
 */

export type TradeConfig = {
  /** Slug base, e.g. "plumbing" → "plumbing-job-request". */
  key: string;
  /** Display trade name, e.g. "Plumbing". */
  trade: string;
  /** The person doing the work, e.g. "plumber" (lower-case, used mid-sentence). */
  professional: string;
  /** Label for the main issue/service selector on the request form. */
  issueLabel: string;
  /** Trade-specific issue/service options for the request form. */
  issueOptions: string[];
  /** Recurring services offered under a maintenance agreement. */
  serviceScopeOptions: string[];
  /** Upload label on the request form. */
  requestUploadLabel: string;
  /** Upload label on the completion form. */
  completionUploadLabel: string;
  /** Compliance/licensing note shown at the top of forms. */
  complianceNote: string;
  /** Who the template is for (used by SEO landing pages). */
  audience: string[];
};

const TRADE_WORKFLOW_REQUIREMENTS = {
  allowTemplates: true,
  allowOfficeUseFields: true,
  allowConditionalLogic: true,
  allowPdfGeneration: true,
} satisfies WorkflowTemplateDefinition["requiredCapabilities"];

const EMERGENCY_SAFETY_NOTE =
  "For urgent safety risks such as gas leaks, electrical hazards, flooding, or fire, call 000 immediately. This request form is not monitored around the clock.";

const CONTACT_TIME_OPTIONS = ["Morning", "Afternoon", "Evening", "Anytime"];

const PROPERTY_TYPE_OPTIONS = [
  "Residential",
  "Commercial",
  "Strata / Body corporate",
  "Real estate / Rental",
];

const URGENCY_OPTIONS = [
  "Emergency (same day)",
  "As soon as possible",
  "Within the next week",
  "Flexible / just after a quote",
];

const SERVICE_FREQUENCY_OPTIONS = [
  "Weekly",
  "Fortnightly",
  "Monthly",
  "Quarterly",
  "Twice a year",
  "Annually",
  "As required",
];

export const TRADES: TradeConfig[] = [
  {
    key: "plumbing",
    trade: "Plumbing",
    professional: "plumber",
    issueLabel: "What do you need help with?",
    issueOptions: [
      "Blocked drain",
      "Burst or leaking pipe",
      "Hot water system",
      "Tap, toilet or cistern",
      "Leak detection",
      "Gas fitting",
      "Bathroom / kitchen renovation",
      "New installation",
      "Other",
    ],
    serviceScopeOptions: [
      "Drain cleaning",
      "Hot water servicing",
      "Leak inspections",
      "Backflow testing",
      "Gas appliance checks",
      "General maintenance",
    ],
    requestUploadLabel: "Photos of the issue",
    completionUploadLabel: "Before / after photos",
    complianceNote:
      "Work is carried out by licensed plumbers and gasfitters in line with local requirements.",
    audience: [
      "plumbing businesses",
      "emergency plumbers",
      "gas fitters",
      "bathroom renovators",
    ],
  },
  {
    key: "electrical",
    trade: "Electrical",
    professional: "electrician",
    issueLabel: "What do you need help with?",
    issueOptions: [
      "Switchboard or fuse box",
      "Power points / outlets",
      "Lighting",
      "Safety switch / RCD",
      "Wiring fault",
      "Ceiling fan",
      "EV charger",
      "Smoke alarms",
      "Rewire / new circuit",
      "Other",
    ],
    serviceScopeOptions: [
      "Safety inspections",
      "Switchboard checks",
      "Smoke alarm testing",
      "Emergency & exit lighting",
      "Test and tag",
      "General maintenance",
    ],
    requestUploadLabel: "Photos of the issue or area",
    completionUploadLabel: "Before / after photos",
    complianceNote:
      "Electrical work is carried out by licensed electricians in line with local safety standards.",
    audience: [
      "electricians",
      "electrical contractors",
      "emergency electricians",
      "solar & EV installers",
    ],
  },
  {
    key: "air-conditioning",
    trade: "Air Conditioning",
    professional: "technician",
    issueLabel: "What do you need help with?",
    issueOptions: [
      "Not cooling / heating",
      "New installation",
      "Service or maintenance",
      "Ducted system",
      "Split system",
      "Gas refill / leak",
      "Noisy or smelly unit",
      "Other",
    ],
    serviceScopeOptions: [
      "Scheduled servicing",
      "Filter cleaning",
      "Ducted system checks",
      "Refrigerant checks",
      "Thermostat calibration",
      "General maintenance",
    ],
    requestUploadLabel: "Photos of the unit or area",
    completionUploadLabel: "Before / after photos",
    complianceNote:
      "Refrigerant handling is carried out by appropriately licensed technicians.",
    audience: [
      "air conditioning businesses",
      "HVAC contractors",
      "refrigeration technicians",
      "split & ducted installers",
    ],
  },
  {
    key: "carpentry",
    trade: "Carpentry",
    professional: "carpenter",
    issueLabel: "What do you need help with?",
    issueOptions: [
      "Doors & locks",
      "Decking",
      "Pergola / outdoor",
      "Cabinetry / built-ins",
      "Flooring & skirting",
      "Framing",
      "Repairs & maintenance",
      "Other",
    ],
    serviceScopeOptions: [
      "Repairs & maintenance",
      "Deck maintenance",
      "Door adjustments",
      "Fit-outs",
      "General carpentry",
    ],
    requestUploadLabel: "Photos of the job or space",
    completionUploadLabel: "Before / after photos",
    complianceNote: "Work is carried out by qualified carpenters and joiners.",
    audience: ["carpenters", "joiners", "deck builders", "home renovators"],
  },
  {
    key: "painting",
    trade: "Painting",
    professional: "painter",
    issueLabel: "What do you need painted?",
    issueOptions: [
      "Interior painting",
      "Exterior painting",
      "Roof painting",
      "Feature wall",
      "Repaint / touch-up",
      "New build",
      "Commercial",
      "Other",
    ],
    serviceScopeOptions: [
      "Interior repaints",
      "Exterior maintenance",
      "Protective coatings",
      "Colour consultations",
      "General touch-ups",
    ],
    requestUploadLabel: "Photos of the areas to be painted",
    completionUploadLabel: "Before / after photos",
    complianceNote:
      "Surface preparation and coatings follow manufacturer and safety guidance.",
    audience: [
      "painters",
      "decorators",
      "commercial painting contractors",
      "strata painters",
    ],
  },
  {
    key: "landscaping",
    trade: "Landscaping & Gardening",
    professional: "landscaper",
    issueLabel: "What do you need help with?",
    issueOptions: [
      "Lawn & turf",
      "Garden design",
      "Paving & retaining",
      "Irrigation",
      "Tree & hedge work",
      "Clean-up / green waste",
      "Ongoing maintenance",
      "Other",
    ],
    serviceScopeOptions: [
      "Lawn mowing",
      "Hedging & pruning",
      "Weed control",
      "Garden bed maintenance",
      "Irrigation checks",
      "Green waste removal",
    ],
    requestUploadLabel: "Photos of the garden or yard",
    completionUploadLabel: "Before / after photos",
    complianceNote:
      "Green waste is handled responsibly and work follows local guidelines.",
    audience: [
      "landscapers",
      "gardeners",
      "lawn care businesses",
      "grounds maintenance teams",
    ],
  },
  {
    key: "building",
    trade: "Building & Construction",
    professional: "builder",
    issueLabel: "What type of work do you need?",
    issueOptions: [
      "Extension / addition",
      "Renovation",
      "New build",
      "Structural repair",
      "Bathroom / kitchen",
      "Insurance work",
      "Commercial fit-out",
      "Other",
    ],
    serviceScopeOptions: [
      "Maintenance contracts",
      "Warranty repairs",
      "Scheduled inspections",
      "Minor works",
      "General building maintenance",
    ],
    requestUploadLabel: "Photos or plans",
    completionUploadLabel: "Progress / completion photos",
    complianceNote:
      "Building work is carried out by licensed builders and may require permits and certification.",
    audience: [
      "builders",
      "construction companies",
      "renovation specialists",
      "project managers",
    ],
  },
  {
    key: "handyman",
    trade: "Handyman",
    professional: "handyman",
    issueLabel: "What do you need done?",
    issueOptions: [
      "General repairs",
      "Furniture assembly",
      "Mounting & hanging",
      "Minor plumbing",
      "Minor electrical (where licensed)",
      "Painting touch-ups",
      "Odd jobs",
      "Other",
    ],
    serviceScopeOptions: [
      "Property maintenance",
      "Repairs list",
      "Rental turnovers",
      "Scheduled odd jobs",
      "Handyman visits",
    ],
    requestUploadLabel: "Photos of the jobs",
    completionUploadLabel: "Before / after photos",
    complianceNote:
      "Licensed work such as electrical or gas is referred to appropriately licensed trades.",
    audience: [
      "handyman businesses",
      "property maintenance",
      "real estate managers",
      "strata managers",
    ],
  },
  {
    key: "roofing",
    trade: "Roofing",
    professional: "roofer",
    issueLabel: "What do you need help with?",
    issueOptions: [
      "Leaking roof",
      "Roof repair",
      "Roof replacement",
      "Gutters & downpipes",
      "Roof restoration",
      "Metal roofing",
      "Tiled roofing",
      "Other",
    ],
    serviceScopeOptions: [
      "Roof inspections",
      "Gutter cleaning",
      "Leak maintenance",
      "Restoration checks",
      "Storm damage assessment",
    ],
    requestUploadLabel: "Photos of the roof or damage",
    completionUploadLabel: "Before / after photos",
    complianceNote:
      "Work at heights is carried out with appropriate safety measures and licensing.",
    audience: [
      "roofers",
      "roof restoration businesses",
      "guttering specialists",
      "storm repair teams",
    ],
  },
  {
    key: "tiling",
    trade: "Tiling",
    professional: "tiler",
    issueLabel: "What do you need tiled?",
    issueOptions: [
      "Bathroom tiling",
      "Kitchen / splashback",
      "Floor tiling",
      "Outdoor / pool tiling",
      "Waterproofing",
      "Regrouting / repair",
      "Commercial tiling",
      "Other",
    ],
    serviceScopeOptions: [
      "Regrouting",
      "Waterproofing checks",
      "Repairs",
      "Sealing",
      "General tiling maintenance",
    ],
    requestUploadLabel: "Photos of the area to be tiled",
    completionUploadLabel: "Before / after photos",
    complianceNote:
      "Waterproofing is carried out to relevant standards by qualified trades.",
    audience: [
      "tilers",
      "waterproofers",
      "bathroom renovators",
      "commercial tiling contractors",
    ],
  },
  {
    key: "plastering",
    trade: "Plastering",
    professional: "plasterer",
    issueLabel: "What do you need help with?",
    issueOptions: [
      "Wall repair",
      "Ceiling repair",
      "New plasterboard",
      "Cornices",
      "Rendering",
      "Water damage repair",
      "Skim coat / finish",
      "Other",
    ],
    serviceScopeOptions: [
      "Crack repairs",
      "Patch & paint prep",
      "Water damage repairs",
      "Cornice repairs",
      "General plastering",
    ],
    requestUploadLabel: "Photos of the walls or ceilings",
    completionUploadLabel: "Before / after photos",
    complianceNote:
      "Work follows manufacturer and safety guidance for the materials used.",
    audience: [
      "plasterers",
      "gyprock installers",
      "renderers",
      "home renovators",
    ],
  },
  {
    key: "locksmith",
    trade: "Locksmith",
    professional: "locksmith",
    issueLabel: "What do you need help with?",
    issueOptions: [
      "Locked out",
      "Lock repair / replace",
      "Rekeying",
      "New locks",
      "Keys cut",
      "Security upgrade",
      "Commercial / master key",
      "Other",
    ],
    serviceScopeOptions: [
      "Security audits",
      "Lock maintenance",
      "Master key management",
      "Access control checks",
      "Scheduled rekeying",
    ],
    requestUploadLabel: "Photos of the lock or door",
    completionUploadLabel: "Completed work photos",
    complianceNote:
      "Identity and authority to access the property may be verified before work begins.",
    audience: [
      "locksmiths",
      "mobile locksmiths",
      "security businesses",
      "property managers",
    ],
  },
  {
    key: "pest-control",
    trade: "Pest Control",
    professional: "technician",
    issueLabel: "What pest issue are you dealing with?",
    issueOptions: [
      "Ants",
      "Cockroaches",
      "Spiders",
      "Rodents",
      "Termites / inspection",
      "Wasps / bees",
      "General treatment",
      "Other",
    ],
    serviceScopeOptions: [
      "Scheduled treatments",
      "Termite inspections",
      "Rodent monitoring",
      "Commercial pest programs",
      "General pest maintenance",
    ],
    requestUploadLabel: "Photos of the pest or affected area",
    completionUploadLabel: "Treatment area photos",
    complianceNote:
      "Treatments use approved products applied by licensed pest technicians.",
    audience: [
      "pest control businesses",
      "termite specialists",
      "commercial pest programs",
      "strata managers",
    ],
  },
  {
    key: "cleaning",
    trade: "Cleaning",
    professional: "cleaner",
    issueLabel: "What type of clean do you need?",
    issueOptions: [
      "Regular home clean",
      "End of lease / bond",
      "Commercial / office",
      "Carpet cleaning",
      "Window cleaning",
      "Post-construction",
      "Deep clean",
      "Other",
    ],
    serviceScopeOptions: [
      "Weekly / fortnightly cleans",
      "Office cleaning",
      "Carpet & window schedules",
      "Common area cleaning",
      "General cleaning",
    ],
    requestUploadLabel: "Photos of the space (optional)",
    completionUploadLabel: "Before / after photos",
    complianceNote:
      "Cleaning products and methods follow safe-use and site guidelines.",
    audience: [
      "cleaning businesses",
      "commercial cleaners",
      "end-of-lease specialists",
      "strata & office managers",
    ],
  },
  {
    key: "flooring",
    trade: "Flooring",
    professional: "installer",
    issueLabel: "What flooring do you need?",
    issueOptions: [
      "Timber / laminate",
      "Vinyl / hybrid",
      "Carpet",
      "Tiles",
      "Floor repair",
      "Sanding & polishing",
      "Commercial flooring",
      "Other",
    ],
    serviceScopeOptions: [
      "Floor inspections",
      "Repairs",
      "Recoat & polish",
      "Commercial maintenance",
      "General flooring care",
    ],
    requestUploadLabel: "Photos of the floor or area",
    completionUploadLabel: "Before / after photos",
    complianceNote:
      "Subfloor preparation and materials follow manufacturer guidance.",
    audience: [
      "flooring installers",
      "timber flooring specialists",
      "carpet layers",
      "commercial flooring contractors",
    ],
  },
  {
    key: "fencing",
    trade: "Fencing",
    professional: "contractor",
    issueLabel: "What do you need help with?",
    issueOptions: [
      "New fence",
      "Fence repair",
      "Gates",
      "Colorbond / metal",
      "Timber fencing",
      "Pool fencing",
      "Retaining wall",
      "Other",
    ],
    serviceScopeOptions: [
      "Fence inspections",
      "Repairs",
      "Gate maintenance",
      "Pool fence compliance checks",
      "General fencing maintenance",
    ],
    requestUploadLabel: "Photos of the fence line or area",
    completionUploadLabel: "Before / after photos",
    complianceNote:
      "Pool fencing and boundary work may require compliance with local regulations.",
    audience: [
      "fencing contractors",
      "pool fence installers",
      "gate specialists",
      "rural fencing businesses",
    ],
  },
];

function complianceIntro(trade: TradeConfig) {
  return html(
    "service-notice",
    "Service notice",
    `<p>${trade.complianceNote}</p>`,
  );
}

function getJobRequestFields(trade: TradeConfig): FormBuilderField[] {
  return createTemplateFields([
    legalNotice(),
    complianceIntro(trade),

    section("customer-section", "Your Details"),
    input("customer-name", "text", "Full name"),
    input("customer-phone", "phone", "Phone"),
    input("customer-email", "email", "Email"),
    input("service-address", "address", "Service address"),

    section("property-section", "Property & Access"),
    input("property-type", "select", "Property type", {
      options: PROPERTY_TYPE_OPTIONS,
    }),
    input("best-contact-time", "select", "Best time to contact you", {
      options: CONTACT_TIME_OPTIONS,
    }),
    input("access-notes", "textarea", "Access notes or parking details", {
      required: false,
      placeholder: "Gate codes, pets, parking, stairs, etc.",
    }),

    section("job-section", "Job Details"),
    input("job-issue", "select", trade.issueLabel, {
      options: trade.issueOptions,
    }),
    input("job-description", "textarea", "Describe the job", {
      placeholder: "Tell us what's happening and what you'd like done.",
    }),
    input("job-urgency", "select", "How urgent is this?", {
      options: URGENCY_OPTIONS,
    }),
    conditionalHtml(
      "urgency-emergency-note",
      "Emergency note",
      `<p><strong>${EMERGENCY_SAFETY_NOTE}</strong></p>`,
      condition("job-urgency", "Emergency (same day)"),
    ),
    input("preferred-date", "date", "Preferred date (if any)", {
      required: false,
    }),

    section("photos-section", "Photos"),
    input("job-photos", "image_upload", trade.requestUploadLabel, {
      required: false,
    }),

    section("consent-section", "Quote & Consent"),
    input("how-heard", "text", "How did you hear about us?", {
      required: false,
    }),
    input(
      "marketing-consent",
      "checkbox",
      "I'm happy to receive occasional updates and offers.",
      { required: false },
    ),
    input(
      "quote-consent",
      "checkbox",
      "I understand this is a request for a quote and not a confirmed booking.",
    ),

    section("office-section", "Office Processing", "OFFICE"),
    input("office-assigned", "text", `Assigned ${trade.professional}`, {
      required: false,
      visibility: "OFFICE",
    }),
    input("office-quote-amount", "currency", "Quote amount", {
      required: false,
      visibility: "OFFICE",
    }),
    input("office-quote-status", "select", "Quote status", {
      options: ["New", "Quoted", "Approved", "Declined", "Follow-up"],
      visibility: "OFFICE",
    }),
    input("office-scheduled-date", "date", "Scheduled date", {
      required: false,
      visibility: "OFFICE",
    }),
    input("office-notes", "textarea", "Internal notes / materials", {
      required: false,
      visibility: "OFFICE",
    }),
    input("office-job-status", "select", "Job status", {
      options: [
        "New",
        "Quoted",
        "Scheduled",
        "In progress",
        "Completed",
        "Invoiced",
      ],
      visibility: "OFFICE",
    }),
  ]);
}

function getJobCompletionFields(trade: TradeConfig): FormBuilderField[] {
  return createTemplateFields([
    legalNotice(),
    html(
      "completion-intro",
      "Completion summary",
      `<p>This form records the completed ${trade.trade.toLowerCase()} work and the customer's sign-off. Please review the details before signing.</p>`,
    ),

    section("customer-section", "Customer & Job"),
    input("customer-name", "text", "Customer name"),
    input("service-address", "address", "Service address"),
    input("job-reference", "text", "Job or quote reference", {
      required: false,
    }),
    input("date-completed", "date", "Date work completed"),

    section("work-section", "Work Performed"),
    input("work-summary", "textarea", "Summary of work performed"),
    input("materials-used", "textarea", "Materials or parts used", {
      required: false,
    }),
    input("further-work-needed", "select", "Is any further work recommended?", {
      options: ["No", "Yes"],
    }),
    input("further-work-details", "textarea", "Further work details", {
      required: false,
      conditionalLogic: condition("further-work-needed", "Yes"),
    }),

    section("photos-section", "Photos"),
    input("completion-photos", "image_upload", trade.completionUploadLabel, {
      required: false,
    }),

    section("signoff-section", "Customer Sign-off"),
    input("satisfaction", "select", "Are you satisfied with the completed work?", {
      options: [
        "Yes, fully satisfied",
        "Mostly satisfied",
        "Not satisfied - see notes",
      ],
    }),
    input("signoff-notes", "textarea", "Any notes or concerns?", {
      required: false,
    }),
    input(
      "signoff-ack",
      "checkbox",
      "I confirm the work above has been completed to the agreed scope.",
    ),
    input("customer-signature", "signature", "Customer signature"),

    section("office-section", "Office Processing", "OFFICE"),
    input("office-warranty", "text", "Warranty period", {
      required: false,
      visibility: "OFFICE",
    }),
    input("office-invoice-amount", "currency", "Invoice amount", {
      required: false,
      visibility: "OFFICE",
    }),
    input("office-payment-status", "select", "Payment status", {
      options: ["Unpaid", "Deposit paid", "Paid in full", "On account"],
      visibility: "OFFICE",
    }),
    input("office-followup", "select", "Follow-up required?", {
      options: ["No", "Yes"],
      visibility: "OFFICE",
    }),
    input("office-completion-notes", "textarea", "Internal notes", {
      required: false,
      visibility: "OFFICE",
    }),
  ]);
}

function getServiceAgreementFields(trade: TradeConfig): FormBuilderField[] {
  return createTemplateFields([
    legalNotice(),
    html(
      "agreement-intro",
      "Agreement notice",
      `<p>This ${trade.trade.toLowerCase()} service and maintenance agreement sets out the recurring services, schedule, and terms. Review and edit all wording before publishing.</p>`,
    ),

    section("client-section", "Client & Site"),
    input("client-name", "text", "Client / business name"),
    input("contact-name", "text", "Primary contact name"),
    input("contact-phone", "phone", "Phone"),
    input("contact-email", "email", "Email"),
    input("site-address", "address", "Site address"),

    section("service-section", "Service Scope"),
    input("service-scope", "checkbox", "Services included", {
      options: trade.serviceScopeOptions,
    }),
    input("service-frequency", "select", "Service frequency", {
      options: SERVICE_FREQUENCY_OPTIONS,
    }),
    input("preferred-day", "select", "Preferred service day", {
      required: false,
      options: [
        "No preference",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
    }),
    input(
      "special-requirements",
      "textarea",
      "Special requirements or site notes",
      { required: false },
    ),

    section("term-section", "Term & Pricing"),
    input("start-date", "date", "Agreement start date"),
    input("term-length", "select", "Agreement term", {
      options: [
        "Ongoing (cancel anytime)",
        "6 months",
        "12 months",
        "24 months",
      ],
    }),
    input("agreed-price", "currency", "Agreed service price", {
      required: false,
    }),
    input("price-basis", "select", "Pricing basis", {
      options: [
        "Per visit",
        "Per month",
        "Per quarter",
        "Per year",
        "Custom quote",
      ],
    }),

    section("terms-section", "Terms & Signature"),
    html(
      "agreement-terms",
      "Service terms",
      `<p>The client acknowledges the service scope, scheduling, access, cancellation, and payment terms as reviewed and edited by the ${trade.professional} before publication.</p>`,
    ),
    input(
      "terms-ack",
      "checkbox",
      "I have read and accept the service agreement terms.",
    ),
    input("client-signature", "signature", "Client signature"),

    section("office-section", "Office Processing", "OFFICE"),
    input("office-contract-value", "currency", "Total contract value", {
      required: false,
      visibility: "OFFICE",
    }),
    input("office-next-service", "date", "Next scheduled service", {
      required: false,
      visibility: "OFFICE",
    }),
    input("office-account-status", "select", "Account status", {
      options: ["Prospect", "Active", "On hold", "Cancelled"],
      visibility: "OFFICE",
    }),
    input("office-agreement-notes", "textarea", "Internal notes", {
      required: false,
      visibility: "OFFICE",
    }),
  ]);
}

function buildJobRequestTemplate(
  trade: TradeConfig,
): WorkflowTemplateDefinition {
  return {
    slug: `${trade.key}-job-request`,
    title: `${trade.trade} Job Request & Quote`,
    category: "Trades & Services",
    description: `${trade.trade} job request and quote workflow: customer and site details, ${trade.professional} job specifics, urgency logic, photo uploads, and internal quote and scheduling fields.`,
    featureBadges: [
      "Quote request",
      "Photo upload",
      "Conditional logic",
      "Office fields",
      "PDF-ready",
    ],
    requiredCapabilities: TRADE_WORKFLOW_REQUIREMENTS,
    mode: FormMode.STANDARD,
    status: FormStatus.DRAFT,
    settings: {
      submitButtonText: "Request a Quote",
      successMessage:
        "Thank you. Your request has been submitted and we'll be in touch with a quote.",
    },
    getFields: () => getJobRequestFields(trade),
  };
}

function buildJobCompletionTemplate(
  trade: TradeConfig,
): WorkflowTemplateDefinition {
  return {
    slug: `${trade.key}-job-completion`,
    title: `${trade.trade} Job Completion & Sign-off`,
    category: "Trades & Services",
    description: `${trade.trade} job completion and sign-off workflow: work performed, materials, before and after photos, customer satisfaction, signature, and internal warranty, invoice, and payment fields.`,
    featureBadges: [
      "Signature",
      "Photo upload",
      "Conditional logic",
      "Office fields",
      "PDF-ready",
    ],
    requiredCapabilities: TRADE_WORKFLOW_REQUIREMENTS,
    mode: FormMode.AGREEMENT,
    status: FormStatus.DRAFT,
    settings: {
      submitButtonText: "Submit Sign-off",
      successMessage:
        "Thank you. Your completion sign-off has been recorded.",
    },
    getFields: () => getJobCompletionFields(trade),
  };
}

function buildServiceAgreementTemplate(
  trade: TradeConfig,
): WorkflowTemplateDefinition {
  return {
    slug: `${trade.key}-service-agreement`,
    title: `${trade.trade} Service & Maintenance Agreement`,
    category: "Trades & Services",
    description: `${trade.trade} service and maintenance agreement: recurring service scope, schedule, term and pricing, terms acknowledgement, signature, and internal account fields.`,
    featureBadges: [
      "Agreement",
      "Signature",
      "Conditional logic",
      "Office fields",
      "PDF-ready",
    ],
    requiredCapabilities: TRADE_WORKFLOW_REQUIREMENTS,
    mode: FormMode.AGREEMENT,
    status: FormStatus.DRAFT,
    settings: {
      submitButtonText: "Submit Agreement",
      successMessage:
        "Thank you. Your service agreement has been submitted for review.",
    },
    getFields: () => getServiceAgreementFields(trade),
  };
}

export const TRADE_WORKFLOW_TEMPLATES: WorkflowTemplateDefinition[] =
  TRADES.flatMap((trade) => [
    buildJobRequestTemplate(trade),
    buildJobCompletionTemplate(trade),
    buildServiceAgreementTemplate(trade),
  ]);
