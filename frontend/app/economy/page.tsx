"use client";
/**
 * Economy Page — RO5: Quy Mô Kênh vs. Chiến Lược.
 */
import { Suspense, useEffect, useMemo, useState } from "react";
import { api, type EconomyData } from "@/lib/api";
import { MultiDimensionalFilterProvider, useMultiDimensionalFilter } from "@/app/MultiDimensionalFilterContext";
import { FilterBadges } from "@/components/dashboard/FilterBadges";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { InsightCard } from "@/components/dashboard/InsightCard";
import { ChartCard } from "@/components/charts/ChartCard";
import { ScatterPlotly } from "@/components/charts/ScatterPlotly";
import { CATEGORIES, CATEGORY_COLORS, labelCategory } from "@/lib/constants";
import { TEXT_COLORS } from "@/lib/design-tokens";

function scaleSizes(values: number[], min = 28, max = 90): number[] {
  const safe = values.map((v) => Math.max(0, v || 0));
  const lo = Math.min(...safe, 0);
  const hi = Math.max(...safe, 1);
  if (hi === lo) return safe.map(() => (min + max) / 2);
  return safe.map((v) => min + ((v - lo) / (hi - lo)) * (max - min));
}

function EconomyContent() {
  const { filters, updateFilter, clearFilter, clearAllFilters, hasActiveFilters } = useMultiDimensionalFilter();
  const [data, setData] = useState<EconomyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      api
        .economy({ categories: filters.category ?? undefined })
        .then(setData)
        .catch((err) => console.error("Failed to load RO5 data:", err))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.category]);

  const resetInsight = () => {
    setInsight("");
    setInsightError("");
  };

  const toggleCategory = (cat: string) => {
    updateFilter("channel", null);
    updateFilter("category", cat);
    resetInsight();
  };

  const filteredScatter = useMemo(() => {
    if (!data) return [];
    return data.f1_subscriber_engagement_scatter.filter((point) => {
      const categoryMatches = !filters.category || point.category === filters.category;
      const channelMatches = !filters.channel || point.channel_name === filters.channel;
      return categoryMatches && channelMatches;
    });
  }, [data, filters.category, filters.channel]);

  const filteredQuadrant = useMemo(() => {
    if (!data) return [];
    return data.f2_strategy_quadrant.points.filter((point) => {
      const categoryMatches = !filters.category || point.category === filters.category;
      const channelMatches = !filters.channel || point.channel_name === filters.channel;
      return categoryMatches && channelMatches;
    });
  }, [data, filters.category, filters.channel]);

  const handleGetInsight = async () => {
    if (!data) return;
    setInsightLoading(true);
    setInsightError("");
    try {
      const response = await api.generateInsight({
        page: "economy",
        filters: { categories: filters.category ? [filters.category] : [], category: filters.category, channel: filters.channel },
        summary: { scatter: filteredScatter, quadrant: filteredQuadrant },
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

  const categories = data?.categories.length ? data.categories : CATEGORIES;
  const scatterSizes = scaleSizes(filteredScatter.map((point) => point.total_view_count), 12, 42);
  const quadrantSizes = scaleSizes(filteredQuadrant.map((point) => point.subscriber_count), 14, 48);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <FilterBar onReset={handleReset}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm ${TEXT_COLORS.slate}`}>Danh mục:</span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs border transition-colors ${filters.category === cat ? "bg-[#73293A] text-white border-[#73293A]" : "bg-white text-[#75758a] border-[#d9d9dd]"}`}
            >
              {labelCategory(cat)}
            </button>
          ))}
        </div>
      </FilterBar>

      <div className="min-h-0 flex-1 overflow-y-auto px-10 py-8">
        <header className="mb-8">
          <p className={`text-xs uppercase tracking-[0.2em] ${TEXT_COLORS.muted}`}>RO5</p>
          <h1 className={`mt-2 text-4xl font-semibold tracking-tight ${TEXT_COLORS.ink}`}>Quy Mô Kênh vs. Chiến Lược</h1>
          <p className={`mt-3 max-w-2xl ${TEXT_COLORS.slate}`}>
            Đánh giá mối quan hệ giữa quy mô người đăng ký, tương tác trung bình và chiến lược đăng tải của từng kênh YouTube. Click để lọc.
          </p>
        </header>

        {hasActiveFilters && <div className="mb-6"><FilterBadges filters={filters} onClearFilter={clearFilter} onClearAll={clearAllFilters} /></div>}

        {loading ? <p className={TEXT_COLORS.muted}>Đang tải dữ liệu...</p> : !data ? <p className={TEXT_COLORS.muted}>Không thể tải dữ liệu. Kiểm tra backend.</p> : (
          <>
            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2 transition-all duration-500">
              <ChartCard title="F1: Quy mô người đăng ký và tỷ lệ tương tác" description="Click điểm để lọc kênh và danh mục">
                <ScatterPlotly
                  traces={categories.map((cat) => {
                    const points = filteredScatter
                      .map((point, index) => ({ ...point, markerSize: scatterSizes[index] }))
                      .filter((point) => point.category === cat);
                    return {
                      name: labelCategory(cat),
                      category: cat,
                      x: points.map((point) => point.subscriber_count),
                      y: points.map((point) => point.avg_engagement_rate),
                      text: points.map((point) => point.channel_name),
                      marker: { size: points.map((point) => point.markerSize), color: CATEGORY_COLORS[cat], opacity: 0.72 },
                    };
                  })}
                  xAxisType="log"
                  percentY
                  xLabel="Số người đăng ký (thang log)"
                  yLabel="Tỷ lệ tương tác trung bình"
                  height={360}
                  onPointClick={(point) => {
                    updateFilter("channel", point.name);
                    if (point.category) updateFilter("category", point.category);
                  }}
                  selectedPoint={filters.channel ? { name: filters.channel } : undefined}
                  isolatedSelection
                />
              </ChartCard>

              <ChartCard title="F2: Ma trận chiến lược đăng tải" description="Click điểm để lọc kênh và danh mục">
                <ScatterPlotly
                  traces={categories.map((cat) => {
                    const points = filteredQuadrant
                      .map((point, index) => ({ ...point, markerSize: quadrantSizes[index] }))
                      .filter((point) => point.category === cat);
                    return {
                      name: labelCategory(cat),
                      category: cat,
                      x: points.map((point) => point.video_count_dataset),
                      y: points.map((point) => point.avg_views_per_video_dataset),
                      text: points.map((point) => point.channel_name),
                      marker: { size: points.map((point) => point.markerSize), color: CATEGORY_COLORS[cat], opacity: 0.68 },
                    };
                  })}
                  yAxisType="log"
                  xLabel="Số video trong tập dữ liệu"
                  yLabel="Lượt xem trung bình mỗi video (thang log)"
                  height={360}
                  referenceX={data.f2_strategy_quadrant.median_x}
                  referenceY={data.f2_strategy_quadrant.median_y}
                  quadrantLabels={["Ít video / view cao", "Nhiều video / view cao", "Ít video / view thấp", "Nhiều video / view thấp"]}
                  onPointClick={(point) => {
                    updateFilter("channel", point.name);
                    if (point.category) updateFilter("category", point.category);
                  }}
                  selectedPoint={filters.channel ? { name: filters.channel } : undefined}
                  isolatedSelection
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

export default function EconomyPage() {
  return (
    <Suspense fallback={<div className="px-10 py-12"><p className={TEXT_COLORS.muted}>Đang tải bộ lọc...</p></div>}>
      <MultiDimensionalFilterProvider>
        <EconomyContent />
      </MultiDimensionalFilterProvider>
    </Suspense>
  );
}
