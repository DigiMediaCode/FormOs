"use client";

import { useMemo, useState } from "react";
import {
  DISPLAY_ONLY_FIELD_TYPES,
  fieldTypeLabel,
  type FormBuilderField,
  type FormFieldType,
  SUPPORTED_FIELD_TYPES,
} from "@/lib/forms/fields";
import { sanitizeFormHtml } from "@/lib/forms/sanitize-html";

type FormBuilderEditorProps = {
  formId: string;
  initialFields: FormBuilderField[];
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
  "select",
];

const CONTENT_FIELD_TYPES: FormFieldType[] = ["static_text", "section_heading", "html"];

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
  };
}

function normalizeOrders(fields: FormBuilderField[]) {
  return fields.map((field, index) => ({
    ...field,
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

export function FormBuilderEditor({
  initialFields,
  saveAction,
}: FormBuilderEditorProps) {
  const [fields, setFields] = useState<FormBuilderField[]>(initialFields);
  const [fieldTypeToAdd, setFieldTypeToAdd] = useState<FormFieldType>("text");
  const serializedFields = useMemo(() => JSON.stringify(normalizeOrders(fields)), [fields]);

  function updateField(fieldId: string, updates: Partial<FormBuilderField>) {
    setFields((currentFields) =>
      currentFields.map((field) =>
        field.id === fieldId
          ? {
              ...field,
              ...updates,
              required:
                field.type === "html" || updates.type === "html"
                  ? false
                  : updates.required ?? field.required,
            }
          : field,
      ),
    );
  }

  function addField() {
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

  return (
    <form action={saveAction} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <input name="fields" type="hidden" value={serializedFields} />

      <section className="flex flex-col gap-4">
        <div className="rounded-md border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-slate-950">Fields</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Add fields, adjust their labels and options, then save the schema.
          </p>
        </div>

        {fields.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-300 bg-white p-6">
            <p className="text-sm font-medium text-slate-950">No fields yet</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Add your first field from the controls beside the editor.
            </p>
          </div>
        ) : null}

        {fields.map((field, index) => {
          const supportsPlaceholder = PLACEHOLDER_FIELD_TYPES.includes(field.type);
          const supportsContent = CONTENT_FIELD_TYPES.includes(field.type);
          const isDisplayOnly = DISPLAY_ONLY_FIELD_TYPES.includes(field.type);

          return (
            <article className="rounded-md border border-slate-200 bg-white p-5" key={field.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-teal-700">
                    Field {index + 1}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-950">
                    {fieldTypeLabel(field.type)}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={index === 0}
                    onClick={() => moveField(field.id, "up")}
                    type="button"
                  >
                    Move up
                  </button>
                  <button
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={index === fields.length - 1}
                    onClick={() => moveField(field.id, "down")}
                    type="button"
                  >
                    Move down
                  </button>
                  <button
                    className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700"
                    onClick={() => deleteField(field.id)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
                  Label
                  <input
                    className="rounded-md border border-slate-300 px-3 py-2 text-base text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                    onChange={(event) => updateField(field.id, { label: event.target.value })}
                    type="text"
                    value={field.label}
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-medium text-slate-800">
                  Required
                  <span className="flex h-11 items-center gap-2 rounded-md border border-slate-300 px-3">
                    <input
                      checked={field.required}
                      className="h-4 w-4"
                      disabled={isDisplayOnly}
                      onChange={(event) =>
                        updateField(field.id, { required: event.target.checked })
                      }
                      type="checkbox"
                    />
                    <span className="text-sm text-slate-700">
                      {isDisplayOnly ? "Display-only field" : "Require this field"}
                    </span>
                  </span>
                </label>

                {supportsPlaceholder ? (
                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-800 sm:col-span-2">
                    Placeholder
                    <input
                      className="rounded-md border border-slate-300 px-3 py-2 text-base text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                      onChange={(event) =>
                        updateField(field.id, { placeholder: event.target.value })
                      }
                      type="text"
                      value={field.placeholder}
                    />
                  </label>
                ) : null}

                {field.type === "select" ? (
                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-800 sm:col-span-2">
                    Select options
                    <textarea
                      className="min-h-24 rounded-md border border-slate-300 px-3 py-2 text-base text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                      onChange={(event) =>
                        updateField(field.id, {
                          options: event.target.value
                            .split("\n")
                            .map((option) => option.trim())
                            .filter((option) => option.length > 0),
                        })
                      }
                      value={field.options.join("\n")}
                    />
                  </label>
                ) : null}

                {supportsContent ? (
                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-800 sm:col-span-2">
                    {field.type === "html" ? "HTML content" : "Content"}
                    <textarea
                      className="min-h-28 rounded-md border border-slate-300 px-3 py-2 font-mono text-sm text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                      onChange={(event) =>
                        updateField(field.id, { content: event.target.value })
                      }
                      value={field.content}
                    />
                  </label>
                ) : null}
              </div>
            </article>
          );
        })}
      </section>

      <aside className="flex flex-col gap-4">
        <section className="rounded-md border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-950">Add field</h2>
          <label className="mt-4 flex flex-col gap-2 text-sm font-medium text-slate-800">
            Field type
            <select
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-base text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              onChange={(event) => setFieldTypeToAdd(event.target.value as FormFieldType)}
              value={fieldTypeToAdd}
            >
              {SUPPORTED_FIELD_TYPES.map((type) => (
                <option key={type} value={type}>
                  {fieldTypeLabel(type)}
                </option>
              ))}
            </select>
          </label>
          <button
            className="mt-4 w-full rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            onClick={addField}
            type="button"
          >
            Add field
          </button>
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-950">Preview</h2>
          <div className="mt-4 flex flex-col gap-4">
            {fields.length === 0 ? (
              <p className="text-sm leading-6 text-slate-700">
                Preview appears after fields are added.
              </p>
            ) : null}

            {fields.map((field) => {
              if (field.type === "section_heading") {
                return (
                  <h3 className="border-b border-slate-200 pb-2 text-xl font-semibold text-slate-950" key={field.id}>
                    {field.content || field.label || "Section heading"}
                  </h3>
                );
              }

              if (field.type === "static_text") {
                return (
                  <p className="text-sm leading-6 text-slate-700" key={field.id}>
                    {field.content || field.label || "Static agreement text"}
                  </p>
                );
              }

              if (field.type === "html") {
                return (
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-4" key={field.id}>
                    {field.label ? (
                      <p className="mb-3 text-sm font-medium text-slate-950">
                        {field.label}
                      </p>
                    ) : null}
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
                  {field.label || fieldTypeLabel(field.type)}
                  {field.required ? <span className="text-xs text-red-700">Required</span> : null}
                  {field.type === "textarea" || field.type === "address" ? (
                    <textarea
                      className="min-h-20 rounded-md border border-slate-300 bg-slate-50 px-3 py-2"
                      disabled
                      placeholder={field.placeholder}
                    />
                  ) : field.type === "select" ? (
                    <select className="rounded-md border border-slate-300 bg-slate-50 px-3 py-2" disabled>
                      <option>{field.placeholder || "Choose an option"}</option>
                      {field.options.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  ) : field.type === "checkbox" ? (
                    <span className="flex items-center gap-2 text-sm text-slate-700">
                      <input disabled type="checkbox" />
                      {field.placeholder || "Checkbox option"}
                    </span>
                  ) : field.type === "image_upload" ? (
                    <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-600">
                      Image upload placeholder
                    </div>
                  ) : field.type === "signature" || field.type === "initials" ? (
                    <div className="h-20 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-600">
                      {fieldTypeLabel(field.type)} placeholder
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

        <button
          className="rounded-md bg-teal-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-teal-800"
          type="submit"
        >
          Save schema
        </button>
      </aside>
    </form>
  );
}
