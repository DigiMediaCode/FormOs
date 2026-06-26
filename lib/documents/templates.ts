import "server-only";

export type BusinessDocumentType = "CONTRACT" | "AGREEMENT";

export type BusinessDocumentTemplate = {
  id: string;
  type: BusinessDocumentType;
  title: string;
  description: string;
  scopeOfWork: string;
  terms: string;
  paymentTerms: string;
};

const DISCLAIMER =
  "This template is a starting point and should be reviewed before use. FormOS does not provide legal advice and does not guarantee enforceability in every jurisdiction.";

export const BUSINESS_DOCUMENT_TEMPLATES: BusinessDocumentTemplate[] = [
  {
    id: "website-development-contract",
    type: "CONTRACT",
    title: "Website Development Contract",
    description: "A starter contract for website design, development, and launch work.",
    scopeOfWork:
      "The provider will plan, design, develop, and prepare the agreed website deliverables described in the project proposal or accepted quote. Work may include discovery, page structure, design implementation, content placement, testing, and launch support.",
    terms: `${DISCLAIMER}\n\nThe client will provide timely access, content, approvals, and feedback needed to complete the project. Changes outside the agreed scope may require a written variation and may affect pricing or timelines. Both parties agree to communicate in good faith and keep project materials confidential where appropriate.`,
    paymentTerms:
      "Payment terms should be confirmed before work begins. Any deposits, progress payments, final payments, and late-payment terms should be reviewed and adjusted by the business before sending.",
  },
  {
    id: "service-contract",
    type: "CONTRACT",
    title: "Service Agreement",
    description: "A general service contract for business-to-client project work.",
    scopeOfWork:
      "The provider will perform the services described in the accepted quote, booking, or work order. The client will provide access, information, and approvals reasonably required for delivery.",
    terms: `${DISCLAIMER}\n\nThe service provider will use reasonable care and skill when performing the work. The client agrees to review deliverables promptly and notify the provider of any concerns. Additional work, urgent changes, or out-of-scope requests may require a separate agreement or written approval.`,
    paymentTerms:
      "Fees, deposits, due dates, cancellation terms, and accepted payment methods should be reviewed and completed by the business before use.",
  },
  {
    id: "general-service-agreement",
    type: "AGREEMENT",
    title: "General Service Agreement",
    description: "A plain-language agreement for recurring or one-off services.",
    scopeOfWork:
      "The business will provide the services requested by the client and accepted by the business. Service details, dates, locations, inclusions, and exclusions should be confirmed before work starts.",
    terms: `${DISCLAIMER}\n\nThe client confirms that the information supplied is accurate and that they have authority to request the service. The business may rely on the supplied information when planning work. The parties should confirm cancellation, rescheduling, safety, access, and liability terms before use.`,
    paymentTerms:
      "Payment amount, due date, deposit requirements, and refund or cancellation rules should be reviewed and inserted before sending.",
  },
  {
    id: "rental-booking-agreement",
    type: "AGREEMENT",
    title: "Rental / Booking Agreement",
    description: "A starter agreement for hire, rental, booking, or reservation workflows.",
    scopeOfWork:
      "The business will reserve or provide the requested item, service, venue, session, or booking for the agreed date and period, subject to availability and the business's acceptance.",
    terms: `${DISCLAIMER}\n\nThe client agrees to use any hired item or booked service responsibly, follow instructions supplied by the business, and return or complete the booking in the agreed condition and timeframe. Damage, late return, cancellation, and rescheduling terms should be reviewed and tailored before use.`,
    paymentTerms:
      "Deposit, bond, balance, late fees, damage fees, and cancellation rules should be completed by the business before sending.",
  },
];

export function getDocumentTemplate(templateId: string | null | undefined) {
  if (!templateId) {
    return null;
  }

  return BUSINESS_DOCUMENT_TEMPLATES.find((template) => template.id === templateId) ?? null;
}

export function documentTypeLabel(type: BusinessDocumentType) {
  return type === "CONTRACT" ? "Contract" : "Agreement";
}

export function documentTypePluralLabel(type: BusinessDocumentType) {
  return type === "CONTRACT" ? "Contracts" : "Agreements";
}

export function documentBasePath(type: BusinessDocumentType) {
  return type === "CONTRACT" ? "/dashboard/contracts" : "/dashboard/agreements";
}
