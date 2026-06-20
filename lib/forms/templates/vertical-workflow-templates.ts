import { FormMode, FormStatus } from "@prisma/client";
import {
  defaultConditionalLogic,
  type FieldConditionalLogic,
} from "@/lib/forms/conditional-logic";
import type {
  FormBuilderField,
  FormFieldType,
  FormFieldVisibility,
} from "@/lib/forms/fields";
import { fieldSupportsOptions } from "@/lib/forms/fields";
import {
  getVehicleHireAgreementFields,
  VEHICLE_HIRE_AGREEMENT_TEMPLATE,
} from "@/lib/forms/templates/vehicle-hire-agreement";

type TemplateFieldInput = {
  id: string;
  type: FormFieldType;
  label?: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  content?: string;
  conditionalLogic?: FieldConditionalLogic;
  visibility?: FormFieldVisibility;
};

export type WorkflowTemplateDefinition = {
  slug: string;
  title: string;
  category: "Rental & Hire" | "Trades & Services" | "Booking & Events";
  description: string;
  featureBadges: string[];
  requiredCapabilities: {
    allowTemplates?: boolean;
    allowOfficeUseFields?: boolean;
    allowConditionalLogic?: boolean;
    allowPdfGeneration?: boolean;
    allowGoogleDrive?: boolean;
    allowDropbox?: boolean;
    requiredFieldTypes?: FormFieldType[];
    maxConditionalRules?: number;
  };
  mode: FormMode;
  status: FormStatus;
  settings: {
    submitButtonText: string;
    successMessage: string;
  };
  getFields: () => FormBuilderField[];
};

const COMPLETE_WORKFLOW_REQUIREMENTS = {
  allowTemplates: true,
  allowOfficeUseFields: true,
  allowConditionalLogic: true,
  allowPdfGeneration: true,
} satisfies WorkflowTemplateDefinition["requiredCapabilities"];

function createTemplateFields(items: TemplateFieldInput[]): FormBuilderField[] {
  return items.map((item, index) => ({
    id: item.id,
    type: item.type,
    label: item.label ?? "",
    placeholder: item.placeholder ?? "",
    required: ["html", "static_text", "section_heading"].includes(item.type)
      ? false
      : Boolean(item.required ?? true),
    order: index + 1,
    options: fieldSupportsOptions(item.type) ? item.options ?? [] : [],
    content: item.content ?? "",
    conditionalLogic: item.conditionalLogic ?? defaultConditionalLogic(),
    settings: {},
    visibility: item.visibility ?? "PUBLIC",
  }));
}

function condition(sourceFieldId: string, value: string): FieldConditionalLogic {
  return {
    enabled: true,
    action: "SHOW",
    sourceFieldId,
    operator: "EQUALS",
    value,
  };
}

function section(id: string, label: string, visibility: FormFieldVisibility = "PUBLIC") {
  return {
    id,
    type: "section_heading" as const,
    label,
    content: label,
    visibility,
  };
}

function html(id: string, label: string, content: string, visibility: FormFieldVisibility = "PUBLIC") {
  return {
    id,
    type: "html" as const,
    label,
    content,
    visibility,
  };
}

function input(
  id: string,
  type: FormFieldType,
  label: string,
  options: {
    conditionalLogic?: FieldConditionalLogic;
    options?: string[];
    placeholder?: string;
    required?: boolean;
    visibility?: FormFieldVisibility;
  } = {},
) {
  return {
    id,
    type,
    label,
    placeholder: options.placeholder ?? "",
    required: options.required ?? true,
    options: options.options,
    conditionalLogic: options.conditionalLogic,
    visibility: options.visibility ?? "PUBLIC",
  };
}

function legalNotice() {
  return html(
    "template-legal-notice",
    "Template review notice",
    "<p>This template is a starting point only. The business owner should review all wording, operational details, and legal suitability before publishing. FormOS does not guarantee legal enforceability in every jurisdiction.</p>",
  );
}

