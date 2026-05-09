"use client";
/**
 * Anomaly Page — RO4: Giải Phẫu Video Viral.
 */
import { useEffect, useState } from "react";
import { api, type AnomalyData } from "@/lib/api";
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

export default function AnomalyPage() {
  const [data, setData] = useState<AnomalyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string | null>("All");
  const [insight, setInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      api
        .anomaly()
        .then((res) => {
          if (category && category !== "All") {
            setData({
              d1_viral_by_category: res.d1_viral_by_category.filter((row) => row.category === category),
              d2_viral_momentum: {
                baseline_all: res.d2_viral_momentum.baseline_all,
                points: res.d2_viral_momentum.points.filter((row) => row.category === category),
              },
            });
          } else {
            setData(res);
          }
        })
        .catch((err) => console.error("Failed to load RO4 data:", err))
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
        page: "anomaly",
        filters: { category: category === "All" ? null : category },
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
    setCategory("All");
    resetInsight();
  };

  const momentumCategories = data ? CATEGORIES.filter((cat) => data.d2_viral_momentum.points.some((point) => point.category === cat)) : [];

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
          <p className={`text-xs uppercase tracking-[0.2em] ${TEXT_COLORS.muted}`}>RO4</p>
          <h1 className={`mt-2 text-4xl font-semibold tracking-tight ${TEXT_COLORS.ink}`}>Giải Phẫu Video Viral</h1>
          <p className={`mt-3 max-w-2xl ${TEXT_COLORS.slate}`}>
            Phân tích danh mục nào tạo nhiều video viral nhất và mức lan truyền tiếp nối sau mỗi sự kiện viral.
          </p>
        </header>

        {loading ? <p className={TEXT_COLORS.muted}>Đang tải dữ liệu...</p> : !data ? <p className={TEXT_COLORS.muted}>Không thể tải dữ liệu. Kiểm tra backend.</p> : (
          <>
            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ChartCard title="B1: Số lượng và tỷ lệ video viral theo danh mục" description="Cột là số video viral, đường là viral rate">
                <DualAxisBarLinePlotly
                  x={data.d1_viral_by_category.map((row) => labelCategory(row.category))}
                  barY={data.d1_viral_by_category.map((row) => row.viral_count)}
                  lineY={data.d1_viral_by_category.map((row) => row.viral_rate)}
                  barLabel="Số video viral"
                  lineLabel="Tỷ lệ viral"
                  height={340}
                />
              </ChartCard>

              <ChartCard title="B2: Viral momentum theo kênh" description="Tỷ lệ viral trong 10 video tiếp theo sau mỗi video viral, trung bình theo kênh">
                <BoxPlotly
                  traces={momentumCategories.map((cat) => {
                    const points = data.d2_viral_momentum.points.filter((point) => point.category === cat);
                    return {
                      name: labelCategory(cat),
                      y: points.map((point) => point.momentum_rate),
                      text: points.map((point) => `${point.channel_name} (${point.n_viral_events} viral events)`),
                      color: CATEGORY_COLORS[cat],
                    };
                  })}
                  yLabel="Viral momentum rate"
                  height={340}
                  showPoints
                  percent
                  baseline={data.d2_viral_momentum.baseline_all}
                  baselineLabel="Viral baseline toàn bộ dataset"
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
