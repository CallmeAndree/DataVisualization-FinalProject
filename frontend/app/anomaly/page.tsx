"use client";
/**
 * Anomaly Page — RO4: Bóc Tách Video Viral.
 */
import { Suspense, useEffect, useMemo, useState } from "react";
import { api, type AnomalyData } from "@/lib/api";
import { MultiDimensionalFilterProvider, useMultiDimensionalFilter } from "@/app/MultiDimensionalFilterContext";
import { FilterBadges } from "@/components/dashboard/FilterBadges";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { InsightCard } from "@/components/dashboard/InsightCard";
import { ChartCard } from "@/components/charts/ChartCard";
import { DualAxisBarLinePlotly } from "@/components/charts/DualAxisBarLinePlotly";
import { BoxPlotly } from "@/components/charts/BoxPlotly";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, CATEGORY_COLORS, labelCategory } from "@/lib/constants";
import { TEXT_COLORS } from "@/lib/design-tokens";

function AnomalyContent() {
  const { filters, updateFilter, clearFilter, clearAllFilters, hasActiveFilters } = useMultiDimensionalFilter();
  const [rawData, setRawData] = useState<AnomalyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState("");
  const category = filters.category ?? "All";

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      api
        .anomaly()
        .then(setRawData)
        .catch((err) => console.error("Failed to load RO4 data:", err))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const data = useMemo(() => {
    if (!rawData) return null;
    if (filters.category) {
      return {
        d1_viral_by_category: rawData.d1_viral_by_category.filter((row) => row.category === filters.category),
        d2_viral_momentum: {
          baseline_all: rawData.d2_viral_momentum.baseline_all,
          points: rawData.d2_viral_momentum.points.filter((row) => row.category === filters.category),
        },
      };
    }
    return rawData;
  }, [rawData, filters.category]);

  const resetInsight = () => {
    setInsight("");
    setInsightError("");
  };

  const handleGetInsight = async () => {
    if (!data) return;
    setInsightLoading(true);
    setInsightError("");
    try {
      const response = await api.generateInsight({
        page: "anomaly",
        filters: { category: filters.category, viral_threshold: filters.viral_threshold },
        summary: data,
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

  const momentumCategories = data ? CATEGORIES.filter((cat) => data.d2_viral_momentum.points.some((point) => point.category === cat)) : [];

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
          <p className={`text-xs uppercase tracking-[0.2em] ${TEXT_COLORS.muted}`}>RO4</p>
          <h1 className={`mt-2 text-4xl font-semibold tracking-tight ${TEXT_COLORS.ink}`}>Bóc Tách Video Viral</h1>
          <p className={`mt-3 max-w-2xl ${TEXT_COLORS.slate}`}>
            Phân tích danh mục nào tạo nhiều video viral nhất và mức lan truyền tiếp nối sau mỗi sự kiện viral. Click để lọc.
          </p>
        </header>

        {hasActiveFilters && <div className="mb-6"><FilterBadges filters={filters} onClearFilter={clearFilter} onClearAll={clearAllFilters} /></div>}

        {loading ? <p className={TEXT_COLORS.muted}>Đang tải dữ liệu...</p> : !data ? <p className={TEXT_COLORS.muted}>Không thể tải dữ liệu. Kiểm tra backend.</p> : (
          <>
            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2 transition-all duration-500">
              <ChartCard title="D1: Số lượng và tỷ lệ video viral theo danh mục" description="Click cột để lọc theo danh mục">
                <DualAxisBarLinePlotly
                  x={data.d1_viral_by_category.map((row) => labelCategory(row.category))}
                  barY={data.d1_viral_by_category.map((row) => row.viral_count)}
                  lineY={data.d1_viral_by_category.map((row) => row.viral_rate)}
                  barLabel="Số video viral"
                  lineLabel="Tỷ lệ viral"
                  height={340}
                  onBarClick={(xValue) => {
                    const categoryValue = CATEGORIES.find((cat) => labelCategory(cat) === xValue || cat === xValue) ?? String(xValue);
                    updateFilter("category", categoryValue);
                  }}
                  selectedBar={filters.category ? { x: labelCategory(filters.category) } : undefined}
                />
              </ChartCard>

              <ChartCard title="D2: Động lượng viral theo kênh" description="Click điểm để xem chi tiết kênh trong console">
                <BoxPlotly
                  traces={momentumCategories.map((cat) => {
                    const points = data.d2_viral_momentum.points.filter((point) => point.category === cat);
                    return {
                      name: labelCategory(cat),
                      y: points.map((point) => point.momentum_rate),
                      text: points.map((point) => `${point.channel_name} (${point.n_viral_events} lần viral)`),
                      color: CATEGORY_COLORS[cat],
                    };
                  })}
                  yLabel="Tỷ lệ động lượng viral"
                  height={340}
                  showPoints
                  percent
                  baseline={data.d2_viral_momentum.baseline_all}
                  baselineLabel="Đường chuẩn viral của toàn bộ tập dữ liệu"
                  onOutlierClick={(point) => console.info("Viral momentum point", point)}
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

export default function AnomalyPage() {
  return (
    <Suspense fallback={<div className="px-10 py-12"><p className={TEXT_COLORS.muted}>Đang tải bộ lọc...</p></div>}>
      <MultiDimensionalFilterProvider>
        <AnomalyContent />
      </MultiDimensionalFilterProvider>
    </Suspense>
  );
}
