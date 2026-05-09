"use client";
/**
 * Interaction Page — RO3: Giờ Vàng Đăng Video.
 */
import { useEffect, useState } from "react";
import { api, type InteractionData } from "@/lib/api";
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
import { CATEGORIES, CATEGORY_COLORS, ENTERTAINMENT_HEATMAP_COLORSCALE, DURATION_ORDER, labelCategory, labelDuration, formatNumber } from "@/lib/constants";
import { TEXT_COLORS } from "@/lib/design-tokens";

export default function InteractionPage() {
  const [data, setData] = useState<InteractionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [durationGroup, setDurationGroup] = useState<string | null>("All");
  const [insight, setInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState("");

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

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);
    resetInsight();
  };

  const handleGetInsight = async () => {
    if (!data) return;
    setInsightLoading(true);
    setInsightError("");
    try {
      const response = await api.generateInsight({
        page: "interaction",
        filters: { categories: selectedCategories, duration_group: durationGroup === "All" ? null : durationGroup },
        summary: {
          heatmap: data.e2_heatmap,
          hour_category_video_count: data.e1_hour_category_video_count,
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
    setSelectedCategories([]);
    setDurationGroup("All");
    resetInsight();
  };

  const lineCategories = data?.categories.length ? data.categories : CATEGORIES;

  return (
    <div className="flex flex-col h-full">
      <FilterBar onReset={handleReset}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm ${TEXT_COLORS.slate}`}>Danh mục:</span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs border transition-colors ${selectedCategories.includes(cat) ? "bg-[#003c33] text-white border-[#003c33]" : "bg-white text-[#75758a] border-[#d9d9dd]"}`}
            >
              {labelCategory(cat)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label className={`text-sm ${TEXT_COLORS.slate}`}>Thời lượng:</label>
          <Select value={durationGroup} onValueChange={(value) => { setDurationGroup(value); resetInsight(); }}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Tất cả</SelectItem>
              {DURATION_ORDER.map((duration) => <SelectItem key={duration} value={duration}>{labelDuration(duration)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </FilterBar>

      <div className="flex-1 overflow-y-auto px-10 py-8">
        <header className="mb-8">
          <p className={`text-xs uppercase tracking-[0.2em] ${TEXT_COLORS.muted}`}>RO3</p>
          <h1 className={`mt-2 text-4xl font-semibold tracking-tight ${TEXT_COLORS.ink}`}>Giờ Vàng Đăng Video</h1>
          <p className={`mt-3 max-w-2xl ${TEXT_COLORS.slate}`}>
            Xác định khung giờ và ngày đăng hiệu quả bằng heatmap lượt xem trung vị và xu hướng số lượng video theo giờ của từng danh mục.
          </p>
        </header>

        {loading ? <p className={TEXT_COLORS.muted}>Đang tải dữ liệu...</p> : !data ? <p className={TEXT_COLORS.muted}>Không thể tải dữ liệu. Kiểm tra backend.</p> : (
          <>
            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ChartCard title="B1: Heatmap lượt xem trung vị theo ngày và giờ" description="Median view_count theo ngày trong tuần và giờ đăng">
                <HeatmapPlotly
                  z={data.e2_heatmap.z}
                  x={data.e2_heatmap.hours.map(String)}
                  y={data.e2_heatmap.days}
                  colorscale={ENTERTAINMENT_HEATMAP_COLORSCALE}
                  reversescale={false}
                  xLabel="Giờ đăng"
                  yLabel="Ngày trong tuần"
                  height={340}
                />
              </ChartCard>

              <ChartCard title="B2: Số lượng video theo giờ đăng" description="Mỗi đường biểu diễn một danh mục nội dung">
                <LineChart
                  data={data.e1_hour_category_video_count}
                  xKey="hour"
                  yFormatter={formatNumber}
                  lines={lineCategories.map((cat) => ({ key: cat, label: labelCategory(cat), color: CATEGORY_COLORS[cat] }))}
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
