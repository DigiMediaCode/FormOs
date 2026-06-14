"use client";

import type { DragEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  CircleDollarSign,
  FileText,
  GripVertical,
  Hash,
  Heading,
  ImageUp,
  Mail,
  MapPin,
  MousePointer2,
  PenLine,
  Phone,
  Plus,
  Rows3,
  SquareCheck,
  Trash2,
  Type,
} from "lucide-react";
import {
  defaultConditionalLogic,
  isConditionalSourceField,
  NUMBER_CONDITIONAL_OPERATORS,
  operatorNeedsValue,
  type ConditionalLogicOperator,
} from "@/lib/forms/conditional-logic";
import {
  DISPLAY_ONLY_FIELD_TYPES,
  fieldTypeLabel,
  type FormBuilderField,
  type FormFieldType,
} from "@/lib/forms/fields";
import { SubmitButton } from "@/components/ui/submit-button";
import { sanitizeFormHtml } from "@/lib/forms/sanitize-html";

type FormBuilderEditorProps = {
  formId: string;
  initialFields: FormBuilderField[];
  allowedFieldTypes: FormFieldType[] | null;
  allowConditionalLogic: boolean;
  maxConditionalRules: number | null;
  saveAction: (formData: FormData) => void;
};

const PLACEHOLDER_FIELD_TYPES: FormFieldType[] = [
  "text",
  "textarea",
  "date",
  "phone",
  "email",
  "address",
  "number",
  "currency",
];

const CONTENT_FIELD_TYPES: FormFieldType[] = [
  "static_text",
  "section_heading",
  "html",
];

const FIELD_TYPE_GROUPS: { label: string; types: FormFieldType[] }[] = [
  {
    label: "Basic Fields",
    types: ["text", "textarea", "email", "phone", "address", "date", "number", "currency"],
  },
  {
    label: "Choice Fields",
    types: ["select", "checkbox"],
  },
  {
    label: "Agreement Fields",
    types: ["signature", "initials", "static_text", "section_heading", "html"],
  },
  {
    label: "Upload Fields",
    types: ["image_upload"],
  },
];

const FIELD_TYPE_ICONS: Record<FormFieldType, ReactNode> = {
  address: <MapPin className="h-4 w-4" />,
  checkbox: <SquareCheck className="h-4 w-4" />,
  currency: <CircleDollarSign className="h-4 w-4" />,
  date: <Rows3 className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  html: <FileText className="h-4 w-4" />,
  image_upload: <ImageUp className="h-4 w-4" />,
  initials: <PenLine className="h-4 w-4" />,
  number: <Hash className="h-4 w-4" />,
  phone: <Phone className="h-4 w-4" />,
  section_heading: <Heading className="h-4 w-4" />,
  select: <ChevronDown className="h-4 w-4" />,
  signature: <PenLine className="h-4 w-4" />,
  static_text: <Rows3 className="h-4 w-4" />,
  text: <Type className="h-4 w-4" />,
  textarea: <Rows3 className="h-4 w-4" />,
};

const BASE_CONDITIONAL_OPERATORS: Array<{
  label: string;
  value: ConditionalLogicOperator;
}> = [
  { label: "equals", value: "EQUALS" },
  { label: "does not equal", value: "NOT_EQUALS" },
  { label: "contains", value: "CONTAINS" },
  { label: "is empty", value: "IS_EMPTY" },
  { label: "is not empty", value: "IS_NOT_EMPTY" },
];

const NUMBER_CONDITIONAL_OPERATOR_OPTIONS: Array<{
  label: string;
  value: ConditionalLogicOperator;
}> = [
  ...BASE_CONDITIONAL_OPERATORS,
  { label: "is greater than", value: "GREATER_THAN" },
  { label: "is less than", value: "LESS_THAN" },
];

function isDisplayOnlyField(type: FormFieldType) {
  return DISPLAY_ONLY_FIELD_TYPES.includes(type);
}

