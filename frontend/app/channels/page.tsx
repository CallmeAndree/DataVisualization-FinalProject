"use client";
/**
 * Channels Page — RO2: Định Dạng Video & Tương Tác.
 */
import { useEffect, useState } from "react";
import { api, type ChannelsData } from "@/lib/api";
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

export default function ChannelsPage() {
  const [data, setData] = useState<ChannelsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string | null>("All");
  const [insight, setInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState("");

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

  const handleGetInsight = async () => {
    if (!data) return;
    setInsightLoading(true);
    setInsightError("");
    try {
      const response = await api.generateInsight({
        page: "channels",
        filters: { category: category === "All" ? null : category },
        summary: {
          duration_distribution: data.b1_duration_distribution,
          engagement_heatmap: data.b2_engagement_heatmap,
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
    setCategory("All");
    resetInsight();
  };

  return (
    <div className="flex flex-col h-full">
      <FilterBar onReset={handleReset}>
        <div className="flex items-center gap-2">
          <label className={`text-sm ${TEXT_COLORS.slate}`}>Danh mục:</label>
          <Select value={category} onValueChange={(value) => { setCategory(value); resetInsight(); }}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Tất cả</SelectItem>
              {CATEGORIES.map((cat) => <SelectItem key={cat} value={cat}>{labelCategory(cat)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </FilterBar>

      <div className="flex-1 overflow-y-auto px-10 py-8">
        <header className="mb-8">
          <p className={`text-xs uppercase tracking-[0.2em] ${TEXT_COLORS.muted}`}>RO2</p>
          <h1 className={`mt-2 text-4xl font-semibold tracking-tight ${TEXT_COLORS.ink}`}>Định Dạng Video & Tương Tác</h1>
          <p className={`mt-3 max-w-2xl ${TEXT_COLORS.slate}`}>
            So sánh tỷ trọng video Short, Medium, Long và mức tương tác trung vị theo từng danh mục nội dung.
          </p>
        </header>

        {loading ? <p className={TEXT_COLORS.muted}>Đang tải dữ liệu...</p> : !data ? <p className={TEXT_COLORS.muted}>Không thể tải dữ liệu. Kiểm tra backend.</p> : (
          <>
            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ChartCard title="B1: Phân bố độ dài video theo danh mục" description="Tỷ lệ Short / Medium / Long được chuẩn hóa trong từng danh mục">
                <BarChart
                  data={data.b1_duration_distribution.map((row) => ({ ...row, category: labelCategory(row.category) }))}
                  xKey="category"
                  yFormatter={formatPercent}
                  bars={[
                    { key: "short", label: labelDuration("Short"), color: DURATION_COLORS.Short },
                    { key: "medium", label: labelDuration("Medium"), color: DURATION_COLORS.Medium },
                    { key: "long", label: labelDuration("Long"), color: DURATION_COLORS.Long },
                  ]}
                />
              </ChartCard>

              <ChartCard title="B2: Tương tác trung vị theo độ dài video" description="Median engagement rate theo danh mục và nhóm thời lượng">
                <HeatmapPlotly
                  z={data.b2_engagement_heatmap.z}
                  x={data.b2_engagement_heatmap.durations.map(labelDuration)}
                  y={data.b2_engagement_heatmap.categories.map(labelCategory)}
                  colorscale={TAROT_HEATMAP_COLORSCALE}
                  reversescale={false}
                  xLabel="Nhóm thời lượng"
                  yLabel="Danh mục"
                  height={340}
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