function getEquipmentRentalAgreementFields() {
  return createTemplateFields([
    legalNotice(),
    section("customer-section", "Customer / Business Details"),
    input("renter-type", "select", "Are you renting as an individual or business?", {
      options: ["Individual", "Business"],
    }),
    input("customer-name", "text", "Customer full name"),
    input("business-name", "text", "Business name", {
      conditionalLogic: condition("renter-type", "Business"),
    }),
    input("abn-or-company-number", "text", "ABN / company number", {
      required: false,
      conditionalLogic: condition("renter-type", "Business"),
    }),
    input("customer-email", "email", "Email"),
    input("customer-phone", "phone", "Phone"),
    input("customer-address", "address", "Billing / service address"),

    section("equipment-section", "Equipment Requested"),
    input("equipment-requested", "textarea", "Equipment requested", {
      placeholder: "List the equipment, accessories, quantities, and any model preferences.",
    }),
    input("rental-start-date", "date", "Rental start date"),
    input("rental-end-date", "date", "Rental end date"),
    input("pickup-or-delivery", "select", "Pickup or delivery?", {
      options: ["Pickup", "Delivery"],
    }),
    input("delivery-address", "address", "Delivery address", {
      conditionalLogic: condition("pickup-or-delivery", "Delivery"),
    }),
    input("delivery-access-notes", "textarea", "Delivery access notes", {
      required: false,
      conditionalLogic: condition("pickup-or-delivery", "Delivery"),
    }),
    input("operator-required", "select", "Do you need an operator or setup assistance?", {
      options: ["No", "Yes"],
    }),
    input("operator-details", "textarea", "Operator/setup details", {
      conditionalLogic: condition("operator-required", "Yes"),
    }),

    section("proof-section", "Proof and Condition"),
    input("id-proof-upload", "image_upload", "ID or proof of business upload"),
    input("site-reference-upload", "image_upload", "Optional site/reference photo upload", {
      required: false,
    }),

    section("acknowledgement-section", "Rental Acknowledgements"),
    html(
      "equipment-terms",
      "Equipment terms",
      "<p>The renter acknowledges responsibility for appropriate use, timely return, loss, damage, late-return charges, and safety requirements. The owner should review and adjust terms before publishing.</p>",
    ),
    input("damage-loss-ack", "checkbox", "I acknowledge damage, loss, and late return responsibility."),
    input("safety-ack", "checkbox", "I understand the equipment must be used safely and as instructed."),
    input("equipment-signature", "signature", "Renter signature"),

    section("office-section", "Office Processing", "OFFICE"),
    input("office-equipment-id", "text", "Equipment ID / asset number", { visibility: "OFFICE" }),
    input("office-condition-out", "textarea", "Condition out checklist", { visibility: "OFFICE" }),
    input("office-deposit", "currency", "Deposit received", { visibility: "OFFICE" }),
    input("office-return-condition", "textarea", "Return condition notes", { required: false, visibility: "OFFICE" }),
    input("office-approval-status", "select", "Approval status", {
      options: ["Pending", "Approved", "Rejected", "Needs follow-up"],
      visibility: "OFFICE",
    }),
  ]);
}