function createField(type: FormFieldType, order: number): FormBuilderField {
  return {
    id: crypto.randomUUID(),
    type,
    label: fieldTypeLabel(type),
    placeholder: "",
    required: false,
    order,
    options: type === "select" ? ["Option 1", "Option 2"] : [],
    content: "",
    conditionalLogic: defaultConditionalLogic(),
    settings: {},
    visibility: "PUBLIC",
  };
}

function normalizeOrders(fields: FormBuilderField[]) {
  return fields.map((field, index) => ({
    ...field,
    required: isDisplayOnlyField(field.type) ? false : field.required,
    order: index + 1,
  }));
}

function previewInputType(type: FormFieldType) {
  if (type === "phone") {
    return "tel";
  }

  if (type === "currency" || type === "number") {
    return "number";
  }

  if (type === "date" || type === "email") {
    return type;
  }

  return "text";
}

function Badge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "slate" | "teal" | "amber" | "red" | "indigo";
}) {
  const classes = {
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-800",
    red: "border-red-200 bg-red-50 text-red-700",
    slate: "border-slate-200 bg-slate-100 text-slate-700",
    teal: "border-teal-200 bg-teal-50 text-teal-800",
  }[tone];

  return (
    <span className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${classes}`}>
      {children}
    </span>
  );
}

function FieldHelper({ field }: { field: FormBuilderField }) {
  if (field.visibility === "OFFICE") {
    return (
      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
        This field will not appear on the public form. It can be completed by the
        form owner after submission.
      </p>
    );
  }

  if (field.type === "image_upload") {
    return (
      <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-700">
        Uploads require Google Drive or Dropbox to be connected.
      </p>
    );
  }

  if (field.type === "signature" || field.type === "initials") {
    return (
      <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-700">
        Used for signed agreements.
      </p>
    );
  }

  return null;
}

export function FormBuilderEditor({
  allowConditionalLogic,
  allowedFieldTypes,
  initialFields,
  maxConditionalRules,
  saveAction,
}: FormBuilderEditorProps) {
  const firstAllowedFieldType =
    allowedFieldTypes === null ? "text" : allowedFieldTypes[0] ?? "text";
  const [fields, setFields] = useState<FormBuilderField[]>(normalizeOrders(initialFields));
  const [fieldTypeToAdd, setFieldTypeToAdd] =
    useState<FormFieldType>(firstAllowedFieldType);
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null);
  const [draggedFieldType, setDraggedFieldType] = useState<FormFieldType | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [expandedFieldIds, setExpandedFieldIds] = useState<Set<string>>(
    () => new Set(initialFields.length <= 3 ? initialFields.map((field) => field.id) : []),
  );
  const serializedFields = useMemo(() => JSON.stringify(normalizeOrders(fields)), [fields]);
  const disallowedFieldTypes = useMemo(
    () =>
      allowedFieldTypes === null
        ? []
        : [...new Set(fields.map((field) => field.type))]
            .filter((fieldType) => !allowedFieldTypes.includes(fieldType))
            .map(fieldTypeLabel),
    [allowedFieldTypes, fields],
  );
  const conditionalRuleCount = useMemo(
    () => fields.filter((field) => field.conditionalLogic?.enabled).length,
    [fields],
  );

  function isAllowedFieldType(type: FormFieldType) {
    return allowedFieldTypes === null || allowedFieldTypes.includes(type);
  }

  function updateField(fieldId: string, updates: Partial<FormBuilderField>) {
    setFields((currentFields) =>
      normalizeOrders(
        currentFields.map((field) => {
          if (field.id !== fieldId) {
            return field;
          }

          const nextField = {
            ...field,
            ...updates,
          };

          return {
            ...nextField,
            required: isDisplayOnlyField(nextField.type)
              ? false
              : updates.required ?? field.required,
          };
        }),
      ),
    );
  }

  function updateConditionalLogic(
    fieldId: string,
    updates: Partial<FormBuilderField["conditionalLogic"]>,
  ) {
    setFields((currentFields) =>
      normalizeOrders(
        currentFields.map((field) => {
          if (field.id !== fieldId) {
            return field;
          }

          return {
            ...field,
            conditionalLogic: {
              ...defaultConditionalLogic(),
              ...field.conditionalLogic,
              ...updates,
            },
          };
        }),
      ),
    );
  }

  function addField(type = fieldTypeToAdd, targetIndex?: number) {
    if (!isAllowedFieldType(type)) {
      return;
    }

    setFields((currentFields) => {
      const nextFields = [...currentFields];
      const insertIndex =
        typeof targetIndex === "number"
          ? Math.max(0, Math.min(targetIndex, nextFields.length))
          : nextFields.length;
      const newField = createField(type, insertIndex + 1);

      nextFields.splice(insertIndex, 0, newField);
      setExpandedFieldIds((current) => new Set([...current, newField.id]));
      return normalizeOrders(nextFields);
    });
  }

  function moveField(fieldId: string, direction: "up" | "down") {
    setFields((currentFields) => {
      const nextFields = [...currentFields];
      const index = nextFields.findIndex((field) => field.id === fieldId);
      const targetIndex = direction === "up" ? index - 1 : index + 1;

      if (index < 0 || targetIndex < 0 || targetIndex >= nextFields.length) {
        return currentFields;
      }

      [nextFields[index], nextFields[targetIndex]] = [
        nextFields[targetIndex],
        nextFields[index],
      ];

      return normalizeOrders(nextFields);
    });
  }

  function deleteField(fieldId: string) {
    setFields((currentFields) =>
      normalizeOrders(currentFields.filter((field) => field.id !== fieldId)),
    );
    setExpandedFieldIds((current) => {
      const next = new Set(current);
      next.delete(fieldId);
      return next;
    });
  }

  function moveFieldToIndex(fieldId: string, targetIndex: number) {
    setFields((currentFields) => {
      const currentIndex = currentFields.findIndex((field) => field.id === fieldId);

      if (currentIndex < 0) {
        return currentFields;
      }

      const nextFields = [...currentFields];
      const [field] = nextFields.splice(currentIndex, 1);
      const adjustedIndex = currentIndex < targetIndex ? targetIndex - 1 : targetIndex;

      nextFields.splice(Math.max(0, Math.min(adjustedIndex, nextFields.length)), 0, field);
      return normalizeOrders(nextFields);
    });
  }

  function handleDrop(targetIndex: number) {
    if (draggedFieldType) {
      addField(draggedFieldType, targetIndex);
    } else if (draggedFieldId) {
      moveFieldToIndex(draggedFieldId, targetIndex);
    }

    setDraggedFieldId(null);
    setDraggedFieldType(null);
    setDropIndex(null);
  }

  function toggleFieldExpanded(fieldId: string) {
    setExpandedFieldIds((current) => {
      const next = new Set(current);

      if (next.has(fieldId)) {
        next.delete(fieldId);
      } else {
        next.add(fieldId);
      }

      return next;
    });
  }

  function dropIndexFromCardPosition(
    event: DragEvent<HTMLElement>,
    cardIndex: number,
  ) {
    const rect = event.currentTarget.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;

    return event.clientY > midpoint ? cardIndex + 1 : cardIndex;
  }

  function updateSelectOption(fieldId: string, optionIndex: number, value: string) {
    setFields((currentFields) =>
      normalizeOrders(
        currentFields.map((field) =>
          field.id === fieldId
            ? {
                ...field,
                options: field.options.map((option, index) =>
                  index === optionIndex ? value : option,
                ),
              }
            : field,
        ),
      ),
    );
  }

  function addSelectOption(fieldId: string) {
    setFields((currentFields) =>
      normalizeOrders(
        currentFields.map((field) =>
          field.id === fieldId
            ? {
                ...field,
                options: [...field.options, `Option ${field.options.length + 1}`],
              }
            : field,
        ),
      ),
    );
  }

  function removeSelectOption(fieldId: string, optionIndex: number) {
    setFields((currentFields) =>
      normalizeOrders(
        currentFields.map((field) =>
          field.id === fieldId
            ? {
                ...field,
                options: field.options.filter((_, index) => index !== optionIndex),
              }
            : field,
        ),
      ),
    );
  }

  function cleanSelectOptions(fieldId: string) {
    setFields((currentFields) =>
      normalizeOrders(
        currentFields.map((field) =>
          field.id === fieldId
            ? {
                ...field,
                options: field.options
                  .map((option) => option.trim())
                  .filter((option) => option.length > 0),
              }
            : field,
        ),
      ),
    );
  }

  function conditionalSourceOptions(field: FormBuilderField) {
    return fields.filter(
      (sourceField) =>
        sourceField.id !== field.id && isConditionalSourceField(sourceField),
    );
  }

  function conditionalOperatorOptions(sourceFieldId: string) {
    const sourceField = fields.find((field) => field.id === sourceFieldId);

    if (sourceField && ["number", "currency"].includes(sourceField.type)) {
      return NUMBER_CONDITIONAL_OPERATOR_OPTIONS;
    }

    return BASE_CONDITIONAL_OPERATORS;
  }

  return (
    <form action={saveAction} className="grid gap-0 xl:grid-cols-[15rem_minmax(0,1fr)_20rem]">
      <input name="fields" type="hidden" value={serializedFields} />

      <aside className="border-b border-slate-200 bg-white p-3 xl:sticky xl:top-0 xl:h-[calc(100vh-0px)] xl:overflow-y-auto xl:border-b-0 xl:border-r">
        <section className="grid gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-950">
              <Plus className="h-4 w-4 text-blue-600" />
              Add Field
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Drag into the form or click to add.
            </p>
          </div>

          <div className="grid gap-4">
            {FIELD_TYPE_GROUPS.map((group) => (
              <fieldset className="grid gap-2" key={group.label}>
                <legend className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {group.label}
                </legend>
                <div className="grid gap-2">
                  {group.types.map((type) => {
                    const allowed = isAllowedFieldType(type);
                    const selected = fieldTypeToAdd === type;

                    return (
                      <button
                        className={`flex min-w-0 items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-sm font-medium transition ${
                          !allowed
                            ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                            : selected
                              ? "border-blue-300 bg-blue-50 text-blue-900 shadow-sm"
                              : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50"
                        }`}
                        disabled={!allowed}
                        draggable={allowed}
                        key={type}
                        onClick={() => {
                          setFieldTypeToAdd(type);
                          addField(type);
                        }}
                        onDragEnd={() => {
                          setDraggedFieldType(null);
                          setDropIndex(null);
                        }}
                        onDragStart={(event) => {
                          if (!allowed) {
                            return;
                          }

                          event.dataTransfer.effectAllowed = "copy";
                          event.dataTransfer.setData("application/x-formos-field-type", type);
                          setDraggedFieldType(type);
                          setDraggedFieldId(null);
                        }}
                        type="button"
                      >
                        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                          {FIELD_TYPE_ICONS[type]}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{fieldTypeLabel(type)}</span>
                          {!allowed ? (
                            <span className="block truncate text-[11px] font-normal text-amber-700">
                              Upgrade required
                            </span>
                          ) : null}
                        </span>
                        <GripVertical className="h-4 w-4 shrink-0 text-slate-300" />
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
        </section>
      </aside>

      <section className="flex min-w-0 flex-col gap-3 bg-slate-50 p-3 xl:p-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-teal-700">
                Field schema
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">
                Form Fields
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-600">
                Drag fields from the left panel to add them. Drag existing cards
                to set the order.
              </p>
            </div>
            <Badge tone="teal">{fields.length} fields</Badge>
          </div>
        </div>

        {disallowedFieldTypes.length > 0 ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
            This form contains field types that are not included in your current
            plan. Remove them or upgrade your plan before saving. Disallowed
            field types: {disallowedFieldTypes.join(", ")}.
          </p>
        ) : null}

        <div
          className={`rounded-xl border border-dashed p-2 transition ${
            dropIndex === fields.length
              ? "border-blue-400 bg-blue-50"
              : "border-transparent"
          }`}
          onDragOver={(event) => {
            if (draggedFieldId || draggedFieldType) {
              if (event.target !== event.currentTarget) {
                return;
              }

              event.preventDefault();
              setDropIndex(fields.length);
            }
          }}
          onDrop={(event) => {
            if (event.target !== event.currentTarget) {
              return;
            }

            event.preventDefault();
            handleDrop(fields.length);
          }}
        >
        {fields.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
            <MousePointer2 className="mx-auto h-7 w-7 text-blue-500" />
            <p className="text-base font-semibold text-slate-950">
              Drop your first field here
            </p>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-5 text-slate-600">
              Drag a field type from the left panel, or click any field type to
              add it instantly.
            </p>
          </div>
        ) : null}

        {fields.map((field, index) => {
          const supportsPlaceholder = PLACEHOLDER_FIELD_TYPES.includes(field.type);
          const supportsContent = CONTENT_FIELD_TYPES.includes(field.type);
          const isDisplayOnly = isDisplayOnlyField(field.type);
          const isExpanded = expandedFieldIds.has(field.id);
          const sourceOptions = conditionalSourceOptions(field);
          const operatorOptions = conditionalOperatorOptions(
            field.conditionalLogic?.sourceFieldId ?? "",
          );
          const selectedOperatorIsAllowed = operatorOptions.some(
            (operator) => operator.value === field.conditionalLogic?.operator,
          );
          const selectedOperator = selectedOperatorIsAllowed
            ? field.conditionalLogic.operator
            : "EQUALS";

          return (
            <article
              className={`mb-3 overflow-hidden rounded-xl border bg-white shadow-sm transition ${
                draggedFieldId === field.id
                  ? "border-blue-300 opacity-70 shadow-lg"
                  : dropIndex === index
                    ? "border-blue-400 ring-4 ring-blue-100"
                    : "border-slate-200 hover:border-blue-200 hover:shadow-md"
              }`}
              draggable
              key={field.id}
              onDragEnd={() => {
                setDraggedFieldId(null);
                setDropIndex(null);
              }}
              onDragOver={(event) => {
                if (draggedFieldId || draggedFieldType) {
                  event.stopPropagation();
                  event.preventDefault();
                  setDropIndex(dropIndexFromCardPosition(event, index));
                }
              }}
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("application/x-formos-field-id", field.id);
                setDraggedFieldId(field.id);
                setDraggedFieldType(null);
              }}
              onDrop={(event) => {
                event.stopPropagation();
                event.preventDefault();
                handleDrop(dropIndexFromCardPosition(event, index));
              }}
            >
              <div className={`${isExpanded ? "border-b border-slate-200" : ""} bg-white px-4 py-3`}>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 flex-1 gap-2">
                    <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 cursor-grab items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                      <GripVertical className="h-4 w-4" />
                    </span>
                    <button
                      className="min-w-0 flex-1 text-left"
                      onClick={() => toggleFieldExpanded(field.id)}
                      type="button"
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <Badge tone="slate">{fieldTypeLabel(field.type)}</Badge>
                        {field.required ? <Badge tone="red">Required</Badge> : null}
                        {field.visibility === "OFFICE" ? (
                          <Badge tone="amber">Office Use Only</Badge>
                        ) : null}
                        {isDisplayOnly ? <Badge tone="indigo">Display Only</Badge> : null}
                        {field.type === "image_upload" ? (
                          <Badge tone="teal">Upload Field</Badge>
                        ) : null}
                        {field.type === "signature" || field.type === "initials" ? (
                          <Badge tone="teal">Signature Field</Badge>
                        ) : null}
                        {field.conditionalLogic?.enabled ? (
                          <Badge tone="indigo">Conditional</Badge>
                        ) : null}
                      </div>
                      <span className="mt-1 flex min-w-0 items-center gap-2">
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-slate-400 transition ${
                            isExpanded ? "rotate-0" : "-rotate-90"
                          }`}
                        />
                        <span className="truncate text-base font-semibold text-slate-950">
                          {field.label || field.content || fieldTypeLabel(field.type)}
                        </span>
                      </span>
                      {!isExpanded ? (
                        <span className="mt-1 block truncate text-xs text-slate-500">
                          {field.placeholder || field.content || "Collapsed settings"}
                        </span>
                      ) : null}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={index === 0}
                      onClick={() => moveField(field.id, "up")}
                      type="button"
                      title="Move up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={index === fields.length - 1}
                      onClick={() => moveField(field.id, "down")}
                      type="button"
                      title="Move down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-100 bg-white text-red-600 transition hover:bg-red-50"
                      onClick={() => deleteField(field.id)}
                      type="button"
                      title="Delete field"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {isExpanded ? (
              <div className="grid gap-3 p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  {!["static_text", "html"].includes(field.type) ? (
                    <label className="flex flex-col gap-1.5 text-sm font-normal text-slate-700">
                      {field.type === "section_heading" ? "Heading label" : "Field label"}
                      <input
                        className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        onChange={(event) => updateField(field.id, { label: event.target.value })}
                        type="text"
                        value={field.label}
                      />
                    </label>
                  ) : null}

                  {!isDisplayOnly ? (
                    <label className="flex flex-col gap-1.5 text-sm font-normal text-slate-700">
                      Required
                      <span className="flex min-h-10 items-center gap-2 rounded-md border border-slate-300 px-3 py-2">
                        <input
                          checked={field.required}
                          className="h-4 w-4"
                          onChange={(event) =>
                            updateField(field.id, { required: event.target.checked })
                          }
                          type="checkbox"
                        />
                        <span className="text-sm text-slate-600">
                          Require public submitters to complete this field
                        </span>
                      </span>
                    </label>
                  ) : (
                    <div className="flex flex-col gap-1.5 text-sm font-normal text-slate-700">
                      Required
                      <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-5 text-slate-600">
                        Display-only fields do not collect input and cannot be required.
                      </div>
                    </div>
                  )}

                  <label className="flex flex-col gap-1.5 text-sm font-normal text-slate-700">
                    Visibility
                    <span className="flex min-h-10 items-center gap-2 rounded-md border border-slate-300 px-3 py-2">
                      <input
                        checked={field.visibility === "OFFICE"}
                        className="h-4 w-4"
                        onChange={(event) =>
                          updateField(field.id, {
                            visibility: event.target.checked ? "OFFICE" : "PUBLIC",
                          })
                        }
                        type="checkbox"
                      />
                      <span className="text-sm text-slate-600">
                        Office use only
                      </span>
                    </span>
                  </label>

                  {supportsPlaceholder ? (
                    <label className="flex flex-col gap-1.5 text-sm font-normal text-slate-700">
                      Placeholder
                      <input
                        className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        onChange={(event) =>
                          updateField(field.id, { placeholder: event.target.value })
                        }
                        type="text"
                        value={field.placeholder}
                      />
                    </label>
                  ) : null}
                </div>

                {field.type === "select" ? (
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          Dropdown options
                        </p>
                        <p className="mt-1 text-xs text-slate-600">
                          Empty rows are removed when you save or clean up options.
                        </p>
                      </div>
                      <button
                        className="w-fit rounded-md border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
                        onClick={() => addSelectOption(field.id)}
                        type="button"
                      >
                        Add option
                      </button>
                    </div>
                    <div className="mt-3 grid gap-2">
                      {field.options.length === 0 ? (
                        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                          Add at least one option for this dropdown.
                        </p>
                      ) : null}
                      {field.options.map((option, optionIndex) => (
                        <div className="grid gap-2 sm:grid-cols-[1fr_auto]" key={`${field.id}-${optionIndex}`}>
                          <input
                            aria-label={`Option ${optionIndex + 1}`}
                            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                            onBlur={() => cleanSelectOptions(field.id)}
                            onChange={(event) =>
                              updateSelectOption(field.id, optionIndex, event.target.value)
                            }
                            placeholder={`Option ${optionIndex + 1}`}
                            type="text"
                            value={option}
                          />
                          <button
                            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            onClick={() => removeSelectOption(field.id, optionIndex)}
                            type="button"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {supportsContent ? (
                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
                    {field.type === "html"
                      ? "HTML content"
                      : field.type === "section_heading"
                        ? "Heading text"
                        : "Text content"}
                    <textarea
                      className="min-h-24 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      onChange={(event) =>
                        updateField(field.id, { content: event.target.value })
                      }
                      value={field.content}
                    />
                  </label>
                ) : null}

                <section className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-950">
                        Conditional Visibility
                      </h4>
                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        Show or hide this field based on one previous public answer.
                      </p>
                    </div>
                    {allowConditionalLogic ? (
                      <Badge tone="teal">
                        {conditionalRuleCount} / {maxConditionalRules === null ? "Unlimited" : maxConditionalRules}
                      </Badge>
                    ) : (
                      <Badge tone="amber">Upgrade required</Badge>
                    )}
                  </div>

                  {!allowConditionalLogic ? (
                    <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
                      Conditional logic is available on Pro and Business plans.
                    </p>
                  ) : sourceOptions.length === 0 ? (
                    <p className="mt-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs leading-5 text-slate-600">
                      Add a public text, number, dropdown, date, email, phone, currency,
                      or checkbox field to use as a condition source.
                    </p>
                  ) : (
                    <div className="mt-3 grid gap-3">
                      <label className="flex items-center gap-2 text-sm font-normal text-slate-700">
                        <input
                          checked={Boolean(field.conditionalLogic?.enabled)}
                          className="h-4 w-4"
                          onChange={(event) =>
                            updateConditionalLogic(field.id, {
                              enabled: event.target.checked,
                              sourceFieldId:
                                field.conditionalLogic?.sourceFieldId ||
                                sourceOptions[0]?.id ||
                                "",
                            })
                          }
                          type="checkbox"
                        />
                        Enable conditional visibility
                      </label>

                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="flex flex-col gap-1.5 text-sm font-normal text-slate-700">
                          Action
                          <select
                            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                            disabled={!field.conditionalLogic?.enabled}
                            onChange={(event) =>
                              updateConditionalLogic(field.id, {
                                action: event.target.value === "HIDE" ? "HIDE" : "SHOW",
                              })
                            }
                            value={field.conditionalLogic?.action ?? "SHOW"}
                          >
                            <option value="SHOW">Show this field when</option>
                            <option value="HIDE">Hide this field when</option>
                          </select>
                        </label>

                        <label className="flex flex-col gap-1.5 text-sm font-normal text-slate-700">
                          Source field
                          <select
                            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                            disabled={!field.conditionalLogic?.enabled}
                            onChange={(event) => {
                              const sourceField = fields.find(
                                (candidate) => candidate.id === event.target.value,
                              );
                              const nextOperator =
                                sourceField &&
                                !["number", "currency"].includes(sourceField.type) &&
                                NUMBER_CONDITIONAL_OPERATORS.includes(selectedOperator)
                                  ? "EQUALS"
                                  : selectedOperator;

                              updateConditionalLogic(field.id, {
                                sourceFieldId: event.target.value,
                                operator: nextOperator,
                              });
                            }}
                            value={field.conditionalLogic?.sourceFieldId || sourceOptions[0]?.id || ""}
                          >
                            {sourceOptions.map((sourceField) => (
                              <option key={sourceField.id} value={sourceField.id}>
                                {sourceField.label || sourceField.content || fieldTypeLabel(sourceField.type)}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="flex flex-col gap-1.5 text-sm font-normal text-slate-700">
                          Operator
                          <select
                            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                            disabled={!field.conditionalLogic?.enabled}
                            onChange={(event) =>
                              updateConditionalLogic(field.id, {
                                operator: event.target.value as ConditionalLogicOperator,
                              })
                            }
                            value={selectedOperator}
                          >
                            {operatorOptions.map((operator) => (
                              <option key={operator.value} value={operator.value}>
                                {operator.label}
                              </option>
                            ))}
                          </select>
                        </label>

                        {operatorNeedsValue(selectedOperator) ? (
                          <label className="flex flex-col gap-1.5 text-sm font-normal text-slate-700">
                            Value
                            <input
                              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                              disabled={!field.conditionalLogic?.enabled}
                              onChange={(event) =>
                                updateConditionalLogic(field.id, { value: event.target.value })
                              }
                              placeholder="Value to compare"
                              type="text"
                              value={field.conditionalLogic?.value ?? ""}
                            />
                          </label>
                        ) : null}
                      </div>
                    </div>
                  )}
                </section>

                <FieldHelper field={field} />
              </div>
              ) : null}
            </article>
          );
        })}
        </div>
      </section>

      <aside className="flex flex-col gap-3 border-t border-slate-200 bg-white p-3 xl:sticky xl:top-0 xl:h-screen xl:overflow-y-auto xl:border-l xl:border-t-0">
        <SubmitButton
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          pendingText="Saving form fields..."
        >
          Save Fields
        </SubmitButton>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-950">Preview</h2>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                A simplified public-form preview.
              </p>
            </div>
          </div>
          <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
            Office-only fields are shown here for editing context, but hidden from the public form.
          </p>
          <div className="mt-3 flex flex-col gap-3">
            {fields.length === 0 ? (
              <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-sm leading-5 text-slate-700">
                Preview appears after fields are added.
              </p>
            ) : null}

            {fields.map((field) => {
              const previewBadge =
                field.visibility === "OFFICE" ? (
                  <Badge tone="amber">Office Use Only</Badge>
                ) : null;

              if (field.type === "section_heading") {
                return (
                  <div className="pt-1" key={field.id}>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="border-b border-slate-200 pb-1.5 text-base font-semibold text-slate-950">
                        {field.content || field.label || "Section heading"}
                      </h3>
                      {previewBadge}
                    </div>
                  </div>
                );
              }

              if (field.type === "static_text") {
                return (
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3" key={field.id}>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm leading-5 text-slate-600">
                        {field.content || field.label || "Static agreement text"}
                      </p>
                      {previewBadge}
                    </div>
                  </div>
                );
              }

              if (field.type === "html") {
                return (
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-3" key={field.id}>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {field.label ? (
                        <p className="text-sm font-medium text-slate-950">
                          {field.label}
                        </p>
                      ) : null}
                      {previewBadge}
                    </div>
                    <div
                      className="space-y-2 text-sm leading-5 text-slate-600"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeFormHtml(field.content || "<p>HTML content preview</p>"),
                      }}
                    />
                  </div>
                );
              }

              return (
                <label className="flex flex-col gap-1.5 text-sm font-normal text-slate-700" key={field.id}>
                  <span className="flex flex-wrap items-center gap-2">
                    {field.label || fieldTypeLabel(field.type)}
                    {field.required ? <Badge tone="red">Required</Badge> : null}
                    {previewBadge}
                  </span>
                  {field.type === "textarea" || field.type === "address" ? (
                    <textarea
                      className="min-h-16 rounded-md border border-slate-300 bg-slate-50 px-3 py-2"
                      disabled
                      placeholder={field.placeholder}
                    />
                  ) : field.type === "select" ? (
                    <select className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2" disabled>
                      <option>Choose an option</option>
                      {field.options.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  ) : field.type === "checkbox" ? (
                    <span className="flex items-center gap-2 rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      <input disabled type="checkbox" />
                      {field.placeholder || field.label || "Checkbox option"}
                    </span>
                  ) : field.type === "image_upload" ? (
                    <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                      File upload
                    </div>
                  ) : field.type === "signature" || field.type === "initials" ? (
                    <div className="h-20 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                      {fieldTypeLabel(field.type)} pad
                    </div>
                  ) : (
                    <input
                      className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2"
                      disabled
                      placeholder={field.placeholder}
                      type={previewInputType(field.type)}
                    />
                  )}
                </label>
              );
            })}
          </div>
        </section>
      </aside>
    </form>
  );
}
