import type { SubmissionAnswer } from "@/lib/forms/submissions";

function cleanValue(value: string | null | undefined) {
  const cleaned = String(value ?? "").replace(/\s+/g, " ").trim();
  return cleaned && cleaned !== "No answer" ? cleaned : "";
}

function normalizedLabel(answer: Pick<SubmissionAnswer, "label" | "type">) {
  return `${answer.label} ${answer.type}`.toLowerCase();
}

function firstMatchingAnswer(
  answers: SubmissionAnswer[],
  matcher: (answer: SubmissionAnswer) => boolean,
) {
  return cleanValue(answers.find(matcher)?.value);
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function looksLikePhone(value: string) {
  return /^[+()\d\s-]{7,}$/.test(value);
}

export type ClientInference = {
  type: "PERSON" | "BUSINESS";
  name: string;
  email: string;
  phone: string;
  companyName: string;
  address: string;
};

export function inferClientFromSubmissionAnswers(
  answers: SubmissionAnswer[],
): ClientInference {
  const usableAnswers = answers.filter(
    (answer) => !answer.files && !answer.imageDataUrl && cleanValue(answer.value),
  );

  const email =
    firstMatchingAnswer(
      usableAnswers,
      (answer) => answer.type === "email" || normalizedLabel(answer).includes("email"),
    ) || cleanValue(usableAnswers.find((answer) => isEmail(answer.value))?.value);

  const phone =
    firstMatchingAnswer(
      usableAnswers,
      (answer) =>
        answer.type === "phone" ||
        normalizedLabel(answer).includes("phone") ||
        normalizedLabel(answer).includes("mobile"),
    ) || cleanValue(usableAnswers.find((answer) => looksLikePhone(answer.value))?.value);

  const companyName = firstMatchingAnswer(usableAnswers, (answer) => {
    const label = normalizedLabel(answer);
    return (
      label.includes("company") ||
      label.includes("business") ||
      label.includes("organisation") ||
      label.includes("organization") ||
      label.includes("trading name")
    );
  });

  const address = firstMatchingAnswer(usableAnswers, (answer) => {
    const label = normalizedLabel(answer);
    return (
      answer.type === "address" ||
      label.includes("address") ||
      label.includes("suburb") ||
      label.includes("location")
    );
  });

  const name =
    firstMatchingAnswer(usableAnswers, (answer) => {
      const label = normalizedLabel(answer);
      return (
        label.includes("full name") ||
        label === "name text" ||
        label.includes("customer name") ||
        label.includes("client name") ||
        label.includes("contact name")
      );
    }) ||
    cleanValue(
      usableAnswers.find((answer) => {
        const label = normalizedLabel(answer);
        return (
          !label.includes("email") &&
          !label.includes("phone") &&
          !label.includes("mobile") &&
          !label.includes("address") &&
          !label.includes("suburb") &&
          !label.includes("company") &&
          !label.includes("business")
        );
      })?.value,
    ) ||
    companyName ||
    email ||
    "New client";

  return {
    type: companyName ? "BUSINESS" : "PERSON",
    name,
    email,
    phone,
    companyName,
    address,
  };
}
