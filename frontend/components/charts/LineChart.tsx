"use client";
/**
 * LineChart — generic Recharts line chart.
 * Used for: Chart A2 (views by year), Chart F1 (commercial monthly).
 */
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { chartColor, chartPaletteColor, CHART_CHROME, REFERENCE_COLORS, formatNumber } from "@/lib/constants";

interface LineConfig {
  key: string;
  color?: string;
  label?: string;
}

interface LineChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  lines: LineConfig[];
  /** Optional vertical reference line x value */
  referenceLine?: string | number;
  referenceLabel?: string;
  yFormatter?: (v: number) => string;
  /** Optional: selected year for highlighting */
  selectedYear?: number | null;
  /** Optional: callback when a data point is clicked */
  onYearClick?: (year: number) => void;
  onPointClick?: (xValue: string | number, lineKey: string, value: number) => void;
  selectedPoint?: { x: string | number; key: string };
}

export function LineChart({
  data,
  xKey,
  lines,
  referenceLine,
  referenceLabel,
  yFormatter = formatNumber,
  selectedYear,
  onYearClick,
  onPointClick,
  selectedPoint,
}: LineChartProps) {
  const handleClick = (data: unknown) => {
    if (!onYearClick || !data || typeof data !== "object") return;
    const entry = data as Record<string, unknown>;
    const year = entry[xKey];
    if (typeof year === "number") onYearClick(year);
  };

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RechartsLineChart
        data={data}
        margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
        onClick={handleClick}
        style={{ cursor: onYearClick ? "pointer" : "default" }}
      >
        <CartesianGrid stroke={CHART_CHROME.grid} strokeDasharray="3 3" vertical={false} />
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
        {referenceLine != null && (
          <ReferenceLine
            x={referenceLine}
            stroke={REFERENCE_COLORS.neutral}
            strokeDasharray="4 4"
            label={{ value: referenceLabel ?? "", fill: REFERENCE_COLORS.neutral, fontSize: 11 }}
          />
        )}
        {lines.map((l, index) => {
          const color = chartColor(l.color, chartPaletteColor(index));
          return (
            <Line
              key={l.key}
              type="monotone"
              dataKey={l.key}
              name={l.label ?? l.key}
              stroke={color}
              strokeWidth={2}
              dot={(props) => {
                const xValue = props.payload[xKey] as string | number;
                const value = Number(props.payload[l.key] ?? 0);
                const isSelected =
                  (selectedPoint ? selectedPoint.x === xValue && selectedPoint.key === l.key : false) ||
                  (selectedYear !== null && selectedYear !== undefined && props.payload[xKey] === selectedYear);
                return (
                  <circle
                    cx={props.cx}
                    cy={props.cy}
                    r={isSelected ? 6 : onPointClick ? 3 : 0}
                    fill={color}
                    stroke={isSelected ? CHART_CHROME.emphasis : CHART_CHROME.markerStroke}
                    strokeWidth={isSelected ? 3 : 2}
                    className="transition-all duration-300"
                    style={{
                      cursor: onPointClick ? "pointer" : "default",
                      opacity: selectedPoint ? (isSelected ? 1 : 0.5) : 1,
                      filter: isSelected ? `drop-shadow(0 0 4px ${REFERENCE_COLORS.selectedShadow})` : "none",
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      onPointClick?.(xValue, l.key, value);
                    }}
                  />
                );
              }}
              activeDot={{
                r: 5,
                fill: color,
                stroke: CHART_CHROME.markerStroke,
                strokeWidth: 2,
                style: { cursor: onPointClick ? "pointer" : "default" },
              }}
            />
          );
        })}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
