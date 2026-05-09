/**
 * Client-side filtering utilities for dashboard pages.
 * Filters data in-memory for instant response (<100ms).
 */

import { FilterState } from "@/app/MultiDimensionalFilterContext";

export interface FilterableData {
  year?: number;
  channel_category?: string;
  category?: string;
  duration?: string;
  duration_type?: string;
  hour?: number;
  day_of_week?: number;
  channel_name?: string;
  channel?: string;
  subscriber_count?: number;
  total_views?: number;
  view_count?: number;
  video_count?: number;
  [key: string]: unknown;
}

function getCategory(item: FilterableData): string | undefined {
  return item.channel_category ?? item.category;
}

function getDuration(item: FilterableData): string | undefined {
  return item.duration ?? item.duration_type;
}

function getChannel(item: FilterableData): string | undefined {
  return item.channel_name ?? item.channel;
}

function getViews(item: FilterableData): number | undefined {
  return item.total_views ?? item.view_count;
}

function equalsIgnoreCase(left: string | undefined, right: string): boolean {
  return left?.toLowerCase() === right.toLowerCase();
}

/**
 * Apply multi-dimensional filters to data array.
 * Combines filters with AND logic.
 */
export function applyFilters<T extends FilterableData>(
  data: T[],
  filters: FilterState
): T[] {
  let result = data;

  // Filter by category.
  if (filters.category) {
    result = result.filter((item) => equalsIgnoreCase(getCategory(item), filters.category!));
  }

  // Filter by year.
  if (filters.year !== null) {
    result = result.filter((item) => item.year === filters.year);
  }

  // Filter by duration bucket.
  if (filters.duration) {
    result = result.filter((item) => equalsIgnoreCase(getDuration(item), filters.duration!));
  }

  // Filter by publish hour.
  if (filters.hour !== null) {
    result = result.filter((item) => item.hour === filters.hour);
  }

  // Filter by day of week (0-6).
  if (filters.day_of_week !== null) {
    result = result.filter((item) => item.day_of_week === filters.day_of_week);
  }

  // Filter by channel name.
  if (filters.channel) {
    result = result.filter((item) => equalsIgnoreCase(getChannel(item), filters.channel!));
  }

  // Filter by subscriber count range.
  if (filters.subscriber_range) {
    result = result.filter((item) => {
      if (typeof item.subscriber_count !== "number") return true;
      return (
        item.subscriber_count >= filters.subscriber_range!.min &&
        item.subscriber_count <= filters.subscriber_range!.max
      );
    });
  }

  // Filter by minimum viral threshold based on available view metric.
  if (filters.viral_threshold !== null) {
    result = result.filter((item) => {
      const views = getViews(item);
      if (typeof views !== "number") return true;
      return views >= filters.viral_threshold!;
    });
  }

  // Filter by view range.
  if (filters.viewRange) {
    result = result.filter((item) => {
      const views = getViews(item);
      if (typeof views !== "number") return true;
      return views >= filters.viewRange!.min && views <= filters.viewRange!.max;
    });
  }

  // Filter by video range.
  if (filters.videoRange) {
    result = result.filter((item) => {
      if (typeof item.video_count !== "number") return true;
      return (
        item.video_count >= filters.videoRange!.min &&
        item.video_count <= filters.videoRange!.max
      );
    });
  }

  return result;
}
