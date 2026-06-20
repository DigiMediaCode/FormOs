"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  isFieldVisible,
  type FieldConditionalLogic,
} from "@/lib/forms/conditional-logic";

export const RESTORE_SIGNATURE_EVENT = "formos:restore-signature";

export function PublicFormDraftScript({
  clearDraft = false,
  formId,
}: {
  clearDraft?: boolean;
  formId: string;
}) {
  const script = `
    (() => {
      const formId = ${JSON.stringify(formId)};
      const draftKey = "formos:public-form-draft:" + formId;

      function collect(form) {
        const values = {};
        const data = new FormData(form);
        const checkboxNames = new Set();
        for (const element of Array.from(form.elements)) {
          if (!element || !element.name || element.type === "file") continue;
          if (element instanceof HTMLInputElement && element.type === "checkbox") {
            if (checkboxNames.has(element.name)) continue;
            checkboxNames.add(element.name);
            const checkboxes = Array.from(form.querySelectorAll('input[type="checkbox"]'))
              .filter((input) => input.name === element.name);
            const selected = data.getAll(element.name).map(String);
            values[element.name] = checkboxes.length > 1 ? selected : selected.includes("on");
          } else if (
            element instanceof HTMLInputElement ||
            element instanceof HTMLTextAreaElement ||
            element instanceof HTMLSelectElement
          ) {
            values[element.name] = String(data.get(element.name) || "");
          }
        }
        return values;
      }

      function save(form) {
        try {
          sessionStorage.setItem(draftKey, JSON.stringify(collect(form)));
        } catch {}
      }

      function restore() {
        if (${clearDraft ? "true" : "false"}) {
          try { sessionStorage.removeItem(draftKey); } catch {}
          return;
        }

        let draft = null;
        try {
          draft = JSON.parse(sessionStorage.getItem(draftKey) || "null");
        } catch {
          try { sessionStorage.removeItem(draftKey); } catch {}
        }

        if (!draft) return;

        const form = document.querySelector('form[data-public-form-id="' + formId + '"]');
        if (!form) return;

        for (const [name, value] of Object.entries(draft)) {
          const element = form.elements.namedItem(name);
          if (!element) continue;

          if (typeof RadioNodeList !== "undefined" && element instanceof RadioNodeList) {
            const selected = Array.isArray(value) ? value.map(String) : [];
            for (const item of Array.from(element)) {
              if (item instanceof HTMLInputElement && item.type === "checkbox") {
                item.checked = selected.includes(item.value);
              }
            }
            continue;
          }

          if (element instanceof HTMLInputElement && element.type === "checkbox") {
            element.checked = Boolean(value);
          } else if (
            element instanceof HTMLInputElement ||
            element instanceof HTMLTextAreaElement ||
            element instanceof HTMLSelectElement
          ) {
            element.value = typeof value === "string" ? value : "";
            element.dispatchEvent(new Event("input", { bubbles: true }));
            element.dispatchEvent(new Event("change", { bubbles: true }));

            if (
              element instanceof HTMLInputElement &&
              element.type === "hidden" &&
              element.value.startsWith("data:image/png;base64,")
            ) {
              window.dispatchEvent(new CustomEvent("${RESTORE_SIGNATURE_EVENT}", {
                detail: { fieldId: name, value: element.value }
              }));
            }
          }
        }
      }

      document.addEventListener("input", (event) => {
        const form = event.target && event.target.closest
          ? event.target.closest('form[data-public-form-id="' + formId + '"]')
          : null;
        if (form) save(form);
      }, true);

      document.addEventListener("change", (event) => {
        const form = event.target && event.target.closest
          ? event.target.closest('form[data-public-form-id="' + formId + '"]')
          : null;
        if (form) save(form);
      }, true);

      document.addEventListener("submit", (event) => {
        const form = event.target;
        if (form && form.matches && form.matches('form[data-public-form-id="' + formId + '"]')) {
          save(form);
        }
      }, true);

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", restore, { once: true });
      } else {
        restore();
      }
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

type RequiredPublicField = {
  conditionalLogic?: FieldConditionalLogic;
  id: string;
  label: string;
  type: string;
};

type ConditionalPublicField = {
  conditionalLogic?: FieldConditionalLogic;
  id: string;
  type: string;
};

type PublicFormClientProps = {
  action: (formData: FormData) => void;
  children: ReactNode;
  clearDraft?: boolean;
  conditionalFields: ConditionalPublicField[];
  formId: string;
  requiredFields: RequiredPublicField[];
};

function valueIsMissing(field: RequiredPublicField, formData: FormData) {
  if (field.type === "checkbox") {
    return formData.getAll(field.id).length === 0;
  }

  const value = formData.get(field.id);

  if (field.type === "image_upload") {
    return !(value instanceof File) || value.size === 0;
  }

  if (field.type === "signature" || field.type === "initials") {
    return typeof value !== "string" || !value.startsWith("data:image/png;base64,");
  }

  return String(value ?? "").trim().length === 0;
}

export function PublicFormClient({
  action,
  children,
  clearDraft = false,
  conditionalFields,
  formId,
  requiredFields,
}: PublicFormClientProps) {
  const [error, setError] = useState("");
  const draftKey = `formos:public-form-draft:${formId}`;

  function collectDraft(form: HTMLFormElement) {
    const formData = new FormData(form);
    const values: Record<string, string | boolean | string[]> = {};

    for (const element of Array.from(form.elements)) {
      if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement)) {
        continue;
      }

      if (!element.name || element.type === "file") {
        continue;
      }

      if (element instanceof HTMLInputElement && element.type === "checkbox") {
        if (element.name in values) {
          continue;
        }

        const checkboxes = Array.from(
          form.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
        ).filter((input) => input.name === element.name);
        const selected = formData.getAll(element.name).map(String);
        values[element.name] =
          checkboxes.length > 1 ? selected : selected.includes("on");
        continue;
      }

      values[element.name] = String(formData.get(element.name) ?? "");
    }

    return values;
  }

  function collectCurrentValues(form: HTMLFormElement) {
    const formData = new FormData(form);
    const values: Record<string, string | boolean | string[]> = {};

    for (const element of Array.from(form.elements)) {
      if (
        !(
          element instanceof HTMLInputElement ||
          element instanceof HTMLTextAreaElement ||
          element instanceof HTMLSelectElement
        )
      ) {
        continue;
      }

      if (!element.name || element.type === "file") {
        continue;
      }

      if (element instanceof HTMLInputElement && element.type === "checkbox") {
        if (element.name in values) {
          continue;
        }

        const checkboxes = Array.from(
          form.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
        ).filter((input) => input.name === element.name);
        const selected = formData.getAll(element.name).map(String);
        values[element.name] =
          checkboxes.length > 1 ? selected : selected.includes("on");
        continue;
      }

      values[element.name] = String(formData.get(element.name) ?? "");
    }

    return values;
  }

  function clearFieldControls(container: HTMLElement) {
    for (const element of Array.from(container.querySelectorAll("input, textarea, select"))) {
      if (
        !(
          element instanceof HTMLInputElement ||
          element instanceof HTMLTextAreaElement ||
          element instanceof HTMLSelectElement
        )
      ) {
        continue;
      }

      if (element instanceof HTMLInputElement && element.type === "checkbox") {
        element.checked = false;
      } else if (element instanceof HTMLInputElement && element.type === "file") {
        element.value = "";
      } else {
        element.value = "";
      }

      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  function applyConditionalVisibility(form: HTMLFormElement) {
    const values = collectCurrentValues(form);

    for (const field of conditionalFields) {
      const wrapper = form.querySelector<HTMLElement>(
        `[data-formos-field-id="${field.id}"]`,
      );

      if (!wrapper) {
        continue;
      }

      const visible = isFieldVisible(field, values);
      const wasHidden = wrapper.dataset.formosHidden === "true";
      wrapper.hidden = !visible;
      wrapper.dataset.formosHidden = visible ? "false" : "true";

      for (const element of Array.from(wrapper.querySelectorAll("input, textarea, select"))) {
        if (
          element instanceof HTMLInputElement ||
          element instanceof HTMLTextAreaElement ||
          element instanceof HTMLSelectElement
        ) {
          element.disabled = !visible;
        }
      }

      if (!visible && !wasHidden) {
        clearFieldControls(wrapper);
      }
    }
  }

  function persistDraft(form: HTMLFormElement) {
    try {
      window.sessionStorage.setItem(draftKey, JSON.stringify(collectDraft(form)));
    } catch {
      // Draft restore is best-effort only.
    }
  }

  useEffect(() => {
    if (clearDraft) {
      window.sessionStorage.removeItem(draftKey);
      return;
    }

    const rawDraft = window.sessionStorage.getItem(draftKey);

    if (!rawDraft) {
      return;
    }

    let draft: Record<string, unknown>;

    try {
      draft = JSON.parse(rawDraft) as Record<string, unknown>;
    } catch {
      window.sessionStorage.removeItem(draftKey);
      return;
    }

    const form = document.querySelector<HTMLFormElement>(
      `form[data-public-form-id="${formId}"]`,
    );

    if (!form) {
      return;
    }

    for (const [name, value] of Object.entries(draft)) {
      const element = form.elements.namedItem(name);

      if (typeof RadioNodeList !== "undefined" && element instanceof RadioNodeList) {
        const selected = Array.isArray(value) ? value.map(String) : [];
        for (const item of Array.from(element)) {
          if (item instanceof HTMLInputElement && item.type === "checkbox") {
            item.checked = selected.includes(item.value);
          }
        }
        continue;
      }

      if (element instanceof HTMLInputElement && element.type === "checkbox") {
        element.checked = Boolean(value);
        continue;
      }

      if (
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLSelectElement
      ) {
        element.value = typeof value === "string" ? value : "";

        if (
          element instanceof HTMLInputElement &&
          element.type === "hidden" &&
          element.value.startsWith("data:image/png;base64,")
        ) {
          window.dispatchEvent(
            new CustomEvent(RESTORE_SIGNATURE_EVENT, {
              detail: {
                fieldId: name,
                value: element.value,
              },
            }),
          );
        }
      }
    }
  }, [clearDraft, draftKey, formId]);

  useEffect(() => {
    const form = document.querySelector<HTMLFormElement>(
      `form[data-public-form-id="${formId}"]`,
    );

    if (!form) {
      return;
    }

    applyConditionalVisibility(form);
    persistDraft(form);
  }, [conditionalFields, formId]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    applyConditionalVisibility(event.currentTarget);
    persistDraft(event.currentTarget);

    const formData = new FormData(event.currentTarget);
    const currentValues = collectCurrentValues(event.currentTarget);
    const missingField = requiredFields.find(
      (field) =>
        isFieldVisible(field, currentValues) && valueIsMissing(field, formData),
    );

    if (!missingField) {
      setError("");
      return;
    }

    event.preventDefault();
    setError(`${missingField.label || "A required field"} is required.`);

    const fieldElement = event.currentTarget.elements.namedItem(missingField.id);

    const focusElement =
      typeof RadioNodeList !== "undefined" && fieldElement instanceof RadioNodeList
        ? Array.from(fieldElement).find(
            (element): element is HTMLInputElement =>
              element instanceof HTMLInputElement,
          )
        : fieldElement;

    if (focusElement instanceof HTMLElement) {
      focusElement.scrollIntoView({ behavior: "smooth", block: "center" });

      if ("focus" in focusElement) {
        focusElement.focus();
      }
    }
  }

  return (
    <form
      action={action}
      className="mt-6 flex flex-col gap-5"
      data-public-form-id={formId}
      onChange={(event) => {
        applyConditionalVisibility(event.currentTarget);
        persistDraft(event.currentTarget);
      }}
      onInput={(event) => {
        applyConditionalVisibility(event.currentTarget);
        persistDraft(event.currentTarget);
      }}
      onSubmit={handleSubmit}
    >
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm leading-6 text-red-900 shadow-sm">
          {error}
        </p>
      ) : null}
      {children}
    </form>
  );
}
