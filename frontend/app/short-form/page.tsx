"use client";
/**
 * Short-form Page — RO1: Short-form trend analysis.
 * Charts: B1 HeatmapPlotly (channel×year short_form_ratio), B2 StackedBarChart (short vs long by year).
 */
import { Suspense, useEffect, useMemo, useState } from "react";
import { api, type ShortFormData } from "@/lib/api";
import { MultiDimensionalFilterProvider, useMultiDimensionalFilter } from "@/app/MultiDimensionalFilterContext";
import { FilterBadges } from "@/components/dashboard/FilterBadges";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { InsightCard } from "@/components/dashboard/InsightCard";
import { ChartCard } from "@/components/charts/ChartCard";
import { HeatmapPlotly } from "@/components/charts/HeatmapPlotly";
import { StackedBarChart } from "@/components/charts/StackedBarChart";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, DURATION_COLORS, SHORT_FORM_HEATMAP_COLORSCALE, labelCategory } from "@/lib/constants";
import { TEXT_COLORS } from "@/lib/design-tokens";
import { getStaticInsightContent, isDefaultFilterState, isDefaultYearRange } from "@/lib/dashboard-insight-utils";

function durationFromSegment(segmentKey: string) {
  return segmentKey === "short" ? "Short" : "Long";
}