function getContractorJobIntakeFields() {
  return createTemplateFields([
    legalNotice(),
    section("customer-section", "Customer Details"),
    input("customer-name", "text", "Customer name"),
    input("customer-email", "email", "Email"),
    input("customer-phone", "phone", "Phone"),
    input("job-address", "address", "Job address"),

    section("job-section", "Job Intake"),
    input("service-type", "select", "Service type", {
      options: ["Repairs", "Installation", "Maintenance", "Inspection", "Other"],
    }),
    input("other-service-type", "text", "Other service type", {
      conditionalLogic: condition("service-type", "Other"),
    }),
    input("preferred-date", "date", "Preferred date"),
    input("preferred-time", "text", "Preferred time window", {
      placeholder: "Example: Morning, 1pm-3pm, after 5pm",
    }),
    input("job-description", "textarea", "Job description"),
    input("job-photo-upload", "image_upload", "Photo upload", { required: false }),
    input("is-urgent", "select", "Is this urgent?", {
      options: ["No", "Yes"],
    }),
    input("urgent-details", "textarea", "Urgent issue details", {
      conditionalLogic: condition("is-urgent", "Yes"),
    }),
    input("access-required", "select", "Will the contractor need special access?", {
      options: ["No", "Yes"],
    }),
    input("access-instructions", "textarea", "Access instructions", {
      conditionalLogic: condition("access-required", "Yes"),
    }),

    section("consent-section", "Permission and Waiver"),
    html(
      "contractor-waiver",
      "Contractor permission",
      "<p>The customer confirms they are authorized to request the work, grants reasonable property access, and acknowledges safety instructions and site limitations. The business should review this wording before use.</p>",
    ),
    input("permission-consent", "checkbox", "I authorize the contractor to access the property for the requested work."),
    input("safety-consent", "checkbox", "I agree to provide accurate safety/access information."),
    input("customer-signature", "signature", "Customer signature"),

    section("office-section", "Office Processing", "OFFICE"),
    input("office-assigned-contractor", "text", "Assigned contractor", { visibility: "OFFICE" }),
    input("office-quote-amount", "currency", "Quote amount", { required: false, visibility: "OFFICE" }),
    input("office-risk-notes", "textarea", "Risk notes", { required: false, visibility: "OFFICE" }),
    input("office-job-status", "select", "Job status", {
      options: ["New", "Quoted", "Scheduled", "In progress", "Completed", "Needs follow-up"],
      visibility: "OFFICE",
    }),
    input("office-follow-up-date", "date", "Follow-up date", { required: false, visibility: "OFFICE" }),
  ]);
}

function getServiceBookingConsentFields() {
  return createTemplateFields([
    legalNotice(),
    section("client-section", "Client Details"),
    input("client-name", "text", "Client name"),
    input("client-email", "email", "Email"),
    input("client-phone", "phone", "Phone"),
    input("new-or-returning", "select", "Are you a new or returning client?", {
      options: ["New client", "Returning client"],
    }),
    input("new-client-notes", "textarea", "New client background / referral notes", {
      required: false,
      conditionalLogic: condition("new-or-returning", "New client"),
    }),

    section("booking-section", "Booking Request"),
    input("service-requested", "select", "Service requested", {
      options: ["Consultation", "Treatment", "Assessment", "Follow-up", "Other"],
    }),
    input("other-service-requested", "text", "Other service requested", {
      conditionalLogic: condition("service-requested", "Other"),
    }),
    input("preferred-appointment-date", "date", "Preferred appointment date"),
    input("preferred-appointment-time", "text", "Preferred appointment time"),
    input("special-requirements", "select", "Any special requirements?", {
      options: ["No", "Yes"],
    }),
    input("special-requirements-details", "textarea", "Special requirements details", {
      conditionalLogic: condition("special-requirements", "Yes"),
    }),
    input("client-notes", "textarea", "Additional notes", { required: false }),

    section("consent-section", "Cancellation and Consent"),
    html(
      "service-consent-terms",
      "Service consent terms",
      "<p>The client acknowledges appointment, cancellation, late arrival, and consent requirements as edited by the business before publication.</p>",
    ),
    input("cancellation-ack", "checkbox", "I acknowledge the cancellation and appointment terms."),
    input("service-consent-ack", "checkbox", "I consent to the requested service or consultation process."),
    input("client-signature", "signature", "Client signature"),

    section("office-section", "Office Processing", "OFFICE"),
    input("office-appointment-confirmed", "select", "Appointment confirmed", {
      options: ["Pending", "Confirmed", "Declined", "Needs follow-up"],
      visibility: "OFFICE",
    }),
    input("office-assigned-staff", "text", "Assigned staff", { visibility: "OFFICE" }),
    input("office-deposit-status", "select", "Deposit/payment status", {
      options: ["Not required", "Pending", "Paid", "Waived", "Refund required"],
      visibility: "OFFICE",
    }),
    input("office-booking-status", "select", "Booking status", {
      options: ["New", "Booked", "Rescheduled", "Completed", "Cancelled"],
      visibility: "OFFICE",
    }),
    input("office-booking-notes", "textarea", "Internal booking notes", { required: false, visibility: "OFFICE" }),
  ]);
}

