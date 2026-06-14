import type { FormBuilderField, FormFieldType } from "@/lib/forms/fields";

export const CONDITIONAL_LOGIC_ACTIONS = ["SHOW", "HIDE"] as const;
export const CONDITIONAL_LOGIC_OPERATORS = [
  "EQUALS",
  "NOT_EQUALS",
  "CONTAINS",
  "IS_EMPTY",
  "IS_NOT_EMPTY",
  "GREATER_THAN",
  "LESS_THAN",
] as const;

export type ConditionalLogicAction = (typeof CONDITIONAL_LOGIC_ACTIONS)[number];
export type ConditionalLogicOperator = (typeof CONDITIONAL_LOGIC_OPERATORS)[number];

export type FieldConditionalLogic = {
  enabled: boolean;
  action: ConditionalLogicAction;
  sourceFieldId: string;
  operator: ConditionalLogicOperator;
  value?: string;
};

export const CONDITIONAL_SOURCE_FIELD_TYPES: FormFieldType[] = [
  "text",
  "textarea",
  "email",
  "phone",
  "number",
  "currency",
  "date",
  "select",
  "checkbox",
];

export const NUMBER_CONDITIONAL_OPERATORS: ConditionalLogicOperator[] = [
  "GREATER_THAN",
  "LESS_THAN",
];

export function operatorNeedsValue(operator: ConditionalLogicOperator) {
  return !["IS_EMPTY", "IS_NOT_EMPTY"].includes(operator);
}

export function defaultConditionalLogic(): FieldConditionalLogic {
  return {
    enabled: false,
    action: "SHOW",
    sourceFieldId: "",
    operator: "EQUALS",
    value: "",
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isConditionalAction(value: string): value is ConditionalLogicAction {
  return (CONDITIONAL_LOGIC_ACTIONS as readonly string[]).includes(value);
}

function isConditionalOperator(value: string): value is ConditionalLogicOperator {
  return (CONDITIONAL_LOGIC_OPERATORS as readonly string[]).includes(value);
}

export function normalizeConditionalLogic(value: unknown): FieldConditionalLogic {
  if (!isRecord(value)) {
    return defaultConditionalLogic();
  }

  const action = String(value.action ?? "SHOW").toUpperCase();
  const operator = String(value.operator ?? "EQUALS").toUpperCase();

  return {
    enabled: Boolean(value.enabled),
    action: isConditionalAction(action) ? action : "SHOW",
    sourceFieldId: String(value.sourceFieldId ?? "").trim(),
    operator: isConditionalOperator(operator) ? operator : "EQUALS",
    value:
      value.value === undefined || value.value === null
        ? ""
        : String(value.value).trim(),
  };
}

export function isConditionalSourceField(field: FormBuilderField) {
  return (
    field.visibility === "PUBLIC" &&
    CONDITIONAL_SOURCE_FIELD_TYPES.includes(field.type)
  );
}

export function conditionalRuleCount(fields: Pick<FormBuilderField, "conditionalLogic">[]) {
  return fields.filter((field) => field.conditionalLogic?.enabled).length;
}

export function normalizeConditionalValue(value: unknown) {
  if (typeof value === "boolean") {
    return value ? "true" : "";
  }

  if (typeof value === "number") {
    return String(value);
  }

  return String(value ?? "").trim();
}

export function conditionMatches(
  logic: FieldConditionalLogic,
  answers: Record<string, unknown>,
) {
  const actual = normalizeConditionalValue(answers[logic.sourceFieldId]);
  const expected = normalizeConditionalValue(logic.value);
  const actualLower = actual.toLowerCase();
  const expectedLower = expected.toLowerCase();

  switch (logic.operator) {
    case "EQUALS":
      return actualLower === expectedLower;
    case "NOT_EQUALS":
      return actualLower !== expectedLower;
    case "CONTAINS":
      return expectedLower.length > 0 && actualLower.includes(expectedLower);
    case "IS_EMPTY":
      return actual.length === 0;
    case "IS_NOT_EMPTY":
      return actual.length > 0;
    case "GREATER_THAN": {
      const actualNumber = Number(actual);
      const expectedNumber = Number(expected);
      return Number.isFinite(actualNumber) &&
        Number.isFinite(expectedNumber) &&
        actualNumber > expectedNumber;
    }
    case "LESS_THAN": {
      const actualNumber = Number(actual);
      const expectedNumber = Number(expected);
      return Number.isFinite(actualNumber) &&
        Number.isFinite(expectedNumber) &&
        actualNumber < expectedNumber;
    }
    default:
      return false;
  }
}

export function isFieldVisible(
  field: { conditionalLogic?: FieldConditionalLogic },
  answers: Record<string, unknown>,
) {
  const logic = field.conditionalLogic;

  if (!logic?.enabled) {
    return true;
  }

  const matches = conditionMatches(logic, answers);

  return logic.action === "SHOW" ? matches : !matches;
}
