"use client";
/**
 * ChartCard — universal wrapper for all dashboard charts.
 * Handles loading skeleton, error state, title, description, and PNG export.
 * Design: Cohere canvas-first white card with hairline border.
 */
import React, { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CHART_CHROME } from "@/lib/constants";

interface ChartCardProps {
  title: string;
  description?: string;
  loading?: boolean;
  error?: string | null;
  children: React.ReactNode;
  className?: string;
}

function slugifyTitle(title: string) {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "chart";
}

export function ChartCard({
  title,
  description,
  loading,
  error,
  children,
  className = "",
}: ChartCardProps) {
  const chartBodyRef = useRef<HTMLDivElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async () => {
    if (!chartBodyRef.current || loading || error || isExporting) return;

    try {
      setIsExporting(true);
      setExportError(null);

      const dataUrl = await toPng(chartBodyRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: CHART_CHROME.paper,
      });

      const link = document.createElement("a");
      link.download = `${slugifyTitle(title)}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      setExportError("Không thể tải PNG cho biểu đồ này.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      className={`rounded-[8px] border p-6 flex flex-col gap-4 ${className}`}
      style={{ background: CHART_CHROME.paper, borderColor: CHART_CHROME.grid }}
    >
      <div className="flex items-start justify-between gap-4">
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

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={loading || !!error || isExporting}
          className="shrink-0"
          aria-label={`Tải PNG cho ${title}`}
        >
          <Download />
          {isExporting ? "Đang xuất..." : "PNG"}
        </Button>
      </div>

      <div ref={chartBodyRef} className="rounded-md" style={{ background: CHART_CHROME.paper }}>
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

      {exportError ? (
        <p className="text-sm" style={{ color: CHART_CHROME.error }}>
          {exportError}
        </p>
      ) : null}
    </div>
  );
}
