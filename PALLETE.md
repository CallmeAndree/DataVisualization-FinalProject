# Color Palette - PALLETE.md

**Status:** ✅ ENFORCED across all charts (as of 2026-05-09)

This palette is the **source of truth** for all chart colors in the dashboard and AI-generated visualizations.

**Design principle:** Blue-toned colors are avoided in favor of warmer purple-pink tones for better visual harmony.

## Purple-Pink Chart Colors (Series/Marks)

PURPLE_PINK_COLORS = [
    "#C77DFF", "#E040FB", "#FF80AB", "#B39DDB", "#FF6FD8",
    "#D5AAFF", "#F48FB1", "#9FA8DA", "#FF8DC7", "#CE93D8"
]

ACCENT_COLORS = ["#7C4DFF", "#E91E8C", "#AA00FF", "#880E4F", "#5b71f1"]

## Light Mode UI Chrome (Cohere Design System)

# Light mode
BACKGROUND_LIGHT = "#ffffff"
GRID_COLOR = "#e5e7eb"
TEXT_COLOR = "#212121"

## Dark Mode (Not Currently Implemented)

# Dark mode - Midnight Plum
BACKGROUND  = "#1A0A2E"
PANEL_COLOR = "#2D1B55"
TEXT_COLOR  = "#F3E5F5"
GRID_COLOR  = "#4A3560"

## Implementation

- **Frontend:** `frontend/lib/constants.ts` exports these colors
- **Backend:** `backend/app/services/llm/prompts.py` enforces these in AI-generated code
- **Charts:** All 11 chart components import from `constants.ts`
- **Dashboard:** All 7 pages use these colors automatically