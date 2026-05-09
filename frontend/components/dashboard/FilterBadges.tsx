/**
 * FilterBadges - Display active filters with clear buttons
 * Shows badges for each active filter dimension
 */

import { X } from "lucide-react";
import { FilterState, FilterDimension } from "@/app/MultiDimensionalFilterContext";
import { Button } from "@/components/ui/button";

interface FilterBadgesProps {
  filters: FilterState;
  onClearFilter: (dimension: FilterDimension) => void;
  onClearAll: () => void;
}

export function FilterBadges({ filters, onClearFilter, onClearAll }: FilterBadgesProps) {
  const badges: { dimension: FilterDimension; label: string; value: string }[] = [];

  if (filters.category) {
    badges.push({
      dimension: "category",
      label: "Danh mục",
      value: filters.category,
    });
  }

  if (filters.year !== null) {
    badges.push({
      dimension: "year",
      label: "Năm",
      value: filters.year.toString(),
    });
  }

  if (filters.viewRange) {
    badges.push({
      dimension: "viewRange",
      label: "Lượt xem",
      value: `${filters.viewRange.min.toLocaleString()} - ${filters.viewRange.max.toLocaleString()}`,
    });
  }

  if (filters.videoRange) {
    badges.push({
      dimension: "videoRange",
      label: "Số video",
      value: `${filters.videoRange.min} - ${filters.videoRange.max}`,
    });
  }

  if (filters.duration) {
    badges.push({ dimension: "duration", label: "Thời lượng", value: filters.duration });
  }

  if (filters.hour !== null) {
    badges.push({ dimension: "hour", label: "Giờ", value: `${filters.hour}:00` });
  }

  if (filters.day_of_week !== null) {
    badges.push({ dimension: "day_of_week", label: "Ngày", value: filters.day_of_week.toString() });
  }

  if (filters.channel) {
    badges.push({ dimension: "channel", label: "Kênh", value: filters.channel });
  }

  if (filters.subscriber_range) {
    badges.push({
      dimension: "subscriber_range",
      label: "Người đăng ký",
      value: `${filters.subscriber_range.min.toLocaleString()} - ${filters.subscriber_range.max.toLocaleString()}`,
    });
  }

  if (filters.viral_threshold !== null) {
    badges.push({
      dimension: "viral_threshold",
      label: "Ngưỡng viral",
      value: filters.viral_threshold.toLocaleString(),
    });
  }

  if (badges.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 animate-in fade-in duration-300">
      <span className="text-sm font-medium text-zinc-600">Bộ lọc:</span>

      {badges.map((badge) => (
        <div
          key={badge.dimension}
          className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1.5 text-sm font-medium text-purple-800 transition-all hover:bg-purple-200 animate-in fade-in slide-in-from-left-2 duration-300"
        >
          <span className="text-xs text-purple-600">{badge.label}:</span>
          <span>{badge.value}</span>
          <button
            onClick={() => onClearFilter(badge.dimension)}
            className="ml-1 rounded-full p-0.5 hover:bg-purple-300 transition-colors"
            aria-label={`Xóa bộ lọc ${badge.label}`}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}

      {badges.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-8 text-xs text-zinc-600 hover:text-zinc-900 animate-in fade-in slide-in-from-right-2 duration-300"
        >
          Xóa tất cả bộ lọc
        </Button>
      )}
    </div>
  );
}
