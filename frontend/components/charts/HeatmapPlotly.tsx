"use client";
/**
 * HeatmapPlotly — dynamic-imported Plotly heatmap.
 * Used for: Chart B1 (channel×year short_form_ratio), Chart E2 (day×hour views).
 * SSR disabled via next/dynamic.
 */
import dynamic from "next/dynamic";
import type { PlotParams } from "react-plotly.js";
import { HEATMAP_COLORSCALE, CHART_CHROME } from "@/lib/constants";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false }) as React.ComponentType<PlotParams>;

interface HeatmapPlotlyProps {
  z: number[][];
  x: string[];
  y: string[];
  colorscale?: [number, string][];
  xLabel?: string;
  yLabel?: string;
  height?: number;
  reversescale?: boolean;
}

export function HeatmapPlotly({
  z,
  x,
  y,
  colorscale = HEATMAP_COLORSCALE,
  xLabel,
  yLabel,
  height = 340,
  reversescale = true,
}: HeatmapPlotlyProps) {
  return (
    <Plot
      data={[
        {
          type: "heatmap",
          z,
          x,
          y,
          colorscale,
          reversescale,
          showscale: true,
          hoverongaps: false,
        } as Plotly.Data,
      ]}
      layout={{
        paper_bgcolor: CHART_CHROME.paper,
        plot_bgcolor: CHART_CHROME.plot,
        height,
        margin: { t: 8, r: 8, b: 60, l: 100 },
        font: { family: "Inter, Arial, sans-serif", size: 12, color: CHART_CHROME.tooltipText },
        xaxis: {
          title: xLabel ? { text: xLabel } : undefined,
          showgrid: false,
          tickfont: { size: 11, color: CHART_CHROME.axis },
        },
        yaxis: {
          title: yLabel ? { text: yLabel } : undefined,
          showgrid: false,
          tickfont: { size: 11, color: CHART_CHROME.axis },
          automargin: true,
        },

      }}
      config={{ responsive: true, displayModeBar: false }}
      style={{ width: "100%" }}
      useResizeHandler
    />
  );
}
