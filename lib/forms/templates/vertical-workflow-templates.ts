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
  category:
    | "Rental & Hire"
    | "Trades & Services"
    | "Booking & Events"
    | "Healthcare & Clinics";
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

function healthcareDisclaimer() {
  return html(
    "healthcare-administrative-disclaimer",
    "Healthcare workflow disclaimer",
    "<p>This form is for administrative workflow purposes only. It is not an emergency medical service, electronic medical record system, practice management system, or substitute for professional clinical advice.</p><p>Templates are starting points and should be reviewed and configured by the healthcare provider before use.</p>",
  );
}

function getGpAppointmentRequestFields() {
  return createTemplateFields([
    healthcareDisclaimer(),
    html(
      "emergency-notice",
      "Emergency notice",
      "<p><strong>If this is an emergency in Australia, call 000.</strong></p>",
    ),
    section("patient-section", "Patient Details"),
    input("patient-full-name", "text", "Patient full name"),
    input("date-of-birth", "date", "Date of birth"),
    input("patient-phone", "phone", "Phone"),
    input("patient-email", "email", "Email"),

    section("appointment-section", "Appointment Request"),
    input("preferred-appointment-date", "date", "Preferred appointment date"),
    input("preferred-appointment-time", "text", "Preferred appointment time", {
      placeholder: "Example: Morning, 2:30 PM, after work",
    }),
    input("new-or-existing-patient", "select", "New or existing patient?", {
      options: ["New patient", "Existing patient"],
    }),
    input("how-heard-about-clinic", "text", "How did you hear about us?", {
      required: false,
      conditionalLogic: condition("new-or-existing-patient", "New patient"),
    }),
    input("reason-for-visit", "textarea", "Reason for visit", {
      placeholder: "Briefly describe the appointment reason. Do not include detailed medical records.",
    }),
    input("is-urgent", "select", "Is this urgent?", {
      options: ["No", "Yes"],
    }),
    {
      id: "urgent-warning",
      type: "html" as const,
      label: "Urgent care warning",
      content:
        "<p><strong>This form is not monitored for emergencies. If this is an emergency in Australia, call 000.</strong></p>",
      conditionalLogic: condition("is-urgent", "Yes"),
    },

    section("contact-consent-section", "Contact Consent"),
    input("contact-consent", "checkbox", "I consent to be contacted about this appointment request."),
    input(
      "emergency-acknowledgement",
      "checkbox",
      "I understand this form is not for emergencies. If this is an emergency in Australia, I will call 000.",
    ),

    section("office-section", "Office Processing", "OFFICE"),
    input("office-appointment-status", "select", "Appointment status", {
      options: ["New request", "Contacted", "Confirmed", "Declined", "Needs follow-up"],
      visibility: "OFFICE",
    }),
    input("office-assigned-practitioner", "text", "Assigned GP / practitioner", {
      visibility: "OFFICE",
    }),
    input("office-confirmed-date-time", "text", "Confirmed appointment date/time", {
      placeholder: "Example: 4 July 2026, 10:15 AM",
      visibility: "OFFICE",
    }),
    input("office-staff-notes", "textarea", "Staff notes", {
      required: false,
      visibility: "OFFICE",
    }),
    input("office-follow-up-required", "select", "Follow-up required", {
      options: ["No", "Yes"],
      visibility: "OFFICE",
    }),
  ]);
}

function getNewPatientIntakeFields() {
  return createTemplateFields([
    healthcareDisclaimer(),
    section("patient-section", "Patient Details"),
    input("patient-full-name", "text", "Patient full name"),
    input("date-of-birth", "date", "Date of birth"),
    input("patient-phone", "phone", "Phone"),
    input("patient-email", "email", "Email"),
    input("patient-address", "address", "Address"),

    section("emergency-contact-section", "Emergency Contact"),
    input("emergency-contact-name", "text", "Emergency contact name"),
    input("emergency-contact-phone", "phone", "Emergency contact phone"),

    section("administrative-details-section", "Administrative Details"),
    input("medicare-number", "text", "Medicare number (optional)", {
      required: false,
      placeholder: "Optional",
    }),
    input("has-private-insurance", "select", "Do you have private health insurance?", {
      options: ["No", "Yes"],
    }),
    input("private-insurance-details", "text", "Insurer / member number", {
      required: false,
      conditionalLogic: condition("has-private-insurance", "Yes"),
    }),
    input("preferred-pharmacy", "text", "Preferred pharmacy (optional)", {
      required: false,
    }),
    input("reason-for-visit", "textarea", "Reason for visit", {
      placeholder: "Briefly describe the appointment reason. Do not include detailed medical records.",
    }),
    input("has-referral", "select", "Do you have a referral or document to upload?", {
      options: ["No", "Yes"],
    }),
    input("referral-upload", "image_upload", "Referral/document upload", {
      required: false,
      conditionalLogic: condition("has-referral", "Yes"),
    }),

    section("consent-section", "Consent and Privacy"),
    input("contact-consent", "checkbox", "I consent to be contacted about my intake and appointment."),
    input("privacy-acknowledgement", "checkbox", "I acknowledge this form is for administrative intake only."),

    section("office-section", "Office Processing", "OFFICE"),
    input("office-patient-file-created", "select", "Patient file created", {
      options: ["Pending", "Yes", "No"],
      visibility: "OFFICE",
    }),
    input("office-id-checked", "select", "ID checked", {
      options: ["Pending", "Checked", "Not required", "Follow-up needed"],
      visibility: "OFFICE",
    }),
    input("office-referral-received", "select", "Referral received", {
      options: ["No referral", "Received", "Requested", "Not required"],
      visibility: "OFFICE",
    }),
    input("office-intake-reviewed-by", "text", "Intake reviewed by", {
      visibility: "OFFICE",
    }),
    input("office-internal-notes", "textarea", "Internal notes", {
      required: false,
      visibility: "OFFICE",
    }),
  ]);
}

