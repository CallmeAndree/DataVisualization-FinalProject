"use client";
/**
 * BarChart — generic Recharts bar chart, horizontal or vertical.
 * Used for: Chart F2 (commercial vs non-commercial by category).
 */
import {
  BarChart as RechartsBarChart,
  Bar,
  Cell,
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

interface BarChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  bars: BarConfig[];
  layout?: "horizontal" | "vertical";
  yFormatter?: (v: number) => string;
  onBarClick?: (xValue: string | number, barKey: string, value: number) => void;
  selectedBar?: { x: string | number; key: string };
}

export function BarChart({
  data,
  xKey,
  bars,
  layout = "vertical",
  yFormatter = formatNumber,
  onBarClick,
  selectedBar,
}: BarChartProps) {
  const isHorizontal = layout === "horizontal";

  const isSelected = (entry: Record<string, unknown>, key: string) =>
    selectedBar ? entry[xKey] === selectedBar.x && key === selectedBar.key : false;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RechartsBarChart
        data={data}
        layout={isHorizontal ? "vertical" : "horizontal"}
        margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
      >
        <CartesianGrid stroke={CHART_CHROME.grid} strokeDasharray="3 3" horizontal={!isHorizontal} vertical={isHorizontal} />
        {isHorizontal ? (
          <>
            <XAxis
              type="number"
              tickFormatter={yFormatter}
              tick={{ fontSize: 12, fill: CHART_CHROME.axis }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey={xKey}
              tick={{ fontSize: 12, fill: CHART_CHROME.axis }}
              axisLine={false}
              tickLine={false}
              width={80}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey={xKey}
              tick={{ fontSize: 12, fill: CHART_CHROME.axis }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={yFormatter}
              tick={{ fontSize: 12, fill: CHART_CHROME.axis }}
              axisLine={false}
              tickLine={false}
              width={52}
            />
          </>
        )}
        <Tooltip
          contentStyle={{
            background: CHART_CHROME.tooltipBg,
            border: `1px solid ${CHART_CHROME.tooltipBorder}`,
            borderRadius: 8,
            fontSize: 13,
            color: CHART_CHROME.tooltipText,
          }}
          formatter={(v) => yFormatter(v as number)}
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
            fill={chartColor(b.color, chartPaletteColor(index))}
            radius={isHorizontal ? [0, 2, 2, 0] : [2, 2, 0, 0]}
          >
            {data.map((entry, cellIndex) => {
              const xValue = entry[xKey] as string | number;
              const value = Number(entry[b.key] ?? 0);
              const selected = isSelected(entry, b.key);
              return (
                <Cell
                  key={`${b.key}-${cellIndex}`}
                  opacity={selectedBar ? (selected ? 1 : 0.5) : 1}
                  stroke={selected ? CHART_CHROME.emphasis : undefined}
                  strokeWidth={selected ? 2 : 0}
                  cursor={onBarClick ? "pointer" : "default"}
                  onClick={() => onBarClick?.(xValue, b.key, value)}
                  className="transition-opacity duration-300"
                />
              );
            })}
          </Bar>
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
