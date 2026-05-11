from __future__ import annotations

from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
VIDEOS_CSV = DATA_DIR / "videos_processed.csv"
CHANNELS_CSV = DATA_DIR / "channels_processed.csv"

_videos: pd.DataFrame | None = None
_channels: pd.DataFrame | None = None

CATEGORY_ORDER = ["Comedy", "Kids", "Music", "Sports", "News", "Education", "Gaming", "Vlog"]
DURATION_ORDER = ["Short", "Medium", "Long"]
DAY_NAMES_VI = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"]


def _ordered_categories(values: pd.Series | list[Any]) -> list[str]:
    seen = {str(v) for v in pd.Series(values).dropna().tolist()}
    ordered = [cat for cat in CATEGORY_ORDER if cat in seen]
    extras = sorted(seen - set(ordered))
    return ordered + extras


def _ordered_category_frame(df: pd.DataFrame, column: str = "category") -> pd.DataFrame:
    if df.empty or column not in df.columns:
        return df
    order = {cat: idx for idx, cat in enumerate(CATEGORY_ORDER)}
    return (
        df.assign(_category_order=df[column].map(lambda x: order.get(str(x), len(order))))
        .sort_values(["_category_order", column])
        .drop(columns=["_category_order"])
    )


def _to_bool_series(series: pd.Series) -> pd.Series:
    if pd.api.types.is_bool_dtype(series):
        return series.fillna(False).astype(bool)
    if pd.api.types.is_numeric_dtype(series):
        return series.fillna(0).astype(float) != 0
    normalized = series.astype(str).str.strip().str.lower()
    return normalized.isin(["true", "1", "yes", "y", "viral"])


def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        if pd.isna(value):
            return default
        out = float(value)
        return out if not (np.isnan(out) or np.isinf(out)) else default
    except Exception:
        return default


def _safe_int(value: Any, default: int = 0) -> int:
    try:
        if pd.isna(value):
            return default
        return int(value)
    except Exception:
        return default


def load() -> None:
    global _videos, _channels
    if not VIDEOS_CSV.exists():
        raise RuntimeError(
            f"Thiếu file dữ liệu: {VIDEOS_CSV}. Đặt videos_processed.csv vào backend/data/."
        )
    if not CHANNELS_CSV.exists():
        raise RuntimeError(
            f"Thiếu file dữ liệu: {CHANNELS_CSV}. Đặt channels_processed.csv vào backend/data/."
        )
    _videos = pd.read_csv(VIDEOS_CSV)
    _channels = pd.read_csv(CHANNELS_CSV)
    if "published_at" in _videos.columns:
        _videos["_published_dt"] = pd.to_datetime(
            _videos["published_at"], errors="coerce", utc=True
        )


def _require_loaded() -> tuple[pd.DataFrame, pd.DataFrame]:
    if _videos is None or _channels is None:
        raise RuntimeError("Data store chưa load. Gọi load() ở lifespan trước.")
    return _videos, _channels


def get_videos() -> pd.DataFrame:
    v, _ = _require_loaded()
    return v


def get_channels() -> pd.DataFrame:
    _, c = _require_loaded()
    return c


def _column_meta(df: pd.DataFrame) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for col in df.columns:
        if col.startswith("_"):
            continue
        s = df[col]
        dtype = str(s.dtype)
        entry: dict[str, Any] = {
            "name": col,
            "dtype": dtype,
            "null_count": int(s.isna().sum()),
            "min": None,
            "max": None,
            "mean": None,
            "sample_values": None,
        }
        if pd.api.types.is_bool_dtype(s):
            entry["sample_values"] = [True, False]
        elif pd.api.types.is_numeric_dtype(s):
            non_null = s.dropna()
            if len(non_null) > 0:
                entry["min"] = float(non_null.min())
                entry["max"] = float(non_null.max())
                entry["mean"] = float(non_null.mean())
        elif pd.api.types.is_string_dtype(s) or s.dtype == object:
            unique_vals = s.dropna().unique().tolist()
            if len(unique_vals) <= 30:
                entry["sample_values"] = sorted(str(v) for v in unique_vals)
            else:
                entry["sample_values"] = sorted(str(v) for v in unique_vals[:10])
        out.append(entry)
    return out


