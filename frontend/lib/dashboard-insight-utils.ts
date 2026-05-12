import type { FilterState } from "@/app/MultiDimensionalFilterContext";
import {
  STATIC_DASHBOARD_INSIGHTS,
  type StaticDashboardInsight,
  type StaticDashboardKey,
} from "@/lib/static-dashboard-insights";

export function isDefaultFilterState(filters: FilterState): boolean {
  return Object.values(filters).every((value) => value === null);
}

export function isDefaultYearRange(yearRange: number[], defaultRange: readonly [number, number]): boolean {
  return yearRange[0] === defaultRange[0] && yearRange[1] === defaultRange[1];
}

export function formatStaticInsight(insight: StaticDashboardInsight): string {
  const sections: string[] = [];

  if (insight.analysis.length > 0) {
    sections.push(`Phan tich bieu do:\n${insight.analysis.map((item) => `- ${item}`).join("\n")}`);
  }

  sections.push(`Insight:\n${insight.insight}`);

  if (insight.action && insight.action.length > 0) {
    sections.push(`Action:\n${insight.action.map((item) => `- ${item}`).join("\n")}`);
  }

  return sections.join("\n\n");
}

export function getStaticInsightContent(page: StaticDashboardKey): string {
  return formatStaticInsight(STATIC_DASHBOARD_INSIGHTS[page]);
}
