"use client";

import { useEffect } from "react";

const DRAFT_KEY = "formos:admin:broadcast:draft:v1";

type DraftField =
  | {
      name: string;
      type: "checkbox";
      values: string[];
    }
  | {
      name: string;
      type: "radio";
      value: string;
    }
  | {
      name: string;
      type: "value";
      value: string;
    };

type DraftPayload = {
  fields: DraftField[];
};

function fieldName(element: Element) {
  return element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
    ? element.name
    : "";
}

function collectDraft(form: HTMLFormElement): DraftPayload {
  const namedElements = Array.from(
    form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      "input[name], textarea[name], select[name]",
    ),
  );
  const names = Array.from(new Set(namedElements.map(fieldName).filter(Boolean)));
  const fields: DraftField[] = [];

  for (const name of names) {
    const elements = namedElements.filter((element) => element.name === name);
    const first = elements[0];

    if (!first) {
      continue;
    }

    if (first instanceof HTMLInputElement && first.type === "checkbox") {
      fields.push({
        name,
        type: "checkbox",
        values: elements
          .filter(
            (element): element is HTMLInputElement =>
              element instanceof HTMLInputElement && element.checked,
          )
          .map((element) => element.value),
      });
      continue;
    }

    if (first instanceof HTMLInputElement && first.type === "radio") {
      const checked = elements.find(
        (element): element is HTMLInputElement =>
          element instanceof HTMLInputElement && element.checked,
      );
      fields.push({
        name,
        type: "radio",
        value: checked?.value ?? "",
      });
      continue;
    }

    fields.push({
      name,
      type: "value",
      value: first.value,
    });
  }

  return { fields };
}

function restoreDraft(form: HTMLFormElement, draft: DraftPayload) {
  for (const field of draft.fields) {
    const elements = Array.from(
      form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
        `[name="${CSS.escape(field.name)}"]`,
      ),
    );

    if (field.type === "checkbox") {
      for (const element of elements) {
        if (element instanceof HTMLInputElement) {
          element.checked = field.values.includes(element.value);
          element.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
      continue;
    }

    if (field.type === "radio") {
      for (const element of elements) {
        if (element instanceof HTMLInputElement) {
          element.checked = element.value === field.value;
          element.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
      continue;
    }

    const [element] = elements;
    if (!element) {
      continue;
    }

    element.value = field.value;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));

    if (field.name === "htmlBody") {
      window.dispatchEvent(
        new CustomEvent("formos:rich-editor-restore", {
          detail: {
            html: field.value,
            name: field.name,
          },
        }),
      );
    }
  }
}

export function BroadcastDraftPersistence({
  clearOnSuccess = false,
  formId,
}: {
  clearOnSuccess?: boolean;
  formId: string;
}) {
  useEffect(() => {
    if (clearOnSuccess) {
      window.sessionStorage.removeItem(DRAFT_KEY);
      return;
    }

    const form = document.getElementById(formId);
    if (!(form instanceof HTMLFormElement)) {
      return;
    }

    const rawDraft = window.sessionStorage.getItem(DRAFT_KEY);
    if (rawDraft) {
      try {
        const draft = JSON.parse(rawDraft) as DraftPayload;
        restoreDraft(form, draft);
        window.requestAnimationFrame(() => restoreDraft(form, draft));
      } catch {
        window.sessionStorage.removeItem(DRAFT_KEY);
      }
    }

    const saveDraft = () => {
      window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(collectDraft(form)));
    };

    form.addEventListener("input", saveDraft);
    form.addEventListener("change", saveDraft);
    form.addEventListener("submit", saveDraft);

    return () => {
      form.removeEventListener("input", saveDraft);
      form.removeEventListener("change", saveDraft);
      form.removeEventListener("submit", saveDraft);
    };
  }, [clearOnSuccess, formId]);

  return null;
}