function getPhotographyEventBookingFields() {
  return createTemplateFields([
    legalNotice(),
    section("client-section", "Client Details"),
    input("client-name", "text", "Client name"),
    input("client-email", "email", "Email"),
    input("client-phone", "phone", "Phone"),

    section("event-section", "Event Details"),
    input("event-type", "select", "Event type", {
      options: ["Wedding", "Corporate event", "Birthday/private event", "Portrait session", "Other"],
    }),
    input("other-event-type", "text", "Other event type", {
      conditionalLogic: condition("event-type", "Other"),
    }),
    input("event-date", "date", "Event date"),
    input("event-time", "text", "Event time"),
    input("location-type", "select", "Location type", {
      options: ["Single location", "Multiple locations", "To be confirmed"],
    }),
    input("event-location", "address", "Primary event location"),
    input("additional-locations", "textarea", "Additional locations / travel notes", {
      conditionalLogic: condition("location-type", "Multiple locations"),
    }),
    input("guest-count", "number", "Estimated guest count", { required: false }),

    section("package-section", "Package and Creative Notes"),
    input("package-requested", "select", "Package requested", {
      options: ["Essential", "Standard", "Premium", "Custom"],
    }),
    input("custom-package-notes", "textarea", "Custom package notes", {
      conditionalLogic: condition("package-requested", "Custom"),
    }),
    input("special-details", "textarea", "Special details / must-have shots"),
    input("mood-board-upload", "image_upload", "Mood board or reference upload", { required: false }),
    input("private-event", "select", "Is this event private or sensitive?", {
      options: ["No", "Yes"],
    }),
    input("privacy-notes", "textarea", "Privacy / no-public-sharing notes", {
      conditionalLogic: condition("private-event", "Yes"),
    }),

    section("agreement-section", "Booking Agreement"),
    html(
      "photo-agreement-terms",
      "Photography booking terms",
      "<p>The client acknowledges booking, cancellation, rescheduling, delivery, creative direction, and portfolio consent terms as reviewed and edited by the photographer before publication.</p>",
    ),
    input("portfolio-consent", "select", "Portfolio/social media consent", {
      options: ["Yes, portfolio use allowed", "No, keep private", "Discuss with me first"],
    }),
    input("booking-terms-ack", "checkbox", "I acknowledge the booking, cancellation, and reschedule terms."),
    input("client-signature", "signature", "Client signature"),

    section("office-section", "Office Processing", "OFFICE"),
    input("office-assigned-photographer", "text", "Assigned photographer", { visibility: "OFFICE" }),
    input("office-package-confirmed", "select", "Package confirmed", {
      options: ["Pending", "Confirmed", "Custom quote required"],
      visibility: "OFFICE",
    }),
    input("office-deposit", "currency", "Deposit received", { required: false, visibility: "OFFICE" }),
    input("office-balance", "currency", "Balance due", { required: false, visibility: "OFFICE" }),
    input("office-shot-list", "textarea", "Internal shot list / run sheet", { required: false, visibility: "OFFICE" }),
    input("office-booking-status", "select", "Booking status", {
      options: ["New", "Tentative", "Confirmed", "Completed", "Cancelled"],
      visibility: "OFFICE",
    }),
  ]);
}

