/**
 * frontend/lib/api.ts
 * Typed fetch-based API client for all backend endpoints.
 * Base URL is configured via NEXT_PUBLIC_API_URL (default: http://localhost:8000).
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`API ${path} -> ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}
export type RequestStatus =
  | "pending"
  | "edited"
  | "approved"
  | "executing"
  | "executed"
  | "completed"
  | "failed"
  | "rejected";
// ── Utility types ─────────────────────────────────────────────────────────────

export type Schema = {
  filename: string;
  columns: string[];
  dtypes: Record<string, string>;
  row_count: number;
  sample_rows: Record<string, unknown>[];
};

export type LogItem = {
  id: string;
  created_at: string;
  prompt: string;
  status: RequestStatus;
  execution_time_ms: number | null;
  was_edited: boolean;
  has_figures: boolean;
};

// ── Data endpoint types ───────────────────────────────────────────────────────

export type KPI = {
  total_channels: number;
  total_videos: number;
  total_views: number;
  short_form_ratio: number;
};

export type OverviewMetricRow = {
  video_count: number;
  total_views: number;
  total_channels: number;
  short_form_ratio: number;
};

export type OverviewData = {
  kpis: KPI;
  /** Pie chart: category distribution — key from backend */
  a1_category_pie: ({ channel_category: string } & OverviewMetricRow)[];
  /** Line chart: total views by year — key from backend */
  a2_views_by_year: ({ channel_category: string; year: number } & OverviewMetricRow)[];
  /** Stacked area: short vs long ratio by year — key from backend */
  a3_short_long_ratio: ({ channel_category: string; year: number; short_count: number; long_count: number; short_ratio: number } & OverviewMetricRow)[];
};

export type ShortFormData = {
  /** Heatmap: channel × year → short_form_ratio */
  b1_heatmap: { channels: string[]; years: number[]; z: number[][] };
  /** Stacked bar: short vs long by year/quarter */
  b2_bar: { label: string; short: number; long: number }[];
};

export type ChannelsData = {
  /** RO2 B1: duration distribution normalized within each category */
  b1_duration_distribution: { category: string; short: number; medium: number; long: number }[];
  /** RO2 B2: median engagement_rate by category × duration group */
  b2_engagement_heatmap: { categories: string[]; durations: string[]; z: number[][] };
};

export type AnomalyData = {
  /** RO4 B1: viral count and viral rate by category */
  d1_viral_by_category: {
    category: string;
    viral_count: number;
    viral_rate: number;
    total_videos: number;
  }[];
  /** RO4 B2: per-channel viral momentum and global baseline */
  d2_viral_momentum: {
    points: {
      channel_id: string;
      channel_name: string;
      category: string;
      momentum_rate: number;
      n_viral_events: number;
    }[];
    baseline_all: number;
  };
};

export type InteractionData = {
  /** RO3 B2/E1: video counts by hour, one field per category */
  e1_hour_category_video_count: ({ hour: number } & Record<string, number>)[];
  /** RO3 B1/E2: day_of_week × hour_posted → median view_count */
  e2_heatmap: { days: string[]; hours: number[]; z: number[][] };
  categories: string[];
};

export type EconomyData = {
  /** RO5 B1: subscriber count vs average engagement rate */
  f1_subscriber_engagement_scatter: {
    channel_name: string;
    category: string;
    subscriber_count: number;
    avg_engagement_rate: number;
    total_view_count: number;
  }[];
  /** RO5 B2: channel strategy quadrant */
  f2_strategy_quadrant: {
    points: {
      channel_name: string;
      category: string;
      video_count_dataset: number;
      avg_views_per_video_dataset: number;
      subscriber_count: number;
    }[];
    median_x: number;
    median_y: number;
  };
  categories: string[];
};

// ── AI / Execute types ────────────────────────────────────────────────────────

export type GenerateResponse = {
  request_id: string;
  code: string;
  explanation: string;
  status: RequestStatus;
};

export type ExecuteResponse = {
  request_id: string;
  status: RequestStatus;
  stdout: string;
  stderr: string;
  figures: string[];          // base64 data URIs: "data:image/png;base64,..."
  execution_time_ms: number;
  error_message: string | null;
};

// ── Logs types ────────────────────────────────────────────────────────────────

export type LogListResponse = {
  total: number;
  items: LogItem[];
};

export type LogDetail = {
  id: string;
  created_at: string;
  prompt: string;
  ai_code: string;
  edited_code: string | null;
  was_edited: boolean;
  status: RequestStatus;
  explanation: string | null;
  stdout: string | null;
  stderr: string | null;
  figures: string[];
  chart: string | null;
  execution_time_ms: number | null;
  error_message: string | null;
};

