"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { SubmitButton } from "@/components/ui/submit-button";

export type OnboardingStepperItem = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  actionLabel: string;
  href?: string;
};

type OnboardingStepperProps = {
  checklistComplete: boolean;
  completedCount: number;
  hideAction: () => Promise<void>;
  items: OnboardingStepperItem[];
  totalCount: number;
};

export function OnboardingStepper({
  checklistComplete,
  completedCount,
  hideAction,
  items,
  totalCount,
}: OnboardingStepperProps) {
  const initialStep = useMemo(() => {
    const firstIncompleteIndex = items.findIndex((item) => !item.completed);

    return firstIncompleteIndex >= 0 ? firstIncompleteIndex : 0;
  }, [items]);
  const [currentStep, setCurrentStep] = useState(initialStep);
  const item = items[currentStep];
  const progressWidth = totalCount ? (completedCount / totalCount) * 100 : 0;

  if (!item) {
    return null;
  }

  return (
    <section className="fixed inset-x-4 bottom-4 z-40 rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-950/15 sm:inset-x-auto sm:right-4 sm:w-[28rem] sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
            Setup Progress
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">
            Set up your FormOS workspace
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {completedCount} / {totalCount} completed
          </p>
        </div>
        <form action={hideAction}>
          <SubmitButton
            className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-50"
            pendingText="Hiding..."
            showStatus={false}
          >
            Hide
          </SubmitButton>
        </form>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{ width: `${progressWidth}%` }}
        />
      </div>

      {checklistComplete ? (
        <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Your FormOS workspace is ready.
        </p>
      ) : null}

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              item.completed
                ? "bg-emerald-100 text-emerald-700"
                : "bg-white text-slate-400"
            }`}
          >
            {item.completed ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Circle className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-slate-950">{item.title}</p>
              {item.completed ? (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  Complete
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {item.description}
            </p>
          </div>
        </div>

        {item.href ? (
          <Link
            className={`mt-4 inline-flex w-full justify-center rounded-2xl px-3 py-2 text-sm font-semibold transition ${
              item.completed
                ? "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
            href={item.href}
          >
            {item.actionLabel}
          </Link>
        ) : (
          <span className="mt-4 inline-flex w-full justify-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-500">
            {item.actionLabel}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={currentStep === 0}
          onClick={() => setCurrentStep((step) => Math.max(step - 1, 0))}
          type="button"
        >
          Back
        </button>
        <span className="text-xs font-medium text-slate-500">
          Step {currentStep + 1} of {items.length}
        </span>
        <button
          className="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={currentStep === items.length - 1}
          onClick={() =>
            setCurrentStep((step) => Math.min(step + 1, items.length - 1))
          }
          type="button"
        >
          Next
        </button>
      </div>
    </section>
  );
}
