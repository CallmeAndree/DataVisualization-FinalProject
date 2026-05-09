"use client";
/**
 * StackedBarChart — Recharts stacked bar chart.
 * Used for: Chart B2 (short vs long videos by year/quarter).
 */
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { chartColor, chartPaletteColor, CHART_CHROME, formatNumber } from "@/lib/constants";

interface BarConfig {
  key: string;
  color?: string;
  label?: string;
}

interface StackedBarChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  bars: BarConfig[];
}

export function StackedBarChart({ data, xKey, bars }: StackedBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid stroke={CHART_CHROME.grid} strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 12, fill: CHART_CHROME.axis }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatNumber}
          tick={{ fontSize: 12, fill: CHART_CHROME.axis }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip
          contentStyle={{
            background: CHART_CHROME.tooltipBg,
            border: `1px solid ${CHART_CHROME.tooltipBorder}`,
            borderRadius: 8,
            fontSize: 13,
            color: CHART_CHROME.tooltipText,
          }}
          formatter={(v) => formatNumber(v as number)}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => (
            <span style={{ fontSize: 12, color: CHART_CHROME.legend }}>{value}</span>
          )}
        />
        {bars.map((b, index) => (
          <Bar
            key={b.key}
            dataKey={b.key}
            name={b.label ?? b.key}
            stackId="stack"
            fill={chartColor(b.color, chartPaletteColor(index))}
            radius={[2, 2, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
