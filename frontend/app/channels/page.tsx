"use client";
/**
 * Channels Page — RO2: Định Dạng Video & Tương Tác.
 */
import { Suspense, useEffect, useMemo, useState } from "react";
import { api, type ChannelsData } from "@/lib/api";
import { MultiDimensionalFilterProvider, useMultiDimensionalFilter } from "@/app/MultiDimensionalFilterContext";
import { FilterBadges } from "@/components/dashboard/FilterBadges";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { InsightCard } from "@/components/dashboard/InsightCard";
import { ChartCard } from "@/components/charts/ChartCard";
import { BarChart } from "@/components/charts/BarChart";
import { HeatmapPlotly } from "@/components/charts/HeatmapPlotly";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, DURATION_COLORS, TAROT_HEATMAP_COLORSCALE, labelCategory, labelDuration, formatPercent } from "@/lib/constants";
import { TEXT_COLORS } from "@/lib/design-tokens";

type DurationKey = "short" | "medium" | "long";

function toDuration(key: string) {
  return key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
}

function fromLabel(label: string, source: readonly string[]) {
  return source.find((value) => labelCategory(value) === label || labelDuration(value) === label || value === label) ?? label;
}

function ChannelsContent() {
  const { filters, updateFilter, clearFilter, clearAllFilters, hasActiveFilters } = useMultiDimensionalFilter();
  const [data, setData] = useState<ChannelsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState("");
  const category = filters.category ?? "All";

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      api
        .channels({ category: category === "All" || category === null ? undefined : category })
        .then(setData)
        .catch((err) => console.error("Failed to load RO2 data:", err))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [category]);

  const resetInsight = () => {
    setInsight("");
    setInsightError("");
  };

  const filteredDistribution = useMemo(() => {
    if (!data) return [];
    return data.b1_duration_distribution.filter((row) => {
      const categoryMatches = !filters.category || row.category === filters.category;
      const durationMatches = !filters.duration || row[filters.duration.toLowerCase() as DurationKey] > 0;
      return categoryMatches && durationMatches;
    });
  }, [data, filters.category, filters.duration]);

  const filteredHeatmap = useMemo(() => {
    if (!data) return null;
    const categories = data.b2_engagement_heatmap.categories
      .map((categoryValue, index) => ({ categoryValue, index }))
      .filter(({ categoryValue }) => !filters.category || categoryValue === filters.category);
    const durations = data.b2_engagement_heatmap.durations
      .map((durationValue, index) => ({ durationValue, index }))
      .filter(({ durationValue }) => !filters.duration || durationValue === filters.duration);

    return {
      categories: categories.map(({ categoryValue }) => categoryValue),
      durations: durations.map(({ durationValue }) => durationValue),
      z: categories.map(({ index: categoryIndex }) =>
        durations.map(({ index: durationIndex }) => data.b2_engagement_heatmap.z[categoryIndex]?.[durationIndex] ?? 0)
      ),
    };
  }, [data, filters.category, filters.duration]);

  const handleGetInsight = async () => {
    if (!data) return;
    setInsightLoading(true);
    setInsightError("");
    try {
      const response = await api.generateInsight({
        page: "channels",
        filters: { category: filters.category, duration: filters.duration },
        summary: {
          duration_distribution: filteredDistribution,
          engagement_heatmap: filteredHeatmap,
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

  return (
    <div className="flex h-full min-h-0 flex-col">
      <FilterBar onReset={handleReset}>
        <div className="flex items-center gap-2">
          <label className={`text-sm ${TEXT_COLORS.slate}`}>Danh mục:</label>
          <Select value={category} onValueChange={(value) => { updateFilter("category", value === "All" ? null : value); resetInsight(); }}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Tất cả</SelectItem>
              {CATEGORIES.map((cat) => <SelectItem key={cat} value={cat}>{labelCategory(cat)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </FilterBar>

      <div className="min-h-0 flex-1 overflow-y-auto px-10 py-8">
        <header className="mb-8">
          <p className={`text-xs uppercase tracking-[0.2em] ${TEXT_COLORS.muted}`}>RO2</p>
          <h1 className={`mt-2 text-4xl font-semibold tracking-tight ${TEXT_COLORS.ink}`}>Định Dạng Video & Tương Tác</h1>
          <p className={`mt-3 max-w-2xl ${TEXT_COLORS.slate}`}>
            So sánh tỷ trọng video Short, Medium, Long và mức tương tác trung vị theo từng danh mục nội dung. Click để lọc.
          </p>
        </header>

        {hasActiveFilters && <div className="mb-6"><FilterBadges filters={filters} onClearFilter={clearFilter} onClearAll={clearAllFilters} /></div>}

        {loading ? <p className={TEXT_COLORS.muted}>Đang tải dữ liệu...</p> : !data || !filteredHeatmap ? <p className={TEXT_COLORS.muted}>Không thể tải dữ liệu. Kiểm tra backend.</p> : (
          <>
            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2 transition-all duration-500">
              <ChartCard title="B1: Phân bố độ dài video theo danh mục" description="Click để lọc theo danh mục + thời lượng">
                <BarChart
                  data={filteredDistribution.map((row) => ({ ...row, category: labelCategory(row.category) }))}
                  xKey="category"
                  yFormatter={formatPercent}
                  bars={[
                    { key: "short", label: labelDuration("Short"), color: DURATION_COLORS.Short },
                    { key: "medium", label: labelDuration("Medium"), color: DURATION_COLORS.Medium },
                    { key: "long", label: labelDuration("Long"), color: DURATION_COLORS.Long },
                  ]}
                  onBarClick={(xValue, barKey) => {
                    updateFilter("category", fromLabel(String(xValue), CATEGORIES));
                    updateFilter("duration", toDuration(barKey));
                  }}
                  selectedBar={filters.category && filters.duration ? { x: labelCategory(filters.category), key: filters.duration.toLowerCase() } : undefined}
                />
              </ChartCard>

              <ChartCard title="B2: Tương tác trung vị theo độ dài video" description="Click để lọc theo danh mục + thời lượng">
                <HeatmapPlotly
                  z={filteredHeatmap.z}
                  x={filteredHeatmap.durations.map(labelDuration)}
                  y={filteredHeatmap.categories.map(labelCategory)}
                  colorscale={TAROT_HEATMAP_COLORSCALE}
                  reversescale={false}
                  xLabel="Nhóm thời lượng"
                  yLabel="Danh mục"
                  height={340}
                  onCellClick={(x, y) => {
                    updateFilter("duration", fromLabel(String(x), filteredHeatmap.durations));
                    updateFilter("category", fromLabel(String(y), filteredHeatmap.categories));
                  }}
                  selectedCell={filters.category && filters.duration ? { x: labelDuration(filters.duration), y: labelCategory(filters.category) } : undefined}
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

export default function ChannelsPage() {
  return (
    <Suspense fallback={<div className="px-10 py-12"><p className={TEXT_COLORS.muted}>Đang tải bộ lọc...</p></div>}>
      <MultiDimensionalFilterProvider>
        <ChannelsContent />
      </MultiDimensionalFilterProvider>
    </Suspense>
  );
}