function ShortFormContent() {
  const { filters, updateFilter, clearFilter, clearAllFilters, hasActiveFilters } = useMultiDimensionalFilter();
  const [data, setData] = useState<ShortFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [yearRange, setYearRange] = useState<number[]>([2015, 2026]);
  const [insight, setInsight] = useState<string>("");
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState<string>("");
  const category = filters.category ?? "All";

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      api
        .shortForm({
          year_from: yearRange[0],
          year_to: yearRange[1],
          category: category === "All" || category === null ? undefined : category,
        })
        .then(setData)
        .catch((err) => console.error("Failed to load short-form data:", err))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [yearRange, category]);

  const resetInsight = () => {
    setInsight("");
    setInsightError("");
  };

  const setYearFilter = (value: number[]) => {
    setYearRange(value);
    resetInsight();
  };

  const setCategoryFilter = (value: string | null) => {
    updateFilter("category", value === "All" ? null : value);
    resetInsight();
  };

  const filteredHeatmap = useMemo(() => {
    if (!data) return null;
    const years = data.b1_heatmap.years
      .map((year, index) => ({ year, index }))
      .filter(({ year }) => (!filters.year || year === filters.year) && year >= yearRange[0] && year <= yearRange[1]);
    const channels = data.b1_heatmap.channels
      .map((channel, index) => ({ channel, index }))
      .filter(({ channel }) => !filters.channel || channel === filters.channel);

    return {
      years: years.map(({ year }) => year),
      channels: channels.map(({ channel }) => labelCategory(channel)),
      z: channels.map(({ index: channelIndex }) =>
        years.map(({ index: yearIndex }) => data.b1_heatmap.z[channelIndex]?.[yearIndex] ?? 0)
      ),
    };
  }, [data, filters.channel, filters.year, yearRange]);

  const filteredBar = useMemo(() => {
    if (!data) return [];
    return data.b2_bar.filter((row) => {
      const parsedYear = parseInt(row.label, 10);
      const yearMatches = filters.year === null || parsedYear === filters.year;
      const rangeMatches = Number.isNaN(parsedYear) || (parsedYear >= yearRange[0] && parsedYear <= yearRange[1]);
      const durationMatches = !filters.duration || row[filters.duration === "Short" ? "short" : "long"] > 0;
      return yearMatches && rangeMatches && durationMatches;
    });
  }, [data, filters.duration, filters.year, yearRange]);

  const calculateSummary = (data: ShortFormData) => {
    const totalShort = filteredBar.reduce((sum, item) => sum + item.short, 0);
    const totalLong = filteredBar.reduce((sum, item) => sum + item.long, 0);
    const shortFormRatio = totalShort / Math.max(totalShort + totalLong, 1);

    return {
      short_form_ratio: shortFormRatio,
      year_from: yearRange[0],
      year_to: yearRange[1],
      category: filters.category,
      channel: filters.channel,
      year: filters.year,
      duration: filters.duration,
      heatmap: filteredHeatmap,
      source_rows: data.b2_bar.length,
    };
  };

  const handleGetInsight = async () => {
    if (!data) return;

    if (isDefaultFilterState(filters) && isDefaultYearRange(yearRange, [2015, 2026])) {
      setInsight(getStaticInsightContent("short-form"));
      setInsightError("");
      return;
    }

    setInsightLoading(true);
    setInsightError("");

    try {
      const summary = calculateSummary(data);
      const insightFilters = {
        year_from: yearRange[0],
        year_to: yearRange[1],
        category: filters.category,
        channel: filters.channel,
        year: filters.year,
        duration: filters.duration,
      };

      const response = await api.generateInsight({
        page: "short-form",
        filters: insightFilters,
        summary,
      });

      setInsight(response.insight);
    } catch (error) {
      setInsightError(
        error instanceof Error ? error.message : "Không thể tạo insight. Vui lòng thử lại."
      );
    } finally {
      setInsightLoading(false);
    }
  };

  const handleReset = () => {
    setYearRange([2015, 2026]);
    clearAllFilters();
    resetInsight();
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <FilterBar onReset={handleReset}>
        <div className="flex items-center gap-2">
          <label className={`text-sm ${TEXT_COLORS.slate} whitespace-nowrap`}>Năm:</label>
          <div className="w-48">
            <Slider
              value={yearRange}
              onValueChange={(val) => setYearFilter(val as number[])}
              min={2015}
              max={2026}
              step={1}
            />
          </div>
          <span className={`text-xs ${TEXT_COLORS.muted} tabular-nums`}>
            {yearRange[0]} – {yearRange[1]}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <label className={`text-sm ${TEXT_COLORS.slate}`}>Danh mục:</label>
          <Select value={category} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Tất cả</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {labelCategory(cat)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </FilterBar>

      <div className="min-h-0 flex-1 overflow-y-auto px-10 py-8">
        <header className="mb-8">
          <p className={`text-xs uppercase tracking-[0.2em] ${TEXT_COLORS.muted}`}>RO1</p>
          <h1 className={`mt-2 text-4xl font-semibold tracking-tight ${TEXT_COLORS.ink}`}>
            Xu hướng video ngắn
          </h1>
          <p className={`mt-3 max-w-2xl ${TEXT_COLORS.slate}`}>
            Phân tích tỉ lệ video ngắn theo kênh và thời gian. Click để lọc.
          </p>
        </header>

        {hasActiveFilters && <div className="mb-6"><FilterBadges filters={filters} onClearFilter={clearFilter} onClearAll={clearAllFilters} /></div>}

        {loading ? (
          <p className={TEXT_COLORS.muted}>Đang tải dữ liệu...</p>
        ) : !data || !filteredHeatmap ? (
          <p className={TEXT_COLORS.muted}>Không thể tải dữ liệu. Kiểm tra backend.</p>
        ) : (
          <>
            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2 transition-all duration-500">
              <ChartCard
                title="B1: Tỷ lệ video ngắn theo kênh và năm"
                description="Click để lọc theo kênh + năm"
              >
                <HeatmapPlotly
                  z={filteredHeatmap.z}
                  x={filteredHeatmap.years.map(String)}
                  y={filteredHeatmap.channels}
                  colorscale={SHORT_FORM_HEATMAP_COLORSCALE}
                  reversescale={false}
                  xLabel="Năm"
                  yLabel="Danh mục"
                  height={480}
                  onCellClick={(x, y) => {
                    updateFilter("year", Number(x));
                    const originalChannel = data.b1_heatmap.channels.find((channel) => labelCategory(channel) === String(y)) ?? String(y);
                    updateFilter("channel", originalChannel);
                  }}
                  selectedCell={filters.year !== null && filters.channel ? { x: String(filters.year), y: labelCategory(filters.channel) } : undefined}
                />
              </ChartCard>

              <ChartCard
                title="B2: Số lượng video ngắn và video dài theo năm"
                description="Click để lọc theo năm + thời lượng"
              >
                <StackedBarChart
                  data={filteredBar}
                  xKey="label"
                  grouped
                  height={500}
                  bars={[
                    { key: "short", label: "Video ngắn", color: DURATION_COLORS.Short },
                    { key: "long", label: "Video dài", color: DURATION_COLORS.Long },
                  ]}
                  onSegmentClick={(xValue, segmentKey) => {
                    updateFilter("year", parseInt(String(xValue), 10));
                    updateFilter("duration", durationFromSegment(segmentKey));
                  }}
                  selectedSegment={filters.year !== null && filters.duration ? { x: String(filters.year), key: filters.duration === "Short" ? "short" : "long" } : undefined}
                />
              </ChartCard>
            </div>

            <InsightCard
              content={insight}
              loading={insightLoading}
              error={insightError}
              onGetInsight={handleGetInsight}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default function ShortFormPage() {
  return (
    <Suspense fallback={<div className="px-10 py-12"><p className={TEXT_COLORS.muted}>Đang tải bộ lọc...</p></div>}>
      <MultiDimensionalFilterProvider>
        <ShortFormContent />
      </MultiDimensionalFilterProvider>
    </Suspense>
  );
}
