/**
 * frontend/lib/constants.ts
 * Shared constants and formatting helpers — Cohere design system (DESIGN.md).
 *
 * COLOR PALETTE SOURCE: PALETTE.md
 * Charts use two semantic palette families:
 * - categorical for discrete series/categories
 * - diverging for continuous intensity / delta / sentiment
 * UI chrome (backgrounds, grids, text) stays aligned with the current brand.
 */

// ── Chart palette system ─────────────────────────────────────────────────────
export const DIVERGING_PALETTE = [
  "#73293A",
  "#A14C5E",
  "#D97A79",
  "#FFBB94",
  "#FFD8BF",
  "#FFF0E5",
  "#FFFFFF",
] as const;

export const CATEGORICAL_PALETTE = [
  "#FFBB94",
  "#E85D75",
  "#FF0051",
  "#DA4DFA",
  "#4F46E5",
  "#0F766E",
  "#B08900",
  "#4D1C2D",
] as const;

export const ACCENT_COLORS = [
  "#FF004C",
  "#4D1C2D",
] as const;

export const CHART_NEUTRALS = {
  background: "#FFFFFF",
  grid: "#E9ECEF",
  text: "#4D1C2D",
} as const;

export const ALLOWED_CHART_COLORS = [
  ...DIVERGING_PALETTE,
  ...CATEGORICAL_PALETTE,
  ...ACCENT_COLORS,
  CHART_NEUTRALS.background,
  CHART_NEUTRALS.grid,
  CHART_NEUTRALS.text,
] as const;

export type AllowedChartColor = (typeof ALLOWED_CHART_COLORS)[number];

const ALLOWED_CHART_COLOR_SET = new Set<string>(ALLOWED_CHART_COLORS);

export function isAllowedChartColor(color: string | undefined | null): color is AllowedChartColor {
  return typeof color === "string" && ALLOWED_CHART_COLOR_SET.has(color.toUpperCase());
}

export function chartColor(color: string | undefined | null, fallback: string): string {
  return isAllowedChartColor(color) ? color.toUpperCase() : fallback;
}

export function categoricalColor(index: number): string {
  return CATEGORICAL_PALETTE[index % CATEGORICAL_PALETTE.length];
}

// Backward-compatible alias for existing discrete chart components.
export function chartPaletteColor(index: number): string {
  return categoricalColor(index);
}

export const CHART_PALETTE = CATEGORICAL_PALETTE;

export const CHART_CHROME = {
  paper: CHART_NEUTRALS.background,
  plot: CHART_NEUTRALS.background,
  plotWash: CHART_NEUTRALS.background,
  grid: CHART_NEUTRALS.grid,
  axis: CHART_NEUTRALS.text,
  legend: CHART_NEUTRALS.text,
  tooltipBg: CHART_NEUTRALS.background,
  tooltipBorder: CHART_NEUTRALS.grid,
  tooltipText: CHART_NEUTRALS.text,
  markerStroke: CHART_NEUTRALS.background,
  reference: CHART_NEUTRALS.text,
  emphasis: ACCENT_COLORS[0],
  error: ACCENT_COLORS[0],
} as const;

export function buildDivergingColorscale(stops?: readonly number[]): [number, string][] {
  const palette = [
    DIVERGING_PALETTE[6],
    DIVERGING_PALETTE[4],
    DIVERGING_PALETTE[3],
    DIVERGING_PALETTE[1],
    DIVERGING_PALETTE[0],
  ] as const;
  const normalizedStops = stops ?? [0, 0.2, 0.45, 0.72, 1];

  return palette.map((color, index) => [normalizedStops[index] ?? 1, color] as [number, string]);
}

export const HEATMAP_COLORSCALE: [number, string][] = buildDivergingColorscale();
export const SHORT_FORM_HEATMAP_COLORSCALE: [number, string][] = buildDivergingColorscale([0, 0.16, 0.4, 0.7, 1]);
export const BLUE_HEATMAP_COLORSCALE: [number, string][] = HEATMAP_COLORSCALE;
export const TAROT_HEATMAP_COLORSCALE = HEATMAP_COLORSCALE;
export const ENTERTAINMENT_HEATMAP_COLORSCALE = HEATMAP_COLORSCALE;

export const REFERENCE_COLORS = {
  neutral: CHART_NEUTRALS.text,
  viral: ACCENT_COLORS[0],
  selectedShadow: DIVERGING_PALETTE[0],
} as const;

// ── Stable semantic mappings ─────────────────────────────────────────────────
export const CATEGORY_COLORS: Record<string, string> = {
  Comedy: CATEGORICAL_PALETTE[0],
  Kids: CATEGORICAL_PALETTE[1],
  Music: CATEGORICAL_PALETTE[2],
  Sports: CATEGORICAL_PALETTE[3],
  News: CATEGORICAL_PALETTE[4],
  Education: CATEGORICAL_PALETTE[5],
  Gaming: CATEGORICAL_PALETTE[6],
  Vlog: CATEGORICAL_PALETTE[7],
};

export const DURATION_COLORS: Record<string, string> = {
  Short: CATEGORICAL_PALETTE[0],
  Medium: CATEGORICAL_PALETTE[4],
  Long: CATEGORICAL_PALETTE[7],
};

// ── Label arrays ─────────────────────────────────────────────────────────────
export const CATEGORIES = [
  "Comedy",
  "Kids",
  "Music",
  "Sports",
  "News",
  "Education",
  "Gaming",
  "Vlog",
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  Kids: "Thiếu nhi",
  Gaming: "Trò chơi",
  Music: "Âm nhạc",
  Comedy: "Hài",
  Vlog: "Nhật ký đời sống",
  News: "Tin tức",
  Education: "Giáo dục",
  Sports: "Thể thao",
};

export const SUBSCRIBER_TIERS = ["Mega", "Large", "Mid"] as const;

export const SUBSCRIBER_TIER_LABELS: Record<string, string> = {
  Micro: "Siêu nhỏ",
  Mid: "Trung bình",
  Large: "Lớn",
  Mega: "Siêu lớn",
};

export const DURATION_ORDER = ["Short", "Medium", "Long"] as const;

export const DURATION_LABELS: Record<string, string> = {
  Short: "Ngắn",
  Medium: "Trung bình",
  Long: "Dài",
};

export const DAY_LABELS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"] as const;

export function labelCategory(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

export function labelSubscriberTier(tier: string): string {
  return SUBSCRIBER_TIER_LABELS[tier] ?? tier;
}

export function labelDuration(duration: string): string {
  return DURATION_LABELS[duration] ?? duration;
}

// ── Number formatters ────────────────────────────────────────────────────────
export function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}Tỷ`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}Tr`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}N`;
  return String(Math.round(n));
}

/**
 * Format a ratio (0–1) as a percentage string.
 * formatPercent(0.1234) → "12.3%"
 */
export function formatPercent(p: number): string {
  return `${(p * 100).toFixed(1)}%`;
}
