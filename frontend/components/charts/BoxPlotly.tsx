"use client";
/**
 * BoxPlotly — dynamic-imported Plotly box plot.
 * Used for: Chart C1 (view/video by category), Chart E1 (engagement by duration×tier).
 * SSR disabled via next/dynamic.
 */
import dynamic from "next/dynamic";
import type { PlotParams } from "react-plotly.js";
import { chartColor, chartPaletteColor, CHART_CHROME, REFERENCE_COLORS } from "@/lib/constants";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false }) as React.ComponentType<PlotParams>;

interface BoxTrace {
  name: string;
  y: number[];
  text?: string[];
  color?: string;
}

interface BoxPlotlyProps {
  traces: BoxTrace[];
  title?: string;
  yLabel?: string;
  height?: number;
  showPoints?: boolean;
  baseline?: number;
  baselineLabel?: string;
  percent?: boolean;
  onOutlierClick?: (point: unknown) => void;
}

export function BoxPlotly({
  traces,
  yLabel,
  height = 320,
  showPoints = false,
  baseline,
  baselineLabel = "Baseline",
  percent = false,
  onOutlierClick,
}: BoxPlotlyProps) {
  return (
    <Plot
      data={traces.map((t, index) => {
        const color = chartColor(t.color, chartPaletteColor(index));

        return ({
          type: "box",
          name: t.name,
          y: t.y,
          text: t.text,
          boxmean: showPoints ? "sd" : true,
          boxpoints: showPoints ? "all" : false,
          jitter: showPoints ? 0.35 : 0,
          pointpos: showPoints ? 0 : undefined,
          hovertemplate: percent
            ? "%{x}<br>%{text}<br>%{y:.2%}<extra></extra>"
            : "%{x}<br>%{text}<br>%{y}<extra></extra>",
          marker: { color, opacity: 0.75, size: 6, line: { color: CHART_CHROME.markerStroke, width: onOutlierClick ? 0.75 : 0 } },
          line: { color },
          fillcolor: `${color}30`,
        } as Plotly.Data);
      })}
      layout={{
        paper_bgcolor: CHART_CHROME.paper,
        plot_bgcolor: CHART_CHROME.plot,
        height,
        margin: { t: 8, r: 8, b: 60, l: 60 },
        font: { family: "Inter, Arial, sans-serif", size: 12, color: CHART_CHROME.tooltipText },
        showlegend: false,
        hovermode: "closest",
        dragmode: false,
        xaxis: {
          showgrid: false,
          tickfont: { size: 11, color: CHART_CHROME.axis },
          automargin: true,
        },
        yaxis: {
          title: yLabel ? { text: yLabel } : undefined,
          showgrid: true,
          gridcolor: CHART_CHROME.grid,
          tickfont: { size: 11, color: CHART_CHROME.axis },
          tickformat: percent ? ".0%" : undefined,
          automargin: true,
        },
        shapes: baseline != null ? [{
          type: "line",
          xref: "paper",
          x0: 0,
          x1: 1,
          y0: baseline,
          y1: baseline,
          line: { color: REFERENCE_COLORS.viral, width: 2, dash: "dash" },
        }] : undefined,
        annotations: baseline != null ? [{
          xref: "paper",
          x: 1,
          y: baseline,
          xanchor: "right",
          yanchor: "bottom",
          text: baselineLabel,
          showarrow: false,
          font: { size: 11, color: REFERENCE_COLORS.viral },
        }] : undefined,
      }}
      config={{ responsive: true, displayModeBar: false }}
      style={{ width: "100%", cursor: onOutlierClick ? "pointer" : "default" }}
      onClick={(event) => {
        const point = event.points?.[0];
        if (!point || !onOutlierClick) return;
        onOutlierClick({
          category: point.x,
          value: point.y,
          text: point.text,
          curveNumber: point.curveNumber,
          pointNumber: point.pointNumber,
        });
      }}
      useResizeHandler
    />
  );
}
