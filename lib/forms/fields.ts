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

export type FormBuilderField = {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder: string;
  required: boolean;
  order: number;
  options: string[];
  content: string;
  settings: Record<string, unknown>;
};

const SUPPORTED_FIELD_TYPE_SET = new Set<string>(SUPPORTED_FIELD_TYPES);

export const DISPLAY_ONLY_FIELD_TYPES: FormFieldType[] = [
  "static_text",
  "section_heading",
  "html",
];

export function isSupportedFieldType(type: string): type is FormFieldType {
  return SUPPORTED_FIELD_TYPE_SET.has(type);
}

export function fieldTypeLabel(type: FormFieldType) {
  if (type === "html") {
    return "HTML";
  }

  return type
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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
        required: type === "html" ? false : Boolean(field.required),
        order: Number.isFinite(Number(field.order)) ? Number(field.order) : index + 1,
        options: normalizeOptions(field.options),
        content: String(field.content ?? ""),
        settings: isRecord(field.settings) ? field.settings : {},
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

    if (type === "select" && !Array.isArray(rawField.options)) {
      return {
        fields: null,
        error: `Field ${index + 1} needs select options.`,
      };
    }

    ids.add(id);
    fields.push({
      id,
      type,
      label,
      placeholder,
      required: type === "html" ? false : required,
      order,
      options,
      content,
      settings: isRecord(rawField.settings) ? rawField.settings : {},
    });
  }

  return {
    fields: fields
      .sort((first, second) => first.order - second.order)
      .map((field, index) => ({
        ...field,
        order: index + 1,
        options: field.type === "select" ? field.options : [],
      })),
    error: null,
  };
}
