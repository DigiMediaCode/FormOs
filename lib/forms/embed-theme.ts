import type { CSSProperties } from "react";

type EmbedThemeSearchParams = {
  theme?: string;
  accent?: string;
  bg?: string;
  border?: string;
  radius?: string;
  compact?: string;
  font?: string;
  surface?: string;
  text?: string;
};

const THEMES = ["light", "dark", "auto"] as const;
const BACKGROUNDS = ["white", "transparent", "subtle", "none"] as const;
const RADII = ["0", "6", "8", "12", "16", "20"] as const;
const FONTS = ["system", "sans", "inherit"] as const;

type EmbedTheme = (typeof THEMES)[number];
type EmbedBackground = (typeof BACKGROUNDS)[number];
type EmbedRadius = (typeof RADII)[number];
type EmbedFont = (typeof FONTS)[number];

function allowed<T extends readonly string[]>(
  value: string | undefined,
  values: T,
  fallback: T[number],
) {
  return values.includes(value ?? "") ? (value as T[number]) : fallback;
}

function hexColor(value: string | undefined, fallback: string) {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(normalized) ? normalized : fallback;
}

function booleanString(value: string | undefined) {
  return value === "true";
}

function textColorFor(accent: string) {
  const hex = accent.replace("#", "");
  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

  return luminance > 0.62 ? "#0f172a" : "#ffffff";
}

function bgColor(background: EmbedBackground) {
  if (background === "transparent" || background === "none") {
    return "transparent";
  }

  if (background === "subtle") {
    return "#f8fafc";
  }

  return "#ffffff";
}

function fontFamily(font: EmbedFont) {
  if (font === "inherit") {
    return "inherit";
  }

  return "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif";
}

export function getEmbedTheme(searchParams: EmbedThemeSearchParams) {
  const theme = allowed(searchParams.theme, THEMES, "light") as EmbedTheme;
  const background = allowed(searchParams.bg, BACKGROUNDS, "transparent") as EmbedBackground;
  const radius = allowed(searchParams.radius, RADII, "12") as EmbedRadius;
  const compact = booleanString(searchParams.compact);
  const font = allowed(searchParams.font, FONTS, "system") as EmbedFont;
  const accent = hexColor(searchParams.accent, "#2563eb");
  const accentText = textColorFor(accent);
  const defaultSurface = theme === "dark" ? "#0f172a" : "#ffffff";
  const defaultMutedSurface = theme === "dark" ? "#111827" : "#f8fafc";
  const defaultBorder = theme === "dark" ? "#334155" : "#e2e8f0";
  const defaultText = theme === "dark" ? "#f8fafc" : "#0f172a";
  const defaultMutedText = theme === "dark" ? "#cbd5e1" : "#475569";
  const surface = hexColor(searchParams.surface, defaultSurface);
  const mutedSurface =
    searchParams.surface && /^#[0-9a-fA-F]{6}$/.test(searchParams.surface.trim())
      ? surface
      : defaultMutedSurface;
  const border = hexColor(searchParams.border, defaultBorder);
  const text = hexColor(searchParams.text, defaultText);
  const mutedText =
    searchParams.text && /^#[0-9a-fA-F]{6}$/.test(searchParams.text.trim())
      ? text
      : defaultMutedText;

  const style = {
    "--formos-embed-accent": accent,
    "--formos-embed-accent-text": accentText,
    "--formos-embed-bg": bgColor(background),
    "--formos-embed-surface": surface,
    "--formos-embed-muted-surface": mutedSurface,
    "--formos-embed-border": border,
    "--formos-embed-text": text,
    "--formos-embed-muted-text": mutedText,
    "--formos-embed-radius": `${radius}px`,
    "--formos-embed-gap": compact ? "0.65rem" : "1rem",
    "--formos-embed-pad": compact ? "1rem" : "1.25rem",
    "--formos-embed-font": fontFamily(font),
  } as CSSProperties;

  return {
    theme,
    background,
    radius,
    compact,
    font,
    accent,
    border,
    surface,
    text,
    style,
  };
}

export const embedThemeCss = `
.formos-embed-scope {
  background: var(--formos-embed-bg);
  color: var(--formos-embed-text);
  font-family: var(--formos-embed-font);
}
.formos-embed-scope section,
.formos-embed-scope header,
.formos-embed-scope input,
.formos-embed-scope textarea,
.formos-embed-scope select,
.formos-embed-scope button,
.formos-embed-scope label,
.formos-embed-scope .rounded-lg,
.formos-embed-scope .rounded-xl,
.formos-embed-scope .rounded-2xl {
  border-radius: var(--formos-embed-radius);
}
.formos-embed-scope header,
.formos-embed-scope .bg-white {
  background: var(--formos-embed-surface);
}
.formos-embed-scope .shadow-sm {
  box-shadow: none;
}
.formos-embed-scope .bg-slate-50,
.formos-embed-scope .from-white,
.formos-embed-scope .to-slate-50 {
  background: var(--formos-embed-muted-surface);
}
.formos-embed-scope .border-slate-100,
.formos-embed-scope .border-slate-200,
.formos-embed-scope .border-slate-300 {
  border-color: var(--formos-embed-border);
}
.formos-embed-scope .text-slate-950,
.formos-embed-scope .text-slate-900,
.formos-embed-scope .text-slate-800 {
  color: var(--formos-embed-text);
}
.formos-embed-scope .text-slate-700,
.formos-embed-scope .text-slate-600,
.formos-embed-scope .text-slate-500 {
  color: var(--formos-embed-muted-text);
}
.formos-embed-scope input,
.formos-embed-scope textarea,
.formos-embed-scope select {
  background: var(--formos-embed-surface);
  border-color: var(--formos-embed-border);
  color: var(--formos-embed-text);
}
.formos-embed-scope input:focus,
.formos-embed-scope textarea:focus,
.formos-embed-scope select:focus {
  border-color: var(--formos-embed-accent);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--formos-embed-accent), transparent 82%);
}
.formos-embed-scope button[type="submit"],
.formos-embed-scope input::file-selector-button {
  background: var(--formos-embed-accent);
  color: var(--formos-embed-accent-text);
}
.formos-embed-scope .text-blue-700 {
  color: var(--formos-embed-accent);
}
.formos-embed-scope .border-t-4 {
  border-top-color: var(--formos-embed-accent);
}
.formos-embed-scope [data-formos-embed-inner] {
  gap: var(--formos-embed-gap);
}
.formos-embed-scope [data-formos-embed-inner] > section {
  padding: var(--formos-embed-pad);
}
.formos-embed-scope[data-theme="auto"] {
  color-scheme: light dark;
}
@media (prefers-color-scheme: dark) {
  .formos-embed-scope[data-theme="auto"] {
    --formos-embed-surface: #0f172a;
    --formos-embed-muted-surface: #111827;
    --formos-embed-border: #334155;
    --formos-embed-text: #f8fafc;
    --formos-embed-muted-text: #cbd5e1;
  }
}
`;
