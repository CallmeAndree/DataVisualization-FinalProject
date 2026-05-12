# Color Palette - PALETTE.md

**Status:** ✅ Enforced for dashboard charts and AI-generated visualizations

This document is the source of truth for chart color usage across the project.

## Palette System

The dashboard uses 2 separate semantic palette families:

- `DIVERGING_PALETTE` for continuous intensity, deviation, sentiment, variance, and gain/loss
- `CATEGORICAL_PALETTE` for discrete categories and series

The brand vibe stays warm, saturated, and expressive. The divergence palette is also the website's chart identity palette, while categorical colors stay reserved for discrete series only.

## Diverging Palette

Use only for continuous or semantic value scales:

- heatmap
- correlation matrix
- KPI gain/loss
- sentiment chart
- continuous scale
- gradient legend
- variance visualization
- choropleth map
- any chart encoding low -> high or negative <-> positive intensity

```ts
export const DIVERGING_PALETTE = [
  "#73293A",
  "#A14C5E",
  "#D97A79",
  "#FFBB94",
  "#FFD8BF",
  "#FFF0E5",
  "#FFFFFF",
];
```

Rules:

- preserve the progression order of the palette
- use as a continuous/diverging scale, not as random categorical assignment
- support smooth interpolation for continuous values
- for heatmaps and any soft gradient, use a restrained bloom built only from `#73293A` -> `#FFBB94` -> `#FFFFFF`
- if a library expects low values first, order the colorscale `#FFFFFF` -> `#FFBB94` -> `#73293A`; if it expects the reverse, keep the same 3 anchor colors but invert the stops
- do not introduce extra unrelated shades outside this divergence family
- low values should feel lighter; high values should feel darker or more saturated

## Categorical Palette

Use only for discrete categories and series:

- bar chart
- grouped bar chart
- stacked bar chart
- pie chart
- donut chart
- multi-line chart
- category-based area chart
- radar chart
- treemap
- sankey category
- any chart encoding separate categories

```ts
export const CATEGORICAL_PALETTE = [
  "#FFBB94", // Peach
  "#E85D75", // Coral Red
  "#FF0051", // Brand Red
  "#DA4DFA", // Orchid Violet
  "#4F46E5", // Indigo
  "#0F766E", // Teal
  "#B08900", // Olive Gold
  "#4D1C2D", // Espresso
];
```

Rules:

- each category/series gets one distinct color
- color mapping must stay stable across renders
- legend colors must stay consistent with plotted marks
- do not use diverging colors as random category picks

## Shared Chart Chrome

```ts
export const ACCENT_COLORS = ["#FF004C", "#4D1C2D"];

export const CHART_NEUTRALS = {
  background: "#FFFFFF",
  grid: "#E9ECEF",
  text: "#4D1C2D",
};
```

These values are for chart chrome only:

- background / paper / plot: `#FFFFFF`
- grid / borders: `#E9ECEF`
- text / axes / legend: `#4D1C2D`
- emphasis / anomalies / selected highlight: `#FF004C`

## Implementation

- **Frontend:** `frontend/lib/constants.ts` defines both palettes and stable semantic mappings
- **Backend:** `backend/app/services/llm/prompts.py` instructs AI-generated chart code to apply the same rules
- **Charts:** discrete charts consume categorical colors; heatmaps and other continuous visuals consume diverging scales
- **Non-chart UI:** sidebar, buttons, and other interface components keep the existing website brand styling and are not changed by this spec
