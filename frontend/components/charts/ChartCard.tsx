/**
 * ChartCard — universal wrapper for all dashboard charts.
 * Handles loading skeleton, error state, title, and description.
 * Design: Cohere canvas-first white card with hairline border.
 */
import React from "react";

import { CHART_CHROME } from "@/lib/constants";

interface ChartCardProps {
  title: string;
  description?: string;
  loading?: boolean;
  error?: string | null;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({
  title,
  description,
  loading,
  error,
  children,
  className = "",
}: ChartCardProps) {
  return (
    <div
      className={`rounded-[8px] border p-6 flex flex-col gap-4 ${className}`}
      style={{ background: CHART_CHROME.paper, borderColor: CHART_CHROME.grid }}
    >
      {/* Header */}
      <div>
        <h3
          className="text-base font-semibold leading-tight"
          style={{ color: CHART_CHROME.tooltipText, fontFamily: "var(--font-display, 'Space Grotesk', Inter, sans-serif)" }}
        >
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-sm" style={{ color: CHART_CHROME.axis }}>{description}</p>
        )}
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex flex-col gap-3 animate-pulse">
          <div className="h-4 rounded w-3/4" style={{ background: CHART_CHROME.grid }} />
          <div className="h-40 rounded" style={{ background: CHART_CHROME.grid }} />
          <div className="h-4 rounded w-1/2" style={{ background: CHART_CHROME.grid }} />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-40 text-sm rounded" style={{ background: CHART_CHROME.grid, color: CHART_CHROME.error }}>
          <span>⚠ {error}</span>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
