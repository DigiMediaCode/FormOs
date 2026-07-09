"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Lock, Search } from "lucide-react";

type TemplateCard = {
  routeSlug: string;
  category: string;
  title: string;
  description: string;
  minimumPlanName: string | null;
};

export function HomepageTemplates({
  templates,
}: {
  templates: TemplateCard[];
}) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [query, setQuery] = useState("");

  const categories = useMemo(() => {
    const seen: string[] = [];
    for (const template of templates) {
      if (!seen.includes(template.category)) {
        seen.push(template.category);
      }
    }
    return seen;
  }, [templates]);

  const chips = useMemo(
    () => [
      { label: "All", value: "all", count: templates.length },
      ...categories.map((category) => ({
        label: category,
        value: category,
        count: templates.filter((template) => template.category === category)
          .length,
      })),
    ],
    [categories, templates],
  );

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();

    return templates.filter((template) => {
      if (activeCategory !== "all" && template.category !== activeCategory) {
        return false;
      }

      if (!search) {
        return true;
      }

      return (
        template.title.toLowerCase().includes(search) ||
        template.description.toLowerCase().includes(search) ||
        template.category.toLowerCase().includes(search)
      );
    });
  }, [templates, activeCategory, query]);

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => {
            const isActive = chip.value === activeCategory;

            return (
              <button
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  isActive
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-blue-100 bg-white text-slate-700 hover:bg-blue-50"
                }`}
                key={chip.value}
                onClick={() => setActiveCategory(chip.value)}
                type="button"
              >
                {chip.label}
                <span
                  className={`ml-1.5 ${isActive ? "text-blue-100" : "text-slate-400"}`}
                >
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-full border border-blue-100 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search templates..."
            type="search"
            value={query}
          />
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-5">
          {filtered.map((template) => (
            <Link
              className="flex flex-col rounded-2xl border border-blue-100 bg-white p-4 shadow-sm shadow-blue-950/5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              href={`/templates/${template.routeSlug}`}
              key={template.routeSlug}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  {template.category}
                </span>
                {template.minimumPlanName ? (
                  <span
                    className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                    title="Minimum plan required to use this template"
                  >
                    <Lock className="size-3" />
                    {template.minimumPlanName}
                  </span>
                ) : null}
              </div>
              <h3 className="mt-3 text-base font-semibold leading-6 text-slate-950">
                {template.title}
              </h3>
              <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-600">
                {template.description}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-8 rounded-2xl border border-blue-100 bg-white p-6 text-center text-sm text-slate-600">
          No templates match your search. Try a different keyword or category.
        </p>
      )}
    </div>
  );
}
