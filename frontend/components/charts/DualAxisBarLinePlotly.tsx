"use client";
/**
 * DualAxisBarLinePlotly — mixed Plotly bar + line chart with right-side percentage axis.
 * Used for RO4 viral count/rate by category.
 */
import dynamic from "next/dynamic";
import type { PlotParams } from "react-plotly.js";

import { chartColor, CHART_CHROME, CHART_PALETTE, REFERENCE_COLORS } from "@/lib/constants";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false }) as React.ComponentType<PlotParams>;

interface DualAxisBarLinePlotlyProps {
  x: string[];
  barY: number[];
  lineY: number[];
  barName?: string;
  lineName?: string;
  barColor?: string;
  lineColor?: string;
  xLabel?: string;
  barLabel?: string;
  lineLabel?: string;
  height?: number;
  onBarClick?: (xValue: string | number, value: number) => void;
  selectedBar?: { x: string | number };
}

export function DualAxisBarLinePlotly({
  x,
  barY,
  lineY,
  barName = "Số video viral",
  lineName = "Tỷ lệ viral",
  barColor = CHART_PALETTE[2],
  lineColor = REFERENCE_COLORS.viral,
  xLabel,
  barLabel,
  lineLabel,
  height = 340,
  onBarClick,
  selectedBar,
}: DualAxisBarLinePlotlyProps) {
  const safeBarColor = chartColor(barColor, CHART_PALETTE[2]);
  const safeLineColor = chartColor(lineColor, REFERENCE_COLORS.viral);
  const barOpacity = x.map((value) => (selectedBar ? (value === selectedBar.x ? 1 : 0.45) : 0.82));
  const barLineWidths = x.map((value) => (selectedBar && value === selectedBar.x ? 2.5 : 0));

  return (
    <Plot
      data={[
        {
          type: "bar",
          name: barName,
          x,
          y: barY,
          marker: {
            color: safeBarColor,
            opacity: barOpacity,
            line: { color: CHART_CHROME.emphasis, width: barLineWidths },
          },
          hovertemplate: "%{x}<br>%{y:,} video<extra></extra>",
        } as Plotly.Data,
        {
          type: "scatter",
          mode: "lines+markers",
          name: lineName,
          x,
          y: lineY,
          yaxis: "y2",
          line: { color: safeLineColor, width: 3 },
          marker: { color: safeLineColor, size: 8 },
          hovertemplate: "%{x}<br>%{y:.2%}<extra></extra>",
        } as Plotly.Data,
      ]}
      layout={{
        paper_bgcolor: CHART_CHROME.paper,
        plot_bgcolor: CHART_CHROME.plot,
        height,
        margin: { t: 8, r: 64, b: 70, l: 60 },
        font: { family: "Inter, Arial, sans-serif", size: 12, color: CHART_CHROME.tooltipText },
        legend: { orientation: "h", y: 1.08, x: 0, font: { size: 11, color: CHART_CHROME.legend } },
        hovermode: "closest",
        dragmode: false,
        xaxis: {
          title: xLabel ? { text: xLabel } : undefined,
          showgrid: false,
          tickfont: { size: 11, color: CHART_CHROME.axis },
          automargin: true,
        },
        yaxis: {
          title: barLabel ? { text: barLabel } : undefined,
          showgrid: true,
          gridcolor: CHART_CHROME.grid,
          tickfont: { size: 11, color: CHART_CHROME.axis },
          automargin: true,
        },
        yaxis2: {
          title: lineLabel ? { text: lineLabel } : undefined,
          overlaying: "y",
          side: "right",
          tickformat: ".0%",
          showgrid: false,
          tickfont: { size: 11, color: safeLineColor },
          automargin: true,
        },
      }}
      config={{ responsive: true, displayModeBar: false }}
      style={{ width: "100%", cursor: onBarClick ? "pointer" : "default" }}
      onClick={(event) => {
        const point = event.points?.[0];
        if (!point || !onBarClick || point.curveNumber !== 0) return;
        onBarClick(point.x as string | number, Number(point.y ?? 0));
      }}
      useResizeHandler
    />
  );
}
