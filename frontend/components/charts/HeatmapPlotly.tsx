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
  onCellClick?: (x: string | number, y: string | number, value: number) => void;
  selectedCell?: { x: string | number; y: string | number };
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
  onCellClick,
  selectedCell,
}: HeatmapPlotlyProps) {
  const shapes = selectedCell
    ? [
        {
          type: "rect" as const,
          xref: "x" as const,
          yref: "y" as const,
          x0: selectedCell.x,
          x1: selectedCell.x,
          y0: selectedCell.y,
          y1: selectedCell.y,
          line: { color: CHART_CHROME.emphasis, width: 3 },
          fillcolor: "rgba(0,0,0,0)",
        },
      ]
    : undefined;

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
        hovermode: "closest",
        dragmode: false,
        shapes,
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
      style={{ width: "100%", cursor: onCellClick ? "pointer" : "default" }}
      onClick={(event) => {
        const point = event.points?.[0] as (Plotly.PlotDatum & { z?: number }) | undefined;
        if (!point || !onCellClick) return;
        onCellClick(point.x as string | number, point.y as string | number, Number(point.z ?? 0));
      }}
      useResizeHandler
    />
  );
}