// ── Gallery types ─────────────────────────────────────────────────────────────

export type SaveChartRequest = {
  title: string;
  figure_base64: string;
  prompt: string;
  analysis: string | null;
  request_id: string | null;
};

export type SavedChart = {
  id: string;
  title: string;
  figure_base64: string;
  prompt: string;
  analysis: string | null;
  created_at: string;
  request_id: string | null;
};

// ── Insight types ─────────────────────────────────────────────────────────────

export type InsightRequest = {
  page: string;
  filters: Record<string, unknown>;
  summary: Record<string, unknown>;
};

export type InsightResponse = {
  insight: string;
};

// ── API client ────────────────────────────────────────────────────────────────

export const api = {
  // ── Existing (preserved unchanged) ────────────────────────────────────────
  health: () => request<{ ok: boolean }>("/health"),
  schema: () => request<Schema>("/api/data/schema"),
  generate: (prompt: string) =>
    request<GenerateResponse>("/api/ai/generate", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }),

  // ── Data endpoints ─────────────────────────────────────────────────────────
  overview: (category?: string) => {
    const qs = category ? `?category=${encodeURIComponent(category)}` : "";
    return request<OverviewData>(`/api/data/overview${qs}`);
  },

  shortForm: (params: { year_from?: number; year_to?: number; category?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.year_from != null) qs.set("year_from", String(params.year_from));
    if (params.year_to != null)   qs.set("year_to", String(params.year_to));
    if (params.category)          qs.set("category", params.category);
    const str = qs.toString();
    return request<ShortFormData>(`/api/data/short-form${str ? `?${str}` : ""}`);
  },

  channels: (params: { category?: string; tier?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.category) qs.set("category", params.category);
    if (params.tier)     qs.set("tier", params.tier);
    const str = qs.toString();
    return request<ChannelsData>(`/api/data/channels${str ? `?${str}` : ""}`);
  },

  anomaly: (params: { channel_id?: string; year_from?: number; year_to?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.channel_id)       qs.set("channel_id", params.channel_id);
    if (params.year_from != null) qs.set("year_from", String(params.year_from));
    if (params.year_to != null)   qs.set("year_to", String(params.year_to));
    const str = qs.toString();
    return request<AnomalyData>(`/api/data/anomaly${str ? `?${str}` : ""}`);
  },

  interaction: (params: { categories?: string; duration_group?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.categories)      qs.set("categories", params.categories);
    if (params.duration_group)  qs.set("duration_group", params.duration_group);
    const str = qs.toString();
    return request<InteractionData>(`/api/data/interaction${str ? `?${str}` : ""}`);
  },

  economy: (params: { year_from?: string; categories?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.year_from)   qs.set("year_from", params.year_from);
    if (params.categories)  qs.set("categories", params.categories);
    const str = qs.toString();
    return request<EconomyData>(`/api/data/economy${str ? `?${str}` : ""}`);
  },

  // ── Execute ────────────────────────────────────────────────────────────────
  execute: (body: { request_id: string; code: string }) =>
    request<ExecuteResponse>("/api/execute", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // ── Logs ───────────────────────────────────────────────────────────────────
  logList: (params: { status?: string; limit?: number; offset?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.status)          qs.set("status", params.status);
    if (params.limit != null)   qs.set("limit", String(params.limit));
    if (params.offset != null)  qs.set("offset", String(params.offset));
    const str = qs.toString();
    return request<LogListResponse>(`/api/logs${str ? `?${str}` : ""}`);
  },

  logDetail: (id: string) => request<LogDetail>(`/api/logs/${encodeURIComponent(id)}`),

  updateLogStatus: (id: string, status: RequestStatus) =>
    request<LogDetail>(`/api/logs/${encodeURIComponent(id)}/status?status=${encodeURIComponent(status)}`, {
      method: "PATCH",
    }),
 
  /** @deprecated use logList() instead */
  logs: () => request<LogItem[]>("/api/logs"),

  // ── Gallery ────────────────────────────────────────────────────────────────
  saveChart: (body: SaveChartRequest) =>
    request<{ id: string; created_at: string }>("/api/gallery/save", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  listCharts: () => request<SavedChart[]>("/api/gallery"),

  deleteChart: (id: string) =>
    fetch(`${BASE}/api/gallery/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }).then((res) => {
      if (!res.ok) {
        throw new Error(`API /api/gallery/${id} -> ${res.status} ${res.statusText}`);
      }
    }),

  // ── Insights ───────────────────────────────────────────────────────────────
  generateInsight: (body: InsightRequest) =>
    request<InsightResponse>("/api/insights", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
