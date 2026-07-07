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

/**
 * Shared field-building helpers used by every workflow template (the hand-built
 * vertical templates and the config-driven trade templates). Keeping them in one
 * place means all templates produce identical `FormBuilderField` structures.
 */

export type TemplateFieldInput = {
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

export function createTemplateFields(
  items: TemplateFieldInput[],
): FormBuilderField[] {
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

export function condition(
  sourceFieldId: string,
  value: string,
): FieldConditionalLogic {
  return {
    enabled: true,
    action: "SHOW",
    sourceFieldId,
    operator: "EQUALS",
    value,
  };
}

export function section(
  id: string,
  label: string,
  visibility: FormFieldVisibility = "PUBLIC",
): TemplateFieldInput {
  return {
    id,
    type: "section_heading",
    label,
    content: label,
    visibility,
  };
}

export function html(
  id: string,
  label: string,
  content: string,
  visibility: FormFieldVisibility = "PUBLIC",
): TemplateFieldInput {
  return {
    id,
    type: "html",
    label,
    content,
    visibility,
  };
}

export function conditionalHtml(
  id: string,
  label: string,
  content: string,
  conditionalLogic: FieldConditionalLogic,
  visibility: FormFieldVisibility = "PUBLIC",
): TemplateFieldInput {
  return {
    id,
    type: "html",
    label,
    content,
    conditionalLogic,
    visibility,
  };
}

export function input(
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
): TemplateFieldInput {
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

export function legalNotice(): TemplateFieldInput {
  return html(
    "template-legal-notice",
    "Template review notice",
    "<p>This template is a starting point only. The business owner should review all wording, operational details, and legal suitability before publishing. FormOS does not guarantee legal enforceability in every jurisdiction.</p>",
  );
}
