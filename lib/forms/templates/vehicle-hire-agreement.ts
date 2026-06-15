import { FormMode, FormStatus } from "@prisma/client";
import {
  defaultConditionalLogic,
  type FieldConditionalLogic,
} from "@/lib/forms/conditional-logic";
import type { FormBuilderField, FormFieldType, FormFieldVisibility } from "@/lib/forms/fields";

export const VEHICLE_HIRE_AGREEMENT_TEMPLATE = {
  title: "Vehicle Hire Agreement",
  description:
    "Vehicle hire agreement template with public driver details, ID uploads, acknowledgements, signatures, and office-use-only handover fields.",
  mode: FormMode.AGREEMENT,
  status: FormStatus.DRAFT,
  settings: {
    submitButtonText: "Submit Agreement",
    successMessage: "Thank you. Your agreement has been submitted.",
  },
};

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
  settings?: Record<string, unknown>;
};

function createTemplateFields(items: TemplateFieldInput[]): FormBuilderField[] {
  return items.map((item, index) => ({
    id: item.id,
    type: item.type,
    label: item.label ?? "",
    placeholder: item.placeholder ?? "",
    required: item.type === "html" ? false : Boolean(item.required),
    order: index + 1,
    options: item.type === "select" ? item.options ?? [] : [],
    content: item.content ?? "",
    conditionalLogic: item.conditionalLogic ?? defaultConditionalLogic(),
    settings: item.settings ?? {},
    visibility: item.visibility ?? "PUBLIC",
  }));
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
    placeholder?: string;
    required?: boolean;
    options?: string[];
    visibility?: FormFieldVisibility;
    conditionalLogic?: FieldConditionalLogic;
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

export function getVehicleHireAgreementFields() {
  return createTemplateFields([
    section("driver-details-section", "Driver Details"),
    html(
      "driver-details-intro",
      "Driver declaration",
      "<p>Please complete your driver details accurately. The form owner should review this template and adjust the wording before publishing.</p>",
    ),
    input("today-date", "date", "Today's date"),
    input("full-name", "text", "Full name", {
      placeholder: "Enter your full legal name",
    }),
    input("date-of-birth", "date", "Date of birth"),
    input("mobile-number", "phone", "Mobile number", {
      placeholder: "Enter your best contact number",
    }),
    input("driving-licence-number", "text", "Driving licence number", {
      placeholder: "Enter your licence number",
    }),
    input("driver-email", "email", "Email", {
      placeholder: "you@example.com",
    }),
    input("driver-address", "address", "Address", {
      placeholder: "Enter your residential address",
    }),
    input("driver-details-signature", "signature", "Driver signature 1 - Driver details/oath"),

    section("id-uploads-section", "ID Uploads"),
    html(
      "id-uploads-notice",
      "ID upload notice",
      "<p>Upload clear images or PDF copies of the requested identification documents. Uploaded files are handled through the form owner's connected Google Drive.</p>",
    ),
    input("licence-front-upload", "image_upload", "Driver licence front upload"),
    input("licence-back-upload", "image_upload", "Driver licence back upload"),
    input("additional-id-upload", "image_upload", "Additional ID upload"),
    input("supporting-document-upload", "image_upload", "Optional supporting document upload", {
      required: false,
    }),

    section("payment-bond-section", "Payment and Bond Details"),
    html(
      "payment-bond-text",
      "Payment details note",
      "<p>These details help the form owner reconcile rental, bond, or refund payments. Do not include card numbers or passwords.</p>",
    ),
    input("bsb-number", "text", "BSB number", {
      placeholder: "Enter BSB",
    }),
    input("account-number", "text", "Account number", {
      placeholder: "Enter account number",
    }),

    section("emergency-contact-section", "Emergency Contact / Reference"),
    input("emergency-contact-name", "text", "Emergency contact name"),
    input("emergency-contact-phone", "phone", "Emergency contact phone"),
    input("emergency-contact-address", "address", "Emergency contact address"),

    section("additional-driver-section", "Additional Driver"),
    input("has-additional-driver", "select", "Will there be an additional driver?", {
      options: ["No", "Yes"],
    }),
    input("additional-driver-name", "text", "Additional driver full name", {
      conditionalLogic: {
        enabled: true,
        action: "SHOW",
        sourceFieldId: "has-additional-driver",
        operator: "EQUALS",
        value: "Yes",
      },
    }),
    input("additional-driver-licence", "text", "Additional driver licence number", {
      conditionalLogic: {
        enabled: true,
        action: "SHOW",
        sourceFieldId: "has-additional-driver",
        operator: "EQUALS",
        value: "Yes",
      },
    }),
    input("additional-driver-licence-upload", "image_upload", "Additional driver licence upload", {
      conditionalLogic: {
        enabled: true,
        action: "SHOW",
        sourceFieldId: "has-additional-driver",
        operator: "EQUALS",
        value: "Yes",
      },
    }),

    section("recent-offence-section", "Recent Driving Offences"),
    input("has-recent-offence", "select", "Have you had recent driving offences or licence restrictions?", {
      options: ["No", "Yes"],
    }),
    input("recent-offence-details", "textarea", "Recent offence or restriction details", {
      conditionalLogic: {
        enabled: true,
        action: "SHOW",
        sourceFieldId: "has-recent-offence",
        operator: "EQUALS",
        value: "Yes",
      },
    }),

    section("etag-toll-section", "E-Tag / Toll Notice"),
    html(
      "etag-toll-text",
      "E-Tag and toll notice",
      "<p>The hirer may be responsible for tolls, e-tag charges, and related administration costs incurred during the rental period. [Owner should review this clause with a legal professional before use.]</p>",
    ),

    section("accident-access-fee-section", "Accident Access Fee Consent"),
    html(
      "accident-access-fee-text",
      "Accident access fee content",
      "<p>The hirer acknowledges that an accident access fee or insurance excess may apply in some circumstances. Amounts, triggers, and exclusions should be clearly stated by the owner before publication. [Owner should review this clause with a legal professional before use.]</p>",
    ),
    input("accident-access-fee-consent", "checkbox", "I acknowledge the accident access fee terms."),
    input("accident-access-fee-signature", "signature", "Driver signature 2 - Accident access fee consent"),

    section("accident-criteria-section", "Accident Criteria"),
    html(
      "accident-criteria-text",
      "Accident criteria content",
      "<p>The hirer agrees to promptly report accidents, damage, or safety issues to the form owner and relevant authorities where required. [Owner should review this clause with a legal professional before use.]</p>",
    ),

    section("kilometre-restriction-section", "Kilometre Restriction Conditions"),
    html(
      "kilometre-restriction-text",
      "Kilometre restriction content",
      "<p>The hire may include kilometre limits, location restrictions, or additional charges for excess use. These limits should be completed by the owner before publication.</p>",
    ),
    input("kilometre-restriction-consent", "checkbox", "I acknowledge the kilometre restriction conditions."),
    input("kilometre-accident-criteria-signature", "signature", "Driver signature 3 - Kilometre/accident criteria consent"),

    section("maintenance-responsibility-section", "Vehicle Maintenance Responsibility"),
    html(
      "maintenance-responsibility-text",
      "Vehicle maintenance content",
      "<p>The hirer agrees to use the vehicle responsibly, monitor basic warning indicators, and promptly report maintenance concerns. The owner should clarify servicing, tyre, fluid, and roadside assistance responsibilities before use.</p>",
    ),
    input("maintenance-responsibility-consent", "checkbox", "I acknowledge the vehicle maintenance responsibility terms."),

    section("breach-return-section", "Breach of Contract / Return Notice"),
    html(
      "breach-return-text",
      "Breach and return notice content",
      "<p>If the agreement is breached or the vehicle is not returned as agreed, the owner may take reasonable steps available under the agreement and applicable law. Avoid punitive or unclear wording. [Owner should review this clause with a legal professional before use.]</p>",
    ),
    input("breach-return-consent", "checkbox", "I acknowledge the breach of contract and return notice terms."),
    input("breach-return-signature", "signature", "Driver signature 4 - Breach/return notice consent"),

    section("social-media-fraud-section", "Social Media / Fraud Reporting Consent"),
    html(
      "social-media-fraud-text",
      "Social media and fraud reporting content",
      "<p>This placeholder should be edited carefully. Any fraud, bad debt, criminal allegation, or public reporting wording must comply with privacy, defamation, credit reporting, and consumer law obligations. [Owner should review this clause with a legal professional before use.]</p>",
    ),

    section("traffic-offence-section", "Traffic Offence Responsibility"),
    html(
      "traffic-offence-text",
      "Traffic offence responsibility content",
      "<p>The hirer may be responsible for traffic fines, infringements, penalties, tolls, and charges incurred while the vehicle is in their possession, subject to applicable law and the final agreement terms.</p>",
    ),
    input("traffic-offence-consent", "checkbox", "I acknowledge traffic offence responsibility."),
    input("traffic-offence-signature", "signature", "Driver signature 5 - Traffic offence responsibility"),

    section("vehicle-rental-handover-section", "Vehicle Rental / Handover Details"),
    html(
      "vehicle-rental-handover-text",
      "Vehicle rental and handover note",
      "<p>The following vehicle and handover fields are for office use only and will not appear on the public form.</p>",
    ),
    input("office-vehicle-registration", "text", "Vehicle registration", {
      visibility: "OFFICE",
    }),
    input("office-vehicle-make-model", "text", "Vehicle make/model", {
      visibility: "OFFICE",
    }),
    input("office-pickup-date", "date", "Vehicle pickup date", {
      visibility: "OFFICE",
    }),
    input("office-pickup-time", "text", "Vehicle pickup time", {
      placeholder: "Example: 10:30 AM",
      visibility: "OFFICE",
    }),
    input("office-return-date", "date", "Vehicle return date", {
      visibility: "OFFICE",
    }),
    input("office-weekly-rent", "currency", "Weekly rent", {
      visibility: "OFFICE",
    }),
    input("office-bond-amount", "currency", "Bond amount", {
      visibility: "OFFICE",
    }),
    input("office-total-cash-received", "currency", "Total cash received", {
      visibility: "OFFICE",
    }),
    input("office-total-transferred", "currency", "Total transferred", {
      visibility: "OFFICE",
    }),
    input("office-total-deposited", "currency", "Total deposited", {
      visibility: "OFFICE",
    }),
    input("office-insurance-details", "textarea", "Insurance details", {
      visibility: "OFFICE",
    }),
    input("office-clean-washed-status", "select", "Vehicle clean/washed status", {
      options: ["Clean and washed", "Requires cleaning", "Not checked"],
      visibility: "OFFICE",
    }),
    input("office-fuel-level", "select", "Vehicle fuel level", {
      options: ["Full", "3/4", "1/2", "1/4", "Empty", "Not checked"],
      visibility: "OFFICE",
    }),
    input("office-notes", "textarea", "Office notes", {
      required: false,
      visibility: "OFFICE",
    }),
    input("office-staff-name", "text", "Staff name", {
      visibility: "OFFICE",
    }),
    input("office-approval-status", "select", "Office approval status", {
      options: ["Pending review", "Approved", "Rejected", "Needs follow-up"],
      visibility: "OFFICE",
    }),

    section("final-agreement-section", "Final Agreement and Signature"),
    html(
      "final-agreement-text",
      "Final agreement content",
      "<p>By submitting this form, the hirer confirms the information provided is accurate and acknowledges the agreement terms presented in this template, as edited by the form owner before publication. [Owner should review all clauses with a legal professional before use.]</p>",
    ),
    input("final-terms-acceptance", "checkbox", "I accept the final agreement terms."),
    input("final-driver-initials", "initials", "Driver initials"),
    input("final-driver-signature", "signature", "Final driver signature"),
  ]);
}
