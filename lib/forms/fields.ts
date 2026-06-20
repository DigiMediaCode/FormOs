import {
  CONDITIONAL_SOURCE_FIELD_TYPES,
  NUMBER_CONDITIONAL_OPERATORS,
  normalizeConditionalLogic,
  operatorNeedsValue,
  type FieldConditionalLogic,
} from "@/lib/forms/conditional-logic";

export const SUPPORTED_FIELD_TYPES = [
  "text",
  "textarea",
  "date",
  "phone",
  "email",
  "address",
  "number",
  "currency",
  "select",
  "checkbox",
  "image_upload",
  "signature",
  "initials",
  "static_text",
  "section_heading",
  "html",
] as const;

export type FormFieldType = (typeof SUPPORTED_FIELD_TYPES)[number];
export const FIELD_VISIBILITIES = ["PUBLIC", "OFFICE"] as const;
export type FormFieldVisibility = (typeof FIELD_VISIBILITIES)[number];

export type FormBuilderField = {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder: string;
  required: boolean;
  order: number;
  options: string[];
  content: string;
  conditionalLogic: FieldConditionalLogic;
  settings: Record<string, unknown>;
  visibility: FormFieldVisibility;
};

const SUPPORTED_FIELD_TYPE_SET = new Set<string>(SUPPORTED_FIELD_TYPES);
const FIELD_VISIBILITY_SET = new Set<string>(FIELD_VISIBILITIES);

export const DISPLAY_ONLY_FIELD_TYPES: FormFieldType[] = [
  "static_text",
  "section_heading",
  "html",
];

export const OPTION_FIELD_TYPES: FormFieldType[] = ["select", "checkbox"];

export function fieldSupportsOptions(type: FormFieldType) {
  return OPTION_FIELD_TYPES.includes(type);
}

export function isSupportedFieldType(type: string): type is FormFieldType {
  return SUPPORTED_FIELD_TYPE_SET.has(type);
}

export function isSupportedFieldVisibility(
  visibility: string,
): visibility is FormFieldVisibility {
  return FIELD_VISIBILITY_SET.has(visibility);
}

export function isPublicField(field: FormBuilderField) {
  return field.visibility === "PUBLIC";
}

export function isOfficeField(field: FormBuilderField) {
  return field.visibility === "OFFICE";
}

