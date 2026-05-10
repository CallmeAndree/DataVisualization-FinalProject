"use client";
/**
 * ScatterPlotly — dynamic-imported Plotly scatter chart.
 * Used for: Chart C2 (sub vs avg_view), Chart D1 (view vs like_view_ratio suspect).
 * SSR disabled via next/dynamic.
 */
import dynamic from "next/dynamic";
import type { PlotParams } from "react-plotly.js";
import { chartColor, chartPaletteColor, CHART_CHROME } from "@/lib/constants";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false }) as React.ComponentType<PlotParams>;

export interface ScatterPointClickData {
  name: string;
  x: number;
  y: number;
  text?: string;
  category?: string;
}

interface ScatterTrace {
  name: string;
  x: number[];
  y: number[];
  text?: string[];
  category?: string;
  marker?: Partial<Plotly.PlotMarker>;
  markerSize?: number;
}

interface ScatterPlotlyProps {
  traces: ScatterTrace[];
  xAxisType?: "log" | "linear";
  yAxisType?: "log" | "linear";
  xLabel?: string;
  yLabel?: string;
  height?: number;
  markerSize?: number;
  percentY?: boolean;
  referenceX?: number;
  referenceY?: number;
  quadrantLabels?: string[];
  onPointClick?: (point: ScatterPointClickData) => void;
  selectedPoint?: { name: string };
  isolatedSelection?: boolean;
}

export function ScatterPlotly({
  traces,
  xAxisType = "linear",
  yAxisType = "linear",
  xLabel,
  yLabel,
  height = 320,
  markerSize = 5,
  percentY = false,
  referenceX,
  referenceY,
  quadrantLabels,
  onPointClick,
  selectedPoint,
  isolatedSelection = false,
}: ScatterPlotlyProps) {
  return (
    <Plot
      data={traces.map((t, index) => {
        const traceColor = chartColor(
          Array.isArray(t.marker?.color) ? undefined : (t.marker?.color as string | undefined),
          chartPaletteColor(index)
        );
        const opacities = t.x.map((_, pointIndex) => {
          const pointName = t.text?.[pointIndex] ?? t.name;
          if (!selectedPoint) return t.marker?.opacity ?? 0.75;
          return pointName === selectedPoint.name ? 1 : (isolatedSelection ? 0 : 0.35);
        });
        const lineWidths = t.x.map((_, pointIndex) => {
          const pointName = t.text?.[pointIndex] ?? t.name;
          return selectedPoint && pointName === selectedPoint.name ? 2.5 : 0.5;
        });

        return {
          type: "scatter",
          mode: "markers",
          name: t.name,
          x: t.x,
          y: t.y,
          text: t.text,
          customdata: t.x.map((_, pointIndex) => [
            t.text?.[pointIndex] ?? t.name,
            t.category ?? t.name,
          ]),
          hovertemplate: t.text
            ? "<b>%{text}</b><br>x: %{x}<br>y: %{y}<extra></extra>"
            : "x: %{x}<br>y: %{y}<extra></extra>",
          marker: {
            ...t.marker,
            size: t.marker?.size ?? t.markerSize ?? markerSize,
            opacity: opacities,
            color: traceColor,
            line: { width: lineWidths, color: CHART_CHROME.markerStroke, ...t.marker?.line },
          },
        } as Plotly.Data;
      })}
      layout={{
        paper_bgcolor: CHART_CHROME.paper,
        plot_bgcolor: CHART_CHROME.plot,
        height,
        margin: { t: 8, r: 8, b: 60, l: 60 },
        font: { family: "Inter, Arial, sans-serif", size: 12, color: CHART_CHROME.tooltipText },
        showlegend: traces.length > 1,
        legend: { font: { size: 11, color: CHART_CHROME.legend } },
        hovermode: "closest",
        dragmode: false,
        xaxis: {
          title: xLabel ? { text: xLabel } : undefined,
          type: xAxisType,
          showgrid: true,
          gridcolor: CHART_CHROME.grid,
          tickfont: { size: 11, color: CHART_CHROME.axis },
          automargin: true,
        },
        yaxis: {
          title: yLabel ? { text: yLabel } : undefined,
          type: yAxisType,
          showgrid: true,
          gridcolor: CHART_CHROME.grid,
          tickfont: { size: 11, color: CHART_CHROME.axis },
          tickformat: percentY ? ".0%" : undefined,
          automargin: true,
        },
        shapes: [
          ...(referenceX != null ? [{
            type: "line" as const,
            x0: referenceX,
            x1: referenceX,
            yref: "paper" as const,
            y0: 0,
            y1: 1,
            line: { color: CHART_CHROME.reference, dash: "dash" as const, width: 1.5 },
          }] : []),
          ...(referenceY != null ? [{
            type: "line" as const,
            xref: "paper" as const,
            x0: 0,
            x1: 1,
            y0: referenceY,
            y1: referenceY,
            line: { color: CHART_CHROME.reference, dash: "dash" as const, width: 1.5 },
          }] : []),
        ],
        annotations: quadrantLabels ? [
          { xref: "paper", yref: "paper", x: 0.04, y: 0.96, text: quadrantLabels[0], showarrow: false, font: { size: 11, color: CHART_CHROME.legend } },
          { xref: "paper", yref: "paper", x: 0.96, y: 0.96, text: quadrantLabels[1], showarrow: false, font: { size: 11, color: CHART_CHROME.legend } },
          { xref: "paper", yref: "paper", x: 0.04, y: 0.06, text: quadrantLabels[2], showarrow: false, font: { size: 11, color: CHART_CHROME.legend } },
          { xref: "paper", yref: "paper", x: 0.96, y: 0.06, text: quadrantLabels[3], showarrow: false, font: { size: 11, color: CHART_CHROME.legend } },
        ] : undefined,
      }}
      config={{ responsive: true, displayModeBar: false }}
      style={{ width: "100%", cursor: onPointClick ? "pointer" : "default" }}
      onClick={(event) => {
        const point = event.points?.[0] as (Plotly.PlotDatum & { customdata?: [string, string] }) | undefined;
        if (!point || !onPointClick) return;
        onPointClick({
          name: point.customdata?.[0] ?? String(point.text ?? point.data.name ?? ""),
          x: Number(point.x),
          y: Number(point.y),
          text: typeof point.text === "string" ? point.text : undefined,
          category: point.customdata?.[1],
        });
      }}
      useResizeHandler
    />
  );
}
