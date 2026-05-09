/**
 * Performance and behavior tests for client-side filtering.
 * Verifies <100ms response time for typical datasets and all supported dimensions.
 */

import { applyFilters, FilterableData } from "../filterUtils";
import { FilterState } from "@/app/MultiDimensionalFilterContext";

function emptyFilters(overrides: Partial<FilterState> = {}): FilterState {
  return {
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
    ...overrides,
  };
}

// Generate mock data.
function generateMockData(count: number): FilterableData[] {
  const categories = ["music", "gaming", "education", "entertainment", "tech"];
  const years = [2019, 2020, 2021, 2022, 2023, 2024];
  const durations = ["Short", "Medium", "Long"];
  const channels = ["Alpha", "Beta", "Gamma", "Delta"];
  const data: FilterableData[] = [];

  for (let i = 0; i < count; i++) {
    data.push({
      year: years[i % years.length],
      channel_category: categories[i % categories.length],
      duration: durations[i % durations.length],
      hour: i % 24,
      day_of_week: i % 7,
      channel_name: channels[i % channels.length],
      subscriber_count: 100_000 + i * 10_000,
      total_views: Math.floor(Math.random() * 10_000_000),
      video_count: Math.floor(Math.random() * 1000),
    });
  }

  return data;
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

// Test filtering performance.
console.log("Testing client-side filtering performance...");

const mockData = generateMockData(1000);

const start1 = performance.now();
const filtered1 = applyFilters(mockData, emptyFilters({ category: "music" }));
const elapsed1 = performance.now() - start1;
console.log(`Category filter: ${elapsed1.toFixed(2)}ms (${filtered1.length} results)`);
assert(filtered1.every((item) => item.channel_category === "music"), "Category filter failed");

const start2 = performance.now();
const filtered2 = applyFilters(mockData, emptyFilters({ year: 2023 }));
const elapsed2 = performance.now() - start2;
console.log(`Year filter: ${elapsed2.toFixed(2)}ms (${filtered2.length} results)`);
assert(filtered2.every((item) => item.year === 2023), "Year filter failed");

const start3 = performance.now();
const filtered3 = applyFilters(
  mockData,
  emptyFilters({ category: "gaming", year: 2022, viewRange: { min: 100_000, max: 5_000_000 } })
);
const elapsed3 = performance.now() - start3;
console.log(`Combined filters: ${elapsed3.toFixed(2)}ms (${filtered3.length} results)`);
assert(
  filtered3.every(
    (item) =>
      item.channel_category === "gaming" &&
      item.year === 2022 &&
      typeof item.total_views === "number" &&
      item.total_views >= 100_000 &&
      item.total_views <= 5_000_000
  ),
  "Combined filter failed"
);

const dimensionTests: Array<{ name: string; filters: Partial<FilterState>; predicate: (item: FilterableData) => boolean }> = [
  { name: "Duration", filters: { duration: "Short" }, predicate: (item) => item.duration === "Short" },
  { name: "Hour", filters: { hour: 18 }, predicate: (item) => item.hour === 18 },
  { name: "Day of week", filters: { day_of_week: 5 }, predicate: (item) => item.day_of_week === 5 },
  { name: "Channel", filters: { channel: "Beta" }, predicate: (item) => item.channel_name === "Beta" },
  {
    name: "Subscriber range",
    filters: { subscriber_range: { min: 500_000, max: 1_000_000 } },
    predicate: (item) =>
      typeof item.subscriber_count === "number" &&
      item.subscriber_count >= 500_000 &&
      item.subscriber_count <= 1_000_000,
  },
  {
    name: "Viral threshold",
    filters: { viral_threshold: 1_000_000 },
    predicate: (item) => typeof item.total_views === "number" && item.total_views >= 1_000_000,
  },
];

for (const test of dimensionTests) {
  const result = applyFilters(mockData, emptyFilters(test.filters));
  console.log(`${test.name} filter: ${result.length} results`);
  assert(result.every(test.predicate), `${test.name} filter failed`);
}

const maxTime = Math.max(elapsed1, elapsed2, elapsed3);
console.log(`\nMax time: ${maxTime.toFixed(2)}ms`);
console.log(
  maxTime < 100
    ? "✓ PASS: All timed filters < 100ms"
    : "✗ FAIL: Some timed filters >= 100ms"
);