export function fieldTypeLabel(type: FormFieldType) {
  const labels: Record<FormFieldType, string> = {
    text: "Text",
    textarea: "Long Text",
    date: "Date",
    phone: "Phone",
    email: "Email",
    address: "Address",
    number: "Number",
    currency: "Currency",
    select: "Dropdown",
    checkbox: "Checkbox",
    image_upload: "File Upload",
    signature: "Signature",
    initials: "Initials",
    static_text: "Static Text",
    section_heading: "Section Heading",
    html: "HTML Content",
  };

  return labels[type];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeOptions(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((option) => String(option).trim())
    .filter((option) => option.length > 0);
}

export function normalizeFormFields(value: unknown): FormBuilderField[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((field, index) => {
      const type = String(field.type ?? "text");

      if (!isSupportedFieldType(type)) {
        return null;
      }

      return {
        id: String(field.id ?? ""),
        type,
        label: String(field.label ?? ""),
        placeholder: String(field.placeholder ?? ""),
        required: DISPLAY_ONLY_FIELD_TYPES.includes(type) ? false : Boolean(field.required),
        order: Number.isFinite(Number(field.order)) ? Number(field.order) : index + 1,
        options: normalizeOptions(field.options),
        content: String(field.content ?? ""),
        conditionalLogic: normalizeConditionalLogic(field.conditionalLogic),
        settings: isRecord(field.settings) ? field.settings : {},
        visibility: isSupportedFieldVisibility(String(field.visibility ?? "PUBLIC"))
          ? String(field.visibility ?? "PUBLIC") as FormFieldVisibility
          : "PUBLIC",
      };
    })
    .filter((field): field is FormBuilderField => field !== null)
    .sort((first, second) => first.order - second.order)
    .map((field, index) => ({
      ...field,
      order: index + 1,
    }));
}

export function validateFormFields(value: unknown) {
  if (!Array.isArray(value)) {
    return {
      fields: null,
      error: "Fields must be an array.",
    };
  }

  const ids = new Set<string>();
  const fields: FormBuilderField[] = [];

  for (const [index, rawField] of value.entries()) {
    if (!isRecord(rawField)) {
      return {
        fields: null,
        error: `Field ${index + 1} is invalid.`,
      };
    }

    const id = String(rawField.id ?? "").trim();
    const type = String(rawField.type ?? "").trim();
    const label = String(rawField.label ?? "").trim();
    const placeholder = String(rawField.placeholder ?? "").trim();
    const required = rawField.required;
    const order = Number(rawField.order);
    const content = String(rawField.content ?? "").trim();
    const visibility = String(rawField.visibility ?? "PUBLIC").trim();

    if (!id) {
      return {
        fields: null,
        error: `Field ${index + 1} is missing an id.`,
      };
    }

    if (ids.has(id)) {
      return {
        fields: null,
        error: `Field ${index + 1} has a duplicate id.`,
      };
    }

    if (!isSupportedFieldType(type)) {
      return {
        fields: null,
        error: `Field ${index + 1} has an unsupported type.`,
      };
    }

    if (typeof required !== "boolean") {
      return {
        fields: null,
        error: `Field ${index + 1} has an invalid required value.`,
      };
    }

    if (!Number.isInteger(order) || order < 1) {
      return {
        fields: null,
        error: `Field ${index + 1} has an invalid order.`,
      };
    }

    if (!isSupportedFieldVisibility(visibility)) {
      return {
        fields: null,
        error: `Field ${index + 1} has an invalid visibility value.`,
      };
    }

    if (
      type !== "static_text" &&
      type !== "html" &&
      !label &&
      !(type === "section_heading" && content)
    ) {
      return {
        fields: null,
        error: `Field ${index + 1} needs a label.`,
      };
    }

    const options = normalizeOptions(rawField.options);

    if (fieldSupportsOptions(type) && !Array.isArray(rawField.options)) {
      return {
        fields: null,
        error: `Field ${index + 1} needs options.`,
      };
    }

    ids.add(id);
    fields.push({
      id,
      type,
      label,
      placeholder,
      required: DISPLAY_ONLY_FIELD_TYPES.includes(type) ? false : required,
      order,
      options,
      content,
      conditionalLogic: normalizeConditionalLogic(rawField.conditionalLogic),
      settings: isRecord(rawField.settings) ? rawField.settings : {},
      visibility,
    });
  }

  const fieldById = new Map(fields.map((field) => [field.id, field]));

  for (const field of fields) {
    const logic = field.conditionalLogic;

    if (!logic.enabled) {
      continue;
    }

    if (!logic.sourceFieldId) {
      return {
        fields: null,
        error: `${field.label || field.id} needs a source field for conditional visibility.`,
      };
    }

    if (logic.sourceFieldId === field.id) {
      return {
        fields: null,
        error: `${field.label || field.id} cannot depend on itself.`,
      };
    }

    const sourceField = fieldById.get(logic.sourceFieldId);

    if (!sourceField) {
      return {
        fields: null,
        error: `${field.label || field.id} has an invalid conditional source field.`,
      };
    }

    if (
      sourceField.visibility !== "PUBLIC" ||
      !CONDITIONAL_SOURCE_FIELD_TYPES.includes(sourceField.type)
    ) {
      return {
        fields: null,
        error: `${field.label || field.id} must use a public input field as its conditional source.`,
      };
    }

    if (
      NUMBER_CONDITIONAL_OPERATORS.includes(logic.operator) &&
      !["number", "currency"].includes(sourceField.type)
    ) {
      return {
        fields: null,
        error: `${field.label || field.id} can only use number comparisons with number or currency source fields.`,
      };
    }

    if (operatorNeedsValue(logic.operator) && !logic.value) {
      return {
        fields: null,
        error: `${field.label || field.id} needs a condition value.`,
      };
    }
  }

  return {
    fields: fields
      .sort((first, second) => first.order - second.order)
      .map((field, index) => ({
        ...field,
        order: index + 1,
        options: fieldSupportsOptions(field.type) ? field.options : [],
      })),
    error: null,
  };
}