export const WORKFLOW_TEMPLATES: WorkflowTemplateDefinition[] = [
  {
    slug: "vehicle-hire-agreement",
    title: VEHICLE_HIRE_AGREEMENT_TEMPLATE.title,
    category: "Rental & Hire",
    description: VEHICLE_HIRE_AGREEMENT_TEMPLATE.description,
    featureBadges: [
      "Signature",
      "File upload",
      "Conditional logic",
      "Office fields",
      "PDF-ready",
    ],
    requiredCapabilities: COMPLETE_WORKFLOW_REQUIREMENTS,
    mode: VEHICLE_HIRE_AGREEMENT_TEMPLATE.mode,
    status: VEHICLE_HIRE_AGREEMENT_TEMPLATE.status,
    settings: VEHICLE_HIRE_AGREEMENT_TEMPLATE.settings,
    getFields: getVehicleHireAgreementFields,
  },
  {
    slug: "equipment-rental-agreement",
    title: "Equipment Rental Agreement",
    category: "Rental & Hire",
    description:
      "Rental workflow with customer/business details, equipment request, delivery logic, proof uploads, safety acknowledgments, signature, and office approval fields.",
    featureBadges: [
      "Signature",
      "File upload",
      "Conditional logic",
      "Office fields",
      "PDF-ready",
    ],
    requiredCapabilities: COMPLETE_WORKFLOW_REQUIREMENTS,
    mode: FormMode.AGREEMENT,
    status: FormStatus.DRAFT,
    settings: {
      submitButtonText: "Submit Rental Agreement",
      successMessage: "Thank you. Your equipment rental request has been submitted.",
    },
    getFields: getEquipmentRentalAgreementFields,
  },
  {
    slug: "contractor-job-intake-waiver",
    title: "Contractor Job Intake + Waiver",
    category: "Trades & Services",
    description:
      "Trades workflow for collecting job details, site access, urgent issue context, photo uploads, permission/waiver consent, and internal quote/status fields.",
    featureBadges: [
      "Signature",
      "Photo upload",
      "Conditional logic",
      "Office fields",
      "PDF-ready",
    ],
    requiredCapabilities: COMPLETE_WORKFLOW_REQUIREMENTS,
    mode: FormMode.STANDARD,
    status: FormStatus.DRAFT,
    settings: {
      submitButtonText: "Submit Job Request",
      successMessage: "Thank you. Your job request has been submitted.",
    },
    getFields: getContractorJobIntakeFields,
  },
  {
    slug: "service-booking-consent",
    title: "Service Booking + Consent Form",
    category: "Booking & Events",
    description:
      "Booking workflow with client details, appointment preferences, conditional new-client/service requirements, cancellation consent, signature, and office scheduling fields.",
    featureBadges: [
      "Signature",
      "Conditional logic",
      "Office fields",
      "PDF-ready",
    ],
    requiredCapabilities: COMPLETE_WORKFLOW_REQUIREMENTS,
    mode: FormMode.BOOKING,
    status: FormStatus.DRAFT,
    settings: {
      submitButtonText: "Submit Booking Request",
      successMessage: "Thank you. Your booking request has been submitted.",
    },
    getFields: getServiceBookingConsentFields,
  },
  {
    slug: "photography-event-booking-agreement",
    title: "Photography/Event Booking Agreement",
    category: "Booking & Events",
    description:
      "Event booking agreement with client/event details, package selection, reference uploads, portfolio consent, signature, and internal photographer/payment status fields.",
    featureBadges: [
      "Signature",
      "Reference upload",
      "Conditional logic",
      "Office fields",
      "PDF-ready",
    ],
    requiredCapabilities: COMPLETE_WORKFLOW_REQUIREMENTS,
    mode: FormMode.AGREEMENT,
    status: FormStatus.DRAFT,
    settings: {
      submitButtonText: "Submit Booking Agreement",
      successMessage: "Thank you. Your photography/event booking request has been submitted.",
    },
    getFields: getPhotographyEventBookingFields,
  },
];

export function getWorkflowTemplate(slug: string) {
  return WORKFLOW_TEMPLATES.find((template) => template.slug === slug) ?? null;
}