def get_full_schema() -> dict[str, Any]:
    v, c = _require_loaded()
    return {
        "videos": {
            "row_count": int(len(v)),
            "columns": _column_meta(v),
        },
        "channels": {
            "row_count": int(len(c)),
            "columns": _column_meta(c),
        },
    }


def _to_jsonable(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {k: _to_jsonable(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_to_jsonable(x) for x in obj]
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        f = float(obj)
        return f if not (np.isnan(f) or np.isinf(f)) else None
    if isinstance(obj, (np.bool_,)):
        return bool(obj)
    if isinstance(obj, pd.Timestamp):
        return obj.isoformat()
    if isinstance(obj, float) and (np.isnan(obj) or np.isinf(obj)):
        return None
    return obj


def _records(df: pd.DataFrame) -> list[dict[str, Any]]:
    return _to_jsonable(df.where(pd.notna(df), None).to_dict(orient="records"))


def get_overview(category: str | None = None) -> dict[str, Any]:
    v, c = _require_loaded()
    
    filtered = v if not category else v[v["channel_category"] == category]
    filtered_channels = c if not category else c[c["channel_category"] == category]

    total_videos = int(len(filtered))
    total_channels = int(filtered_channels["channel_id"].nunique()) if "channel_id" in filtered_channels.columns else 0
    total_views = int(filtered["view_count"].sum()) if "view_count" in filtered.columns else 0
    short_ratio = (
        float(filtered["is_short_form"].mean()) if "is_short_form" in filtered.columns else 0.0
    )

    a1_src = (
        filtered.groupby("channel_category", dropna=True)
        .agg(
            video_count=("video_id", "size"),
            total_views=("view_count", "sum"),
            total_channels=("channel_name", "nunique"),
            short_form_ratio=("is_short_form", "mean"),
        )
        .reset_index()
        .sort_values("video_count", ascending=False)
    )
    a1 = _records(a1_src)

    a2_src = (
        filtered.groupby(["channel_category", "year"], dropna=True)
        .agg(
            total_views=("view_count", "sum"),
            video_count=("video_id", "size"),
            total_channels=("channel_name", "nunique"),
            short_form_ratio=("is_short_form", "mean"),
        )
        .reset_index()
        .sort_values("year")
    )
    a2 = _records(a2_src)

    a3_rows: list[dict[str, Any]] = []
    if "year" in filtered.columns and "is_short_form" in filtered.columns:
        grouped = filtered.groupby(["channel_category", "year"], dropna=True)
        for year, sub in grouped:
            total = int(len(sub))
            shorts = int(sub["is_short_form"].sum())
            longs = total - shorts
            a3_rows.append(
                {
                    "year": int(year[1] if isinstance(year, tuple) else year),
                    "channel_category": str(year[0]) if isinstance(year, tuple) else None,
                    "short_count": shorts,
                    "long_count": longs,
                    "short_ratio": (shorts / total) if total else 0.0,
                    "video_count": total,
                    "total_views": int(sub["view_count"].sum()),
                    "total_channels": int(sub["channel_name"].nunique()),
                    "short_form_ratio": (shorts / total) if total else 0.0,
                }
            )
        a3_rows.sort(key=lambda r: r["year"])

    return {
        "kpis": {
            "total_videos": total_videos,
            "total_channels": total_channels,
            "total_views": total_views,
            "short_form_ratio": short_ratio,
        },
        "a1_category_pie": a1,
        "a2_views_by_year": a2,
        "a3_short_long_ratio": a3_rows,
    }


def get_short_form(
    year_from: int | None = None, year_to: int | None = None, category: str | None = None
) -> dict[str, Any]:
    v, _ = _require_loaded()

    # B1: Heatmap - group by category (if no category selected) or by channel (if category selected)
    if category:
        # Show channels within the selected category
        v_filtered = v[v["channel_category"] == category]
        ratio_df = (
            v_filtered.groupby(["channel_name", "year"], dropna=True)
            .agg(
                short_count=("is_short_form", lambda x: (x == True).sum()),  # noqa: E712
                total_count=("is_short_form", "count")
            )
            .reset_index()
        )
        ratio_df["short_form_ratio"] = ratio_df["short_count"] / ratio_df["total_count"]
        group_by_field = "channel_name"
    else:
        # Show categories
        ratio_df = (
            v.groupby(["channel_category", "year"], dropna=True)
            .agg(
                short_count=("is_short_form", lambda x: (x == True).sum()),  # noqa: E712
                total_count=("is_short_form", "count")
            )
            .reset_index()
        )
        ratio_df["short_form_ratio"] = ratio_df["short_count"] / ratio_df["total_count"]
        ratio_df["channel_name"] = ratio_df["channel_category"]
        group_by_field = "channel_category"

    if year_from is not None:
        ratio_df = ratio_df[ratio_df["year"] >= year_from]
    if year_to is not None:
        ratio_df = ratio_df[ratio_df["year"] <= year_to]

    # Pivot to create heatmap matrix
    pivot = ratio_df.pivot_table(
        index="channel_name",
        columns="year",
        values="short_form_ratio",
        fill_value=0
    )

    b1_heatmap = {
        "channels": pivot.index.tolist(),
        "years": pivot.columns.tolist(),
        "z": pivot.values.tolist()
    }

    # B2: Stacked bar chart - short vs long by year
    year_counts = v.groupby("year", dropna=True).agg(
        short=("is_short_form", lambda x: (x == True).sum()),  # noqa: E712
        long=("is_short_form", lambda x: (x == False).sum())   # noqa: E712
    ).reset_index()

    if year_from is not None:
        year_counts = year_counts[year_counts["year"] >= year_from]
    if year_to is not None:
        year_counts = year_counts[year_counts["year"] <= year_to]
    if category:
        v_cat = v[v["channel_category"] == category]
        year_counts = v_cat.groupby("year", dropna=True).agg(
            short=("is_short_form", lambda x: (x == True).sum()),  # noqa: E712
            long=("is_short_form", lambda x: (x == False).sum())   # noqa: E712
        ).reset_index()
        if year_from is not None:
            year_counts = year_counts[year_counts["year"] >= year_from]
        if year_to is not None:
            year_counts = year_counts[year_counts["year"] <= year_to]

    b2_bar = [
        {
            "label": str(int(row["year"])),
            "short": int(row["short"]),
            "long": int(row["long"])
        }
        for _, row in year_counts.iterrows()
    ]

    pivot_channels = _compute_pivot_channels(v)

    return {
        "b1_heatmap": b1_heatmap,
        "b2_bar": b2_bar,
        "pivot_channels": pivot_channels,
    }


def _compute_pivot_channels(v: pd.DataFrame) -> list[dict[str, Any]]:
    if "year" not in v.columns or "is_short_form" not in v.columns:
        return []

    def _ratio_for(window: pd.DataFrame) -> pd.DataFrame:
        grp = (
            window.groupby("channel_name", dropna=True)
            .agg(
                short_count=("is_short_form", lambda s: int((s == True).sum())),  # noqa: E712
                total_count=("is_short_form", "count"),
            )
            .reset_index()
        )
        grp = grp[grp["total_count"] > 0]
        grp["ratio"] = grp["short_count"] / grp["total_count"]
        return grp[["channel_name", "ratio"]]

    old = _ratio_for(v[v["year"] < 2020]).rename(columns={"ratio": "ratio_old"})
    new = _ratio_for(v[v["year"] >= 2024]).rename(columns={"ratio": "ratio_new"})

    merged = pd.merge(old, new, on="channel_name", how="inner")
    if merged.empty:
        return []
    merged["diff"] = merged["ratio_new"] - merged["ratio_old"]
    top5 = merged.nlargest(5, "diff")
    return [
        {
            "channel_name": str(row["channel_name"]),
            "ratio_old": float(row["ratio_old"]),
            "ratio_new": float(row["ratio_new"]),
            "diff": float(row["diff"]),
        }
        for _, row in top5.iterrows()
    ]


def get_channels_data(
    category: str | None = None, tier: str | None = None
) -> dict[str, Any]:
    v, _ = _require_loaded()
    df = v.copy()
    if category:
        df = df[df["channel_category"] == category]

    categories = _ordered_categories(df["channel_category"] if "channel_category" in df.columns else [])

    b1_duration_distribution: list[dict[str, Any]] = []
    if {"channel_category", "duration_group"}.issubset(df.columns):
        counts = (
            df[df["duration_group"].isin(DURATION_ORDER)]
            .groupby(["channel_category", "duration_group"], dropna=True)
            .size()
            .reset_index(name="count")
        )
        for cat in categories:
            row: dict[str, Any] = {"category": cat, "short": 0.0, "medium": 0.0, "long": 0.0}
            sub = counts[counts["channel_category"] == cat]
            total = float(sub["count"].sum())
            if total > 0:
                for duration in DURATION_ORDER:
                    count = sub.loc[sub["duration_group"] == duration, "count"].sum()
                    row[duration.lower()] = float(count / total)
            b1_duration_distribution.append(row)

    b2_engagement_heatmap = {"categories": categories, "durations": DURATION_ORDER, "z": []}
    if {"channel_category", "duration_group", "engagement_rate"}.issubset(df.columns):
        pivot = (
            df[df["duration_group"].isin(DURATION_ORDER)]
            .pivot_table(
                index="channel_category",
                columns="duration_group",
                values="engagement_rate",
                aggfunc="median",
                fill_value=0,
            )
            .reindex(index=categories, columns=DURATION_ORDER, fill_value=0)
        )
        b2_engagement_heatmap["z"] = pivot.values.tolist()

    return {
        "b1_duration_distribution": b1_duration_distribution,
        "b2_engagement_heatmap": b2_engagement_heatmap,
    }


def _compute_median_by_year(
    v: pd.DataFrame, category: str | None = None
) -> list[dict[str, Any]]:
    if "year" not in v.columns or "channel_category" not in v.columns or "view_count" not in v.columns:
        return []
    df = v if not category else v[v["channel_category"] == category]
    grouped = (
        df.dropna(subset=["year", "channel_category"])
        .groupby(["year", "channel_category"])["view_count"]
        .median()
        .reset_index()
        .rename(columns={"view_count": "median_views"})
        .sort_values(["year", "channel_category"])
    )
    return [
        {
            "year": int(row["year"]),
            "category": str(row["channel_category"]),
            "median_views": float(row["median_views"]),
        }
        for _, row in grouped.iterrows()
    ]


def get_anomaly(
    channel_id: str | None = None,
    year_from: int | None = None,
    year_to: int | None = None,
) -> dict[str, Any]:
    v, _ = _require_loaded()
    df = v.copy()
    if channel_id:
        df = df[df["channel_id"] == channel_id]
    if year_from is not None and "year" in df.columns:
        df = df[df["year"] >= year_from]
    if year_to is not None and "year" in df.columns:
        df = df[df["year"] <= year_to]

    if "is_viral" in df.columns:
        df = df.assign(_is_viral_bool=_to_bool_series(df["is_viral"]))
    else:
        df = df.assign(_is_viral_bool=False)

    d1_viral_by_category: list[dict[str, Any]] = []
    if "channel_category" in df.columns:
        grouped = (
            df.groupby("channel_category", dropna=True)["_is_viral_bool"]
            .agg(viral_count="sum", viral_rate="mean", total_videos="count")
            .reset_index()
            .rename(columns={"channel_category": "category"})
        )
        grouped = _ordered_category_frame(grouped)
        d1_viral_by_category = [
            {
                "category": str(row["category"]),
                "viral_count": int(row["viral_count"]),
                "viral_rate": float(row["viral_rate"]),
                "total_videos": int(row["total_videos"]),
            }
            for _, row in grouped.iterrows()
        ]

    momentum_points: list[dict[str, Any]] = []
    if {"channel_id", "channel_name", "channel_category"}.issubset(df.columns):
        sort_col = "_published_dt" if "_published_dt" in df.columns else "published_at"
        work = df.copy()
        if sort_col == "published_at":
            work["_published_sort"] = pd.to_datetime(work["published_at"], errors="coerce", utc=True)
            sort_col = "_published_sort"
        for channel_id_value, grp in work.groupby("channel_id", dropna=True):
            grp = grp.sort_values(sort_col).reset_index(drop=True)
            viral_positions = grp.index[grp["_is_viral_bool"] == True].tolist()  # noqa: E712
            rates: list[float] = []
            for pos in viral_positions:
                next_10 = grp.iloc[pos + 1 : pos + 11]["_is_viral_bool"]
                rates.append(float(next_10.sum()) / 10.0)
            if rates:
                momentum_points.append({
                    "channel_id": str(channel_id_value),
                    "channel_name": str(grp["channel_name"].iloc[0]),
                    "category": str(grp["channel_category"].iloc[0]),
                    "momentum_rate": float(np.mean(rates)),
                    "n_viral_events": int(len(viral_positions)),
                })

    momentum_points.sort(key=lambda r: (CATEGORY_ORDER.index(r["category"]) if r["category"] in CATEGORY_ORDER else len(CATEGORY_ORDER), r["channel_name"]))

    return {
        "d1_viral_by_category": d1_viral_by_category,
        "d2_viral_momentum": {
            "points": momentum_points,
            "baseline_all": float(df["_is_viral_bool"].mean()) if len(df) else 0.0,
        },
    }


def get_interaction(
    categories: list[str] | None = None, duration_group: str | None = None
) -> dict[str, Any]:
    v, _ = _require_loaded()
    df = v.copy()
    if categories:
        df = df[df["channel_category"].isin(categories)]
    if duration_group:
        df = df[df["duration_group"] == duration_group]

    utc_time = df["_published_dt"] if "_published_dt" in df.columns else None
    local_time = utc_time.dt.tz_convert("Asia/Ho_Chi_Minh") if utc_time is not None else None

    e2_heatmap = {"days": DAY_NAMES_VI, "hours": list(range(24)), "z": [[0.0 for _ in range(24)] for _ in range(7)]}
    if utc_time is not None and "view_count" in df.columns:
        tmp = pd.DataFrame({
            "dow": utc_time.dt.dayofweek,
            "hour": utc_time.dt.hour,
            "view_count": df["view_count"],
        }).dropna(subset=["dow", "hour"])
        pivot = tmp.pivot_table(index="dow", columns="hour", values="view_count", aggfunc="median", fill_value=0)
        pivot = pivot.reindex(index=range(7), columns=range(24), fill_value=0)
        e2_heatmap = {"days": DAY_NAMES_VI, "hours": list(range(24)), "z": pivot.values.tolist()}

    categories_ordered = _ordered_categories(df["channel_category"] if "channel_category" in df.columns else [])
    e1_hour_category_video_count: list[dict[str, Any]] = []
    if "channel_category" in df.columns and local_time is not None:
        hour_source = df.assign(hour_posted_local=local_time.dt.hour)
        counts = hour_source.groupby(["hour_posted_local", "channel_category"], dropna=True).size().reset_index(name="count")
        for hour in range(24):
            row: dict[str, Any] = {"hour": hour}
            for cat in categories_ordered:
                val = counts.loc[(counts["hour_posted_local"] == hour) & (counts["channel_category"] == cat), "count"].sum()
                row[cat] = int(val)
            e1_hour_category_video_count.append(row)

    return {
        "e1_hour_category_video_count": e1_hour_category_video_count,
        "e2_heatmap": e2_heatmap,
        "categories": categories_ordered,
    }


def _compute_tag_engagement(df: pd.DataFrame) -> list[dict[str, Any]]:
    needed = {"tag_count", "engagement_rate", "channel_category"}
    if not needed.issubset(df.columns):
        return []
    sub = df[list(needed)].dropna()
    if sub.empty:
        return []
    if len(sub) > 2000:
        sub = sub.sample(n=2000, random_state=42)
    return [
        {
            "tag_count": int(row["tag_count"]),
            "engagement_rate": float(row["engagement_rate"]),
            "channel_category": str(row["channel_category"]),
        }
        for _, row in sub.iterrows()
    ]


def get_economy(
    year_from: str | None = "2024-01", categories: list[str] | None = None
) -> dict[str, Any]:
    _, c = _require_loaded()
    df = c.copy()
    if categories:
        df = df[df["channel_category"].isin(categories)]

    category_values = _ordered_categories(df["channel_category"] if "channel_category" in df.columns else [])
    category_rank = {cat: idx for idx, cat in enumerate(CATEGORY_ORDER)}

    subscriber_engagement_scatter: list[dict[str, Any]] = []
    for _, row in df.iterrows():
        category = str(row.get("channel_category", ""))
        subscriber_engagement_scatter.append({
            "channel_name": str(row.get("channel_name", "")),
            "category": category,
            "subscriber_count": _safe_int(row.get("subscriber_count", 0)),
            "avg_engagement_rate": _safe_float(row.get("avg_engagement_rate", 0.0)),
            "total_view_count": _safe_float(row.get("total_view_count", row.get("view_count", 0.0))),
        })
    subscriber_engagement_scatter.sort(key=lambda r: (category_rank.get(r["category"], len(category_rank)), r["channel_name"]))

    strategy_points: list[dict[str, Any]] = []
    video_col = "video_count_dataset" if "video_count_dataset" in df.columns else "video_count"
    views_col = "avg_views_per_video_dataset" if "avg_views_per_video_dataset" in df.columns else "avg_views_per_video"
    for _, row in df.iterrows():
        category = str(row.get("channel_category", ""))
        strategy_points.append({
            "channel_name": str(row.get("channel_name", "")),
            "category": category,
            "video_count_dataset": _safe_int(row.get(video_col, 0)),
            "avg_views_per_video_dataset": _safe_float(row.get(views_col, 0.0)),
            "subscriber_count": _safe_int(row.get("subscriber_count", 0)),
        })
    strategy_points.sort(key=lambda r: (category_rank.get(r["category"], len(category_rank)), r["channel_name"]))

    median_x = _safe_float(df[video_col].median() - 50 if video_col in df.columns and len(df) else 0.0)
    median_y = _safe_float(df[views_col].median() if views_col in df.columns and len(df) else 0.0)

    return {
        "f1_subscriber_engagement_scatter": subscriber_engagement_scatter,
        "f2_strategy_quadrant": {
            "points": strategy_points,
            "median_x": median_x,
            "median_y": median_y,
        },
        "categories": category_values,
    }


def _compute_commercial_split(
    df: pd.DataFrame,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    if "is_commercial" not in df.columns or "channel_category" not in df.columns:
        return [], []

    has_view = "view_count" in df.columns
    has_engage = "engagement_rate" in df.columns
    view_rows: list[dict[str, Any]] = []
    engage_rows: list[dict[str, Any]] = []

    for cat, sub in df.groupby("channel_category", dropna=True):
        commercial = sub[sub["is_commercial"] == True]  # noqa: E712
        non_commercial = sub[sub["is_commercial"] == False]  # noqa: E712

        if has_view:
            view_rows.append(
                {
                    "category": str(cat),
                    "commercial_avg_view": float(commercial["view_count"].mean())
                    if len(commercial)
                    else 0.0,
                    "non_commercial_avg_view": float(
                        non_commercial["view_count"].mean()
                    )
                    if len(non_commercial)
                    else 0.0,
                }
            )
        if has_engage:
            engage_rows.append(
                {
                    "category": str(cat),
                    "commercial_avg_engagement": float(
                        commercial["engagement_rate"].mean()
                    )
                    if len(commercial)
                    else 0.0,
                    "non_commercial_avg_engagement": float(
                        non_commercial["engagement_rate"].mean()
                    )
                    if len(non_commercial)
                    else 0.0,
                }
            )

    return view_rows, engage_rows


def get_ro1_pivot() -> dict[str, Any]:
    """
    RO1 pivot table: Top 5 channels with highest short-form ratio shift.
    Calculates diff between 2024+ and pre-2020 short-form ratios.
    """
    v, _ = _require_loaded()

    if "year" not in v.columns or "is_short_form" not in v.columns:
        return {"pivot_data": []}

    # Calculate ratio for old period (pre-2020)
    old = v[v["year"] < 2020]
    old_ratios = (
        old.groupby("channel_name", dropna=True)
        .agg(
            short_count=("is_short_form", lambda x: (x == True).sum()),  # noqa: E712
            total_count=("is_short_form", "count")
        )
        .reset_index()
    )
    old_ratios["old_ratio"] = old_ratios["short_count"] / old_ratios["total_count"]

    # Calculate ratio for new period (2024+)
    new = v[v["year"] >= 2024]
    new_ratios = (
        new.groupby("channel_name", dropna=True)
        .agg(
            short_count=("is_short_form", lambda x: (x == True).sum()),  # noqa: E712
            total_count=("is_short_form", "count")
        )
        .reset_index()
    )
    new_ratios["new_ratio"] = new_ratios["short_count"] / new_ratios["total_count"]

    # Merge and calculate diff
    merged = pd.merge(
        old_ratios[["channel_name", "old_ratio"]],
        new_ratios[["channel_name", "new_ratio"]],
        on="channel_name",
        how="inner"
    )
    merged["diff"] = merged["new_ratio"] - merged["old_ratio"]

    # Get top 5 by diff
    top5 = merged.nlargest(5, "diff")

    pivot_data = [
        {
            "channel_name": row["channel_name"],
            "old_ratio": float(row["old_ratio"]),
            "new_ratio": float(row["new_ratio"]),
            "diff": float(row["diff"])
        }
        for _, row in top5.iterrows()
    ]

    return {"pivot_data": pivot_data}