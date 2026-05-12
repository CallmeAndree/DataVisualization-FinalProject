"use client";
/**
 * Interaction Page — RO3: Giờ Vàng Đăng Video.
 */
import { Suspense, useEffect, useMemo, useState } from "react";
import { api, type InteractionData } from "@/lib/api";
import { MultiDimensionalFilterProvider, useMultiDimensionalFilter } from "@/app/MultiDimensionalFilterContext";
import { FilterBadges } from "@/components/dashboard/FilterBadges";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { InsightCard } from "@/components/dashboard/InsightCard";
import { ChartCard } from "@/components/charts/ChartCard";
import { HeatmapPlotly } from "@/components/charts/HeatmapPlotly";
import { LineChart } from "@/components/charts/LineChart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, CATEGORY_COLORS, ENTERTAINMENT_HEATMAP_COLORSCALE, DURATION_ORDER, DAY_LABELS, labelCategory, labelDuration, formatNumber } from "@/lib/constants";
import { TEXT_COLORS } from "@/lib/design-tokens";

function InteractionContent() {
  const { filters, updateFilter, clearFilter, clearAllFilters, hasActiveFilters } = useMultiDimensionalFilter();
  const [data, setData] = useState<InteractionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState("");
  const category = filters.category ?? "All";
  const selectedCategories = useMemo(() => filters.category ? [filters.category] : [], [filters.category]);
  const durationGroup = filters.duration ?? "All";

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      api
        .interaction({
          categories: selectedCategories.length ? selectedCategories.join(",") : undefined,
          duration_group: durationGroup === "All" || durationGroup === null ? undefined : durationGroup,
        })
        .then(setData)
        .catch((err) => console.error("Failed to load RO3 data:", err))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedCategories, durationGroup]);

  const resetInsight = () => {
    setInsight("");
    setInsightError("");
  };

  const setCategoryFilter = (value: string | null) => {
    updateFilter("category", value === "All" || value === null ? null : value);
    resetInsight();
  };

  const filteredHeatmap = useMemo(() => {
    if (!data) return null;
    const hours = data.e2_heatmap.hours
      .map((hour, index) => ({ hour, index }))
      .filter(({ hour }) => filters.hour === null || hour === filters.hour);
    const days = data.e2_heatmap.days
      .map((day, index) => ({ day, index }))
      .filter((_, index) => filters.day_of_week === null || index === filters.day_of_week);

    return {
      hours: hours.map(({ hour }) => hour),
      days: days.map(({ day }) => day),
      z: days.map(({ index: dayIndex }) =>
        hours.map(({ index: hourIndex }) => data.e2_heatmap.z[dayIndex]?.[hourIndex] ?? 0)
      ),
    };
  }, [data, filters.hour, filters.day_of_week]);

  const filteredLineData = useMemo(() => {
    if (!data) return [];
    return data.e1_hour_category_video_count.filter((row) => filters.hour === null || row.hour === filters.hour);
  }, [data, filters.hour]);

  const handleGetInsight = async () => {
    if (!data) return;
    setInsightLoading(true);
    setInsightError("");
    try {
      const response = await api.generateInsight({
        page: "interaction",
        filters: {
          categories: selectedCategories,
          duration_group: filters.duration,
          hour: filters.hour,
          day_of_week: filters.day_of_week,
        },
        summary: {
          heatmap: filteredHeatmap,
          hour_category_video_count: filteredLineData,
        },
      });
      setInsight(response.insight);
    } catch (error) {
      setInsightError(error instanceof Error ? error.message : "Không thể tạo insight. Vui lòng thử lại.");
    } finally {
      setInsightLoading(false);
    }
  };

  const handleReset = () => {
    clearAllFilters();
    resetInsight();
  };

  const lineCategories = data?.categories.length ? data.categories : CATEGORIES;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <FilterBar onReset={handleReset}>
        <div className="flex items-center gap-2">
          <label className={`text-sm ${TEXT_COLORS.slate}`}>Danh mục:</label>
          <Select value={category} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Tất cả</SelectItem>
              {CATEGORIES.map((cat) => <SelectItem key={cat} value={cat}>{labelCategory(cat)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label className={`text-sm ${TEXT_COLORS.slate}`}>Thời lượng:</label>
          <Select value={durationGroup} onValueChange={(value) => { updateFilter("duration", value === "All" ? null : value); resetInsight(); }}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Tất cả</SelectItem>
              {DURATION_ORDER.map((duration) => <SelectItem key={duration} value={duration}>{labelDuration(duration)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </FilterBar>

      <div className="min-h-0 flex-1 overflow-y-auto px-10 py-8">
        <header className="mb-8">
          <p className={`text-xs uppercase tracking-[0.2em] ${TEXT_COLORS.muted}`}>RO3</p>
          <h1 className={`mt-2 text-4xl font-semibold tracking-tight ${TEXT_COLORS.ink}`}>Giờ Vàng Đăng Video</h1>
          <p className={`mt-3 max-w-2xl ${TEXT_COLORS.slate}`}>
            Xác định khung giờ và ngày đăng hiệu quả bằng heatmap lượt xem trung vị và xu hướng số lượng video theo giờ của từng danh mục. Click để lọc.
          </p>
        </header>

        {hasActiveFilters && <div className="mb-6"><FilterBadges filters={filters} onClearFilter={clearFilter} onClearAll={clearAllFilters} /></div>}

        {loading ? <p className={TEXT_COLORS.muted}>Đang tải dữ liệu...</p> : !data || !filteredHeatmap ? <p className={TEXT_COLORS.muted}>Không thể tải dữ liệu. Kiểm tra backend.</p> : (
          <>
            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2 transition-all duration-500">
              <ChartCard title="D1: Bản đồ nhiệt lượt xem trung vị theo ngày và giờ" description="Click để lọc theo ngày và giờ">
                <HeatmapPlotly
                  z={filteredHeatmap.z}
                  x={filteredHeatmap.hours.map(String)}
                  y={filteredHeatmap.days}
                  colorscale={ENTERTAINMENT_HEATMAP_COLORSCALE}
                  reversescale={false}
                  xLabel="Giờ đăng"
                  yLabel="Ngày trong tuần"
                  height={340}
                  onCellClick={(x, y) => {
                    updateFilter("hour", Number(x));
                    updateFilter("day_of_week", DAY_LABELS.findIndex((label) => label === y));
                  }}
                  selectedCell={filters.hour !== null && filters.day_of_week !== null ? { x: String(filters.hour), y: DAY_LABELS[filters.day_of_week] } : undefined}
                />
              </ChartCard>

              <ChartCard title="D2: Số lượng video theo giờ đăng" description="Click điểm để lọc theo giờ">
                <LineChart
                  data={filteredLineData}
                  xKey="hour"
                  yFormatter={formatNumber}
                  lines={lineCategories.map((cat) => ({ key: cat, label: labelCategory(cat), color: CATEGORY_COLORS[cat] }))}
                  onPointClick={(xValue) => updateFilter("hour", Number(xValue))}
                  selectedPoint={filters.hour !== null ? { x: filters.hour, key: lineCategories[0] } : undefined}
                />
              </ChartCard>
            </div>

            <InsightCard content={insight} loading={insightLoading} error={insightError} onGetInsight={handleGetInsight} />
          </>
        )}
      </div>
    </div>
  );
}

export default function InteractionPage() {
  return (
    <Suspense fallback={<div className="px-10 py-12"><p className={TEXT_COLORS.muted}>Đang tải bộ lọc...</p></div>}>
      <MultiDimensionalFilterProvider>
        <InteractionContent />
      </MultiDimensionalFilterProvider>
    </Suspense>
  );
}
