"use client";
import React, { createContext, useContext, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export type DurationFilter = "Short" | "Medium" | "Long";
export type RangeFilter = { min: number; max: number };

export type FilterDimension =
  | "category"
  | "year"
  | "viewRange"
  | "videoRange"
  | "duration"
  | "hour"
  | "day_of_week"
  | "channel"
  | "subscriber_range"
  | "viral_threshold";

export type FilterValue = string | number | RangeFilter | null;

export interface FilterState {
  category: string | null;
  year: number | null;
  viewRange: RangeFilter | null;
  videoRange: RangeFilter | null;
  duration: DurationFilter | null;
  hour: number | null;
  day_of_week: number | null;
  channel: string | null;
  subscriber_range: RangeFilter | null;
  viral_threshold: number | null;
}

const EMPTY_FILTERS: FilterState = {
  category: null,
  year: null,
  viewRange: null,
  videoRange: null,
  duration: null,
  hour: null,
  day_of_week: null,
  channel: null,
  subscriber_range: null,
  viral_threshold: null,
};

interface MultiDimensionalFilterContextValue {
  filters: FilterState;
  updateFilter: (dimension: FilterDimension, value: FilterValue) => void;
  clearFilter: (dimension: FilterDimension) => void;
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
}

const MultiDimensionalFilterContext = createContext<MultiDimensionalFilterContextValue>({
  filters: EMPTY_FILTERS,
  updateFilter: () => {},
  clearFilter: () => {},
  clearAllFilters: () => {},
  hasActiveFilters: false,
});

function parseInteger(value: string | null): number | null {
  if (!value) return null;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function isDuration(value: string | null): value is DurationFilter {
  return value === "Short" || value === "Medium" || value === "Long";
}

function rangesEqual(left: RangeFilter | null, right: RangeFilter | null): boolean {
  return left?.min === right?.min && left?.max === right?.max;
}

/**
 * Parse filters from URL query parameters.
 */
export function parseFiltersFromURL(searchParams: URLSearchParams): FilterState {
  const filters: FilterState = { ...EMPTY_FILTERS };

  const category = searchParams.get("category");
  if (category) filters.category = category;

  const year = parseInteger(searchParams.get("year"));
  if (year !== null) filters.year = year;

  const viewMin = parseInteger(searchParams.get("viewMin"));
  const viewMax = parseInteger(searchParams.get("viewMax"));
  if (viewMin !== null && viewMax !== null) filters.viewRange = { min: viewMin, max: viewMax };

  const videoMin = parseInteger(searchParams.get("videoMin"));
  const videoMax = parseInteger(searchParams.get("videoMax"));
  if (videoMin !== null && videoMax !== null) filters.videoRange = { min: videoMin, max: videoMax };

  const duration = searchParams.get("duration");
  if (isDuration(duration)) filters.duration = duration;

  const hour = parseInteger(searchParams.get("hour"));
  if (hour !== null && hour >= 0 && hour <= 23) filters.hour = hour;

  const dayOfWeek = parseInteger(searchParams.get("dayOfWeek"));
  if (dayOfWeek !== null && dayOfWeek >= 0 && dayOfWeek <= 6) filters.day_of_week = dayOfWeek;

  const channel = searchParams.get("channel");
  if (channel) filters.channel = channel;

  const subscriberMin = parseInteger(searchParams.get("subscriberMin"));
  const subscriberMax = parseInteger(searchParams.get("subscriberMax"));
  if (subscriberMin !== null && subscriberMax !== null) {
    filters.subscriber_range = { min: subscriberMin, max: subscriberMax };
  }

  const viralThreshold = parseInteger(searchParams.get("viralThreshold"));
  if (viralThreshold !== null) filters.viral_threshold = viralThreshold;

  return filters;
}

function serializeFilters(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.category) params.set("category", filters.category);
  if (filters.year !== null) params.set("year", filters.year.toString());
  if (filters.viewRange) {
    params.set("viewMin", filters.viewRange.min.toString());
    params.set("viewMax", filters.viewRange.max.toString());
  }
  if (filters.videoRange) {
    params.set("videoMin", filters.videoRange.min.toString());
    params.set("videoMax", filters.videoRange.max.toString());
  }
  if (filters.duration) params.set("duration", filters.duration);
  if (filters.hour !== null) params.set("hour", filters.hour.toString());
  if (filters.day_of_week !== null) params.set("dayOfWeek", filters.day_of_week.toString());
  if (filters.channel) params.set("channel", filters.channel);
  if (filters.subscriber_range) {
    params.set("subscriberMin", filters.subscriber_range.min.toString());
    params.set("subscriberMax", filters.subscriber_range.max.toString());
  }
  if (filters.viral_threshold !== null) {
    params.set("viralThreshold", filters.viral_threshold.toString());
  }

  return params;
}

/**
 * Provider - wrap dashboard pages with this to enable URL-synced filters.
 */
export function MultiDimensionalFilterProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const filters = useMemo(() => parseFiltersFromURL(searchParams), [searchParams]);

  const updateFilter = useCallback(
    (dimension: FilterDimension, value: FilterValue) => {
      const newFilters: FilterState = { ...filters };

      if (dimension === "category") {
        newFilters.category = filters.category === value ? null : (value as string | null);
      } else if (dimension === "year") {
        newFilters.year = filters.year === value ? null : (value as number | null);
      } else if (dimension === "viewRange") {
        newFilters.viewRange = value as RangeFilter | null;
      } else if (dimension === "videoRange") {
        newFilters.videoRange = value as RangeFilter | null;
      } else if (dimension === "duration") {
        newFilters.duration = filters.duration === value ? null : (value as DurationFilter | null);
      } else if (dimension === "hour") {
        newFilters.hour = filters.hour === value ? null : (value as number | null);
      } else if (dimension === "day_of_week") {
        newFilters.day_of_week = filters.day_of_week === value ? null : (value as number | null);
      } else if (dimension === "channel") {
        newFilters.channel = filters.channel === value ? null : (value as string | null);
      } else if (dimension === "subscriber_range") {
        const nextRange = value as RangeFilter | null;
        newFilters.subscriber_range = rangesEqual(filters.subscriber_range, nextRange) ? null : nextRange;
      } else if (dimension === "viral_threshold") {
        newFilters.viral_threshold = filters.viral_threshold === value ? null : (value as number | null);
      }

      const queryString = serializeFilters(newFilters).toString();
      router.push(queryString ? `?${queryString}` : window.location.pathname, { scroll: false });
    },
    [filters, router]
  );

  const clearFilter = useCallback(
    (dimension: FilterDimension) => {
      updateFilter(dimension, null);
    },
    [updateFilter]
  );

  const clearAllFilters = useCallback(() => {
    router.push(window.location.pathname, { scroll: false });
  }, [router]);

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some((value) => value !== null);
  }, [filters]);

  const value = useMemo(
    () => ({
      filters,
      updateFilter,
      clearFilter,
      clearAllFilters,
      hasActiveFilters,
    }),
    [filters, updateFilter, clearFilter, clearAllFilters, hasActiveFilters]
  );

  return (
    <MultiDimensionalFilterContext.Provider value={value}>
      {children}
    </MultiDimensionalFilterContext.Provider>
  );
}

/**
 * Hook - consume multi-dimensional filter state in any component.
 */
export function useMultiDimensionalFilter() {
  return useContext(MultiDimensionalFilterContext);
}