function getPatientConsentProcedureAcknowledgementFields() {
  return createTemplateFields([
    healthcareDisclaimer(),
    section("patient-section", "Patient Details"),
    input("patient-full-name", "text", "Patient full name"),
    input("date-of-birth", "date", "Date of birth"),
    input("patient-phone", "phone", "Phone"),
    input("patient-email", "email", "Email"),

    section("procedure-section", "Consent / Procedure Acknowledgement"),
    input("procedure-name", "text", "Service/procedure name"),
    html(
      "consent-statement",
      "Consent statement",
      "<p>The patient acknowledges that the clinic or practitioner has provided information about the service or procedure, including relevant administrative instructions, risks, alternatives, and follow-up steps as appropriate. The clinic should review and customize this wording before use.</p>",
    ),
    input(
      "information-acknowledgement",
      "checkbox",
      "I acknowledge that information about the service/procedure has been provided to me.",
    ),
    input("questions-concerns", "textarea", "Questions or concerns", {
      required: false,
      placeholder: "Optional questions or concerns for the clinic to review.",
    }),
    input("patient-signature", "signature", "Patient signature"),
    input("signature-date", "date", "Date"),

    section("office-section", "Office Processing", "OFFICE"),
    input("office-reviewed", "select", "Staff/practitioner reviewed", {
      options: ["Pending", "Reviewed", "Needs follow-up"],
      visibility: "OFFICE",
    }),
    input("office-consent-accepted", "select", "Consent accepted", {
      options: ["Pending", "Accepted", "Not accepted", "Needs clarification"],
      visibility: "OFFICE",
    }),
    input("office-practitioner-name", "text", "Practitioner name", {
      visibility: "OFFICE",
    }),
    input("office-internal-notes", "textarea", "Internal notes", {
      required: false,
      visibility: "OFFICE",
    }),
  ]);
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
  {
    slug: "gp-appointment-request",
    title: "GP Appointment Request Form",
    category: "Healthcare & Clinics",
    description:
      "Healthcare-safe appointment request workflow for patient contact details, preferred appointment time, urgent-care acknowledgement, and office scheduling fields.",
    featureBadges: [
      "Booking",
      "Conditional logic",
      "Office fields",
      "Healthcare admin",
    ],
    requiredCapabilities: COMPLETE_WORKFLOW_REQUIREMENTS,
    mode: FormMode.BOOKING,
    status: FormStatus.DRAFT,
    settings: {
      submitButtonText: "Request Appointment",
      successMessage:
        "Thank you. Your appointment request has been submitted and the clinic will review it.",
    },
    getFields: getGpAppointmentRequestFields,
  },
  {
    slug: "new-patient-intake",
    title: "New Patient Intake Form",
    category: "Healthcare & Clinics",
    description:
      "Administrative intake workflow for basic patient details, emergency contact, optional referral upload, privacy acknowledgement, and internal review fields.",
    featureBadges: [
      "File upload",
      "Conditional logic",
      "Office fields",
      "PDF-ready",
    ],
    requiredCapabilities: COMPLETE_WORKFLOW_REQUIREMENTS,
    mode: FormMode.BOOKING,
    status: FormStatus.DRAFT,
    settings: {
      submitButtonText: "Submit Intake Form",
      successMessage:
        "Thank you. Your intake form has been submitted for administrative review.",
    },
    getFields: getNewPatientIntakeFields,
  },
  {
    slug: "patient-consent-procedure-acknowledgement",
    title: "Patient Consent / Procedure Acknowledgement Form",
    category: "Healthcare & Clinics",
    description:
      "Administrative consent acknowledgement workflow with patient details, service/procedure acknowledgement, questions, signature, and practitioner review fields.",
    featureBadges: [
      "Signature",
      "Agreement",
      "Office fields",
      "PDF-ready",
    ],
    requiredCapabilities: COMPLETE_WORKFLOW_REQUIREMENTS,
    mode: FormMode.AGREEMENT,
    status: FormStatus.DRAFT,
    settings: {
      submitButtonText: "Submit Acknowledgement",
      successMessage:
        "Thank you. Your acknowledgement has been submitted for clinic review.",
    },
    getFields: getPatientConsentProcedureAcknowledgementFields,
  },
];

export function getWorkflowTemplate(slug: string) {
  return WORKFLOW_TEMPLATES.find((template) => template.slug === slug) ?? null;
}
