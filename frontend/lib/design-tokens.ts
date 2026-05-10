/**
 * frontend/lib/design-tokens.ts
 * Cohere design system tokens from DESIGN.md
 */

// ── Color tokens ─────────────────────────────────────────────────────────────
export const COLORS = {
  // Primary & backgrounds
  primary: "#4D1C2D",           // CTA chính, footer, dark UI cards
  cohereBlack: "#4D1C2D",       // Text đậm thay cho black
  deepGreen: "#73293A",         // Dark product band cho dashboard
  darkNavy: "#73293A",          // Secondary dark
  ink: "#4D1C2D",               // Body text trên nền sáng
  canvas: "#ffffff",            // Page background
  softStone: "#FFBB94",         // Warm neutral — filter bar surface
  paleGreen: "#edfce9",         // Section backdrop tươi
  paleBlue: "#f1f5ff",          // CTA backdrop tươi

  // Borders & dividers
  cardBorder: "#f2f2f2",        // Card outline mềm nhất
  hairline: "#d9d9dd",          // List rule, divider
  borderLight: "#e5e7eb",       // Secondary divider

  // Text colors
  muted: "#93939f",             // Footer, metadata
  slate: "#75758a",             // Tertiary text
  bodyMuted: "#616161",         // Body de-emphasized

  // Action & interactive
  actionBlue: "#FF004C",        // Primary action accent
  focusBlue: "#FF004C",         // Focus ring
  coral: "#FF004C",             // Taxonomy chip (logs filter)
  coralSoft: "#ffad9b",         // Soft chip border
  formFocus: "#B23E59",         // Input focus border
  error: "#b30000",             // Validation error
} as const;

// ── Tailwind class helpers ──────────────────────────────────────────────────
// Map design tokens to Tailwind utility classes for consistency
export const TEXT_COLORS = {
  ink: "text-[#4D1C2D]",
  muted: "text-[#93939f]",
  slate: "text-[#75758a]",
  bodyMuted: "text-[#616161]",
  actionBlue: "text-[#FF004C]",
  white: "text-white",
} as const;

export const BG_COLORS = {
  canvas: "bg-[#ffffff]",
  primary: "bg-[#4D1C2D]",
  deepGreen: "bg-[#73293A]",
  softStone: "bg-[#FFBB94]",
  paleGreen: "bg-[#edfce9]",
  paleBlue: "bg-[#f1f5ff]",
  cardBorder: "bg-[#f2f2f2]",
} as const;

export const BORDER_COLORS = {
  cardBorder: "border-[#f2f2f2]",
  hairline: "border-[#d9d9dd]",
  borderLight: "border-[#e5e7eb]",
  actionBlue: "border-[#FF004C]",
} as const;
