"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
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
    <span className={`rounded-md border px-2 py-1 text-xs font-medium ${classes}`}>
      {children}
    </span>
  );
}

function FieldHelper({ field }: { field: FormBuilderField }) {
  if (field.visibility === "OFFICE") {
    return (
      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900">
        This field will not appear on the public form. It can be completed by the
        form owner after submission.
      </p>
    );
  }

  if (field.type === "image_upload") {
    return (
      <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700">
        Uploads require Google Drive or Dropbox to be connected.
      </p>
    );
  }

  if (field.type === "signature" || field.type === "initials") {
    return (
      <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700">
        Used for signed agreements.
      </p>
    );
  }

  return null;
}

export function FormBuilderEditor({
  allowedFieldTypes,
  initialFields,
  saveAction,
}: FormBuilderEditorProps) {
  const firstAllowedFieldType =
    allowedFieldTypes === null ? "text" : allowedFieldTypes[0] ?? "text";
  const [fields, setFields] = useState<FormBuilderField[]>(normalizeOrders(initialFields));
  const [fieldTypeToAdd, setFieldTypeToAdd] =
    useState<FormFieldType>(firstAllowedFieldType);
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

  function addField() {
    if (!isAllowedFieldType(fieldTypeToAdd)) {
      return;
    }

    setFields((currentFields) =>
      normalizeOrders([...currentFields, createField(fieldTypeToAdd, currentFields.length + 1)]),
    );
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

  return (
    <form action={saveAction} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <input name="fields" type="hidden" value={serializedFields} />

      <section className="flex min-w-0 flex-col gap-5">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
                Field schema
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Fields
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">
                Configure the fields that make up this form. Office-only fields
                stay hidden from public submitters.
              </p>
            </div>
            <Badge tone="teal">{fields.length} fields</Badge>
          </div>
        </div>

        {disallowedFieldTypes.length > 0 ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            This form contains field types that are not included in your current
            plan. Remove them or upgrade your plan before saving. Disallowed
            field types: {disallowedFieldTypes.join(", ")}.
          </p>
        ) : null}

        {fields.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
            <p className="text-lg font-semibold text-slate-950">
              Start with your first field
            </p>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-700">
              Choose a field type from the Add Field panel. You can reorder,
              edit, and preview fields before saving.
            </p>
          </div>
        ) : null}

        {fields.map((field, index) => {
          const supportsPlaceholder = PLACEHOLDER_FIELD_TYPES.includes(field.type);
          const supportsContent = CONTENT_FIELD_TYPES.includes(field.type);
          const isDisplayOnly = isDisplayOnlyField(field.type);

          return (
            <article
              className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
              key={field.id}
            >
              <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Field {index + 1}
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
                    </div>
                    <h3 className="mt-2 truncate text-lg font-semibold text-slate-950">
                      {field.label || field.content || fieldTypeLabel(field.type)}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={index === 0}
                      onClick={() => moveField(field.id, "up")}
                      type="button"
                    >
                      Move up
                    </button>
                    <button
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={index === fields.length - 1}
                      onClick={() => moveField(field.id, "down")}
                      type="button"
                    >
                      Move down
                    </button>
                    <button
                      className="rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                      onClick={() => deleteField(field.id)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  {!["static_text", "html"].includes(field.type) ? (
                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
                      {field.type === "section_heading" ? "Heading label" : "Field label"}
                      <input
                        className="rounded-md border border-slate-300 px-3 py-2 text-base text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                        onChange={(event) => updateField(field.id, { label: event.target.value })}
                        type="text"
                        value={field.label}
                      />
                    </label>
                  ) : null}

                  {!isDisplayOnly ? (
                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
                      Required
                      <span className="flex min-h-11 items-center gap-3 rounded-md border border-slate-300 px-3 py-2">
                        <input
                          checked={field.required}
                          className="h-4 w-4"
                          onChange={(event) =>
                            updateField(field.id, { required: event.target.checked })
                          }
                          type="checkbox"
                        />
                        <span className="text-sm text-slate-700">
                          Require public submitters to complete this field
                        </span>
                      </span>
                    </label>
                  ) : (
                    <div className="flex flex-col gap-2 text-sm font-medium text-slate-800">
                      Required
                      <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600">
                        Display-only fields do not collect input and cannot be required.
                      </div>
                    </div>
                  )}

                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
                    Visibility
                    <span className="flex min-h-11 items-center gap-3 rounded-md border border-slate-300 px-3 py-2">
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
                      <span className="text-sm text-slate-700">
                        Office use only
                      </span>
                    </span>
                  </label>

                  {supportsPlaceholder ? (
                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
                      Placeholder
                      <input
                        className="rounded-md border border-slate-300 px-3 py-2 text-base text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
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
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          Dropdown options
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          Empty rows are removed when you save or clean up options.
                        </p>
                      </div>
                      <button
                        className="w-fit rounded-md border border-teal-700 bg-white px-3 py-2 text-sm font-medium text-teal-800 transition hover:bg-teal-50"
                        onClick={() => addSelectOption(field.id)}
                        type="button"
                      >
                        Add option
                      </button>
                    </div>
                    <div className="mt-4 grid gap-3">
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
                      className="min-h-32 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                      onChange={(event) =>
                        updateField(field.id, { content: event.target.value })
                      }
                      value={field.content}
                    />
                  </label>
                ) : null}

                <FieldHelper field={field} />
              </div>
            </article>
          );
        })}
      </section>

      <aside className="flex flex-col gap-5 xl:sticky xl:top-6 xl:self-start">
        <SubmitButton
          className="rounded-md bg-teal-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
          pendingText="Saving form fields..."
        >
          Save Fields
        </SubmitButton>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Add Field</h2>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                Pick a type, then add it to the end of the form.
              </p>
            </div>
            <Badge tone="slate">{fieldTypeLabel(fieldTypeToAdd)}</Badge>
          </div>

          <div className="mt-5 grid gap-4">
            {FIELD_TYPE_GROUPS.map((group) => (
              <fieldset className="grid gap-2" key={group.label}>
                <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {group.label}
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  {group.types.map((type) => (
                    <button
                      className={`rounded-md border px-3 py-2 text-left text-sm font-medium transition ${
                        !isAllowedFieldType(type)
                          ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                          : fieldTypeToAdd === type
                          ? "border-teal-700 bg-teal-50 text-teal-900"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                      disabled={!isAllowedFieldType(type)}
                      key={type}
                      onClick={() => setFieldTypeToAdd(type)}
                      type="button"
                    >
                      <span className="flex flex-col gap-1">
                        <span>{fieldTypeLabel(type)}</span>
                        {!isAllowedFieldType(type) ? (
                          <span className="text-xs font-medium text-amber-700">
                            Upgrade required
                          </span>
                        ) : null}
                      </span>
                    </button>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>

          <button
            className="mt-5 w-full rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            disabled={!isAllowedFieldType(fieldTypeToAdd)}
            onClick={addField}
            type="button"
          >
            Add {fieldTypeLabel(fieldTypeToAdd)}
          </button>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Preview</h2>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                A simplified public-form preview.
              </p>
            </div>
          </div>
          <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
            Office-only fields are shown here for editing context, but hidden from the public form.
          </p>
          <div className="mt-4 flex flex-col gap-4">
            {fields.length === 0 ? (
              <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
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
                  <div className="pt-2" key={field.id}>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="border-b border-slate-200 pb-2 text-lg font-semibold text-slate-950">
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
                      <p className="text-sm leading-6 text-slate-700">
                        {field.content || field.label || "Static agreement text"}
                      </p>
                      {previewBadge}
                    </div>
                  </div>
                );
              }

              if (field.type === "html") {
                return (
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-4" key={field.id}>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      {field.label ? (
                        <p className="text-sm font-medium text-slate-950">
                          {field.label}
                        </p>
                      ) : null}
                      {previewBadge}
                    </div>
                    <div
                      className="space-y-3 text-sm leading-6 text-slate-700"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeFormHtml(field.content || "<p>HTML content preview</p>"),
                      }}
                    />
                  </div>
                );
              }

              return (
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-800" key={field.id}>
                  <span className="flex flex-wrap items-center gap-2">
                    {field.label || fieldTypeLabel(field.type)}
                    {field.required ? <Badge tone="red">Required</Badge> : null}
                    {previewBadge}
                  </span>
                  {field.type === "textarea" || field.type === "address" ? (
                    <textarea
                      className="min-h-20 rounded-md border border-slate-300 bg-slate-50 px-3 py-2"
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
                    <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-600">
                      File upload
                    </div>
                  ) : field.type === "signature" || field.type === "initials" ? (
                    <div className="h-24 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-600">
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
