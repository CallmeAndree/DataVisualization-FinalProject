/**
 * frontend/lib/constants.ts
 * Shared constants and formatting helpers — Cohere design system (DESIGN.md).
 *
 * COLOR PALETTE SOURCE: PALLETE.md (enforced as of 2026-05-09)
 * All chart colors use the purple-pink palette from PALLETE.md.
 * UI chrome (backgrounds, grids, text) uses Cohere design tokens for light mode.
 */

// ── Chart color palette ──────────────────────────────────────────────────────
// Strict chart palettes from PALLETE.md. All dashboard charts and AI-generated
// charts must use only these values for marks, heatmaps, references, and chart
// chrome colors.
// Source: PALLETE.md - Purple-Pink theme for series colors
export const PASTEL_COLORS = [
  "#C77DFF",
  "#E040FB",
  "#FF80AB",
  "#B39DDB",
  "#FF6FD8",
  "#D5AAFF",
  "#F48FB1",
  "#9FA8DA",
  "#FF8DC7",
  "#CE93D8",
] as const;

export const ACCENT_COLORS = [
  "#7C4DFF",  // Deep purple
  "#E91E8C",  // Hot pink (viral reference)
  "#E040FB",  // Magenta (Short duration)
  "#AA00FF",  // Deep orchid (Long duration, emphasis)
  "#880E4F",  // Dark magenta (error)
  "#FF6FD8",  // Bright pink
] as const;

export const CHART_NEUTRALS = {
  background: "#F8F9FA",
  grid: "#E9ECEF",
  text: "#212529",
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
  reference: ACCENT_COLORS[1],  // #E91E8C - Viral reference
  emphasis: ACCENT_COLORS[3],   // #AA00FF - Emphasis/hover
  error: ACCENT_COLORS[4],      // #880E4F - Error state
} as const;

// Warm gradient: white → light pink → hot pink
export const HEATMAP_COLORSCALE: [number, string][] = [
  [0, "#ffffff"],
  [0.5, "#FF80AB"],  // PASTEL_COLORS[2]
  [1, "#E91E8C"],    // ACCENT_COLORS[1]
];

export const SHORT_FORM_HEATMAP_COLORSCALE: [number, string][] = [
  [0, "#ffffff"],
  [0.12, "#D5AAFF"],
  [0.25, "#C77DFF"],
  [0.38, "#B39DDB"],
  [0.5, "#FF80AB"],
  [0.62, "#FF8DC7"],
  [0.75, "#FF6FD8"],
  [0.88, "#E040FB"],
  [1, "#E91E8C"],
];

// Cool gradient: white → lavender → deep purple
export const BLUE_HEATMAP_COLORSCALE: [number, string][] = [
  [0, "#ffffff"],
  [0.5, "#B39DDB"],  // PASTEL_COLORS[3]
  [1, "#7C4DFF"],    // ACCENT_COLORS[0]
];

export const TAROT_HEATMAP_COLORSCALE = BLUE_HEATMAP_COLORSCALE;
export const ENTERTAINMENT_HEATMAP_COLORSCALE = HEATMAP_COLORSCALE;

export const REFERENCE_COLORS = {
  neutral: CHART_NEUTRALS.text,
  viral: ACCENT_COLORS[1],      // #E91E8C - Hot pink accent
  selectedShadow: PASTEL_COLORS[2],  // #FF80AB - Light pink
} as const;

// ── Category palette ────────────────────────────────────────────────────────
// Strictly derived from the two PALLETE.md palettes to keep stable category order.
// Mapping: Comedy→#C77DFF, Kids→#FF80AB, Music→#E040FB, Sports→#FF8DC7,
//          News→#F48FB1, Education→#D5AAFF, Gaming→#FF6FD8, Vlog→#CE93D8
// Note: Blue-toned colors avoided in favor of warmer purple-pink tones
export const CATEGORY_COLORS: Record<string, string> = {
  Comedy: PASTEL_COLORS[0],    // #C77DFF - Primary purple
  Kids: PASTEL_COLORS[2],      // #FF80AB - Playful pink
  Music: PASTEL_COLORS[1],     // #E040FB - Vibrant magenta
  Sports: PASTEL_COLORS[8],    // #FF8DC7 - Bright pink (was #B39DDB blue-lavender)
  News: PASTEL_COLORS[6],      // #F48FB1 - Warm pink (was #9FA8DA blue-purple)
  Education: PASTEL_COLORS[5], // #D5AAFF - Light purple
  Gaming: PASTEL_COLORS[4],    // #FF6FD8 - Hot pink
  Vlog: PASTEL_COLORS[9],      // #CE93D8 - Soft orchid
};

// Duration color mapping: Short→#E040FB (magenta), Medium→#7C4DFF (purple), Long→#AA00FF (orchid)
// Purple-pink progression: bright magenta (urgency) → deep purple (balanced) → deep orchid (depth)
export const DURATION_COLORS: Record<string, string> = {
  Short: ACCENT_COLORS[2],   // #E040FB - Magenta (was #FF1744 red)
  Medium: ACCENT_COLORS[0],  // #7C4DFF - Deep purple (unchanged)
  Long: ACCENT_COLORS[3],    // #AA00FF - Deep orchid (was #3D5AFE blue)
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
