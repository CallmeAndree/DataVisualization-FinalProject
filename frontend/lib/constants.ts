/**
 * frontend/lib/constants.ts
 * Shared constants and formatting helpers — Cohere design system (DESIGN.md).
 *
 * COLOR PALETTE SOURCE: PALLETE.md (enforced as of 2026-05-10)
 * All chart colors use the warm peachy-pink palette from PALLETE.md.
 * UI chrome (backgrounds, grids, text) uses Cohere design tokens for light mode.
 */

// ── Chart color palette ──────────────────────────────────────────────────────
// Strict chart palettes from PALLETE.md. All dashboard charts and AI-generated
// charts must use only these values for marks, heatmaps, references, and chart
// chrome colors.
// Source: PALLETE.md - Warm peachy-pink theme for series colors
// Series palette: FFBB94 → FB9590 → DC586D → D44673 → B23E59 → 73293A (light → dark)
export const PASTEL_COLORS = [
  "#FFBB94",  // Light peachy
  "#FB9590",  // Light pink-coral
  "#DC586D",  // Medium rose-pink
  "#D44673",  // Darker pink
  "#B3546A",  // Deep burgundy
  "#73293A",  // Very dark burgundy
] as const;

export const ACCENT_COLORS = [
  "#FF004C",  // Hot pink/red - highlight, outliers, anomalies
  "#4D1C2D",  // Very dark burgundy - text, alternative to black
] as const;

export const CHART_NEUTRALS = {
  background: "#F8F9FA",
  grid: "#E9ECEF",
  text: "#4D1C2D",  // Dark burgundy text
} as const;

// All allowed chart colors from PALLETE.md (purple-pink palette + accents + neutrals)
export const ALLOWED_CHART_COLORS = [
  ...PASTEL_COLORS,
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

export function chartPaletteColor(index: number): string {
  return PASTEL_COLORS[index % PASTEL_COLORS.length];
}

export const CHART_PALETTE = PASTEL_COLORS;

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
  reference: CHART_NEUTRALS.text,      // Regular reference line
  emphasis: ACCENT_COLORS[0],          // #FF004C - Hot pink for emphasis/hover/outliers
  error: ACCENT_COLORS[0],             // #FF004C - Hot pink for error state
} as const;

// Heatmap gradient: white → light peachy → deep burgundy (warm gradient)
// Uses first and last color from PASTEL_COLORS for smooth saturation decrease
export const HEATMAP_COLORSCALE: [number, string][] = [
  [0, "#ffffff"],
  [0.33, "#FFBB94"],  // PASTEL_COLORS[0] - Light peachy
  [0.66, "#DC586D"],  // PASTEL_COLORS[2] - Medium rose-pink
  [1, "#73293A"],     // PASTEL_COLORS[5] - Very dark burgundy
];

// Short-form heatmap: white → peachy-pink palette with gradual saturation
export const SHORT_FORM_HEATMAP_COLORSCALE: [number, string][] = [
  [0, "#ffffff"],
  [0.15, "#FFBB94"],  // PASTEL_COLORS[0]
  [0.30, "#FB9590"],  // PASTEL_COLORS[1]
  [0.45, "#DC586D"],  // PASTEL_COLORS[2]
  [0.60, "#D44673"],  // PASTEL_COLORS[3]
  [0.75, "#B3546A"],  // PASTEL_COLORS[4]
  [1, "#73293A"],     // PASTEL_COLORS[5]
];

// Alternative heatmap (same as heatmap): white → burgundy gradient
export const BLUE_HEATMAP_COLORSCALE: [number, string][] = [
  [0, "#ffffff"],
  [0.33, "#FFBB94"],  // PASTEL_COLORS[0]
  [0.66, "#DC586D"],  // PASTEL_COLORS[2]
  [1, "#73293A"],     // PASTEL_COLORS[5]
];

export const TAROT_HEATMAP_COLORSCALE = BLUE_HEATMAP_COLORSCALE;
export const ENTERTAINMENT_HEATMAP_COLORSCALE = HEATMAP_COLORSCALE;

export const REFERENCE_COLORS = {
  neutral: CHART_NEUTRALS.text,      // Dark text
  viral: ACCENT_COLORS[0],           // #FF004C - Hot pink for viral/outliers
  selectedShadow: PASTEL_COLORS[0],  // #FFBB94 - Light peachy
} as const;

// ── Category palette ────────────────────────────────────────────────────────
// Strictly derived from the new warm peachy-pink palette.
// Mapping categories to series colors: Comedy→#FFBB94, Kids→#FB9590, Music→#DC586D,
// Sports→#D44673, News→#B23E59, Education→#73293A, Gaming→#FF004C (highlight), Vlog→#4D1C2D (dark)
export const CATEGORY_COLORS: Record<string, string> = {
  Comedy: PASTEL_COLORS[0],    // #FFBB94 - Light peachy
  Kids: PASTEL_COLORS[1],      // #FB9590 - Light pink-coral
  Music: PASTEL_COLORS[2],     // #DC586D - Medium rose-pink
  Sports: PASTEL_COLORS[3],    // #D44673 - Darker pink
  News: PASTEL_COLORS[4],      // #B3546A - Deep burgundy
  Education: PASTEL_COLORS[5], // #73293A - Very dark burgundy
  Gaming: ACCENT_COLORS[0],    // #FF004C - Hot pink (highlight category)
  Vlog: ACCENT_COLORS[1],      // #4D1C2D - Dark burgundy
};

// Duration color mapping: Short→light peachy, Medium→medium pink, Long→deep burgundy
// Progressive intensity: Short (urgent/quick) → Medium (balanced) → Long (deep/sustained)
export const DURATION_COLORS: Record<string, string> = {
  Short: PASTEL_COLORS[0],   // #FFBB94 - Light peachy (quick view)
  Medium: PASTEL_COLORS[2],  // #DC586D - Medium rose-pink (balanced)
  Long: PASTEL_COLORS[5],    // #73293A - Very dark burgundy (sustained)
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
