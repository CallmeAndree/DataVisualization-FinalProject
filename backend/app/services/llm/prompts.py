from typing import Any


def _format_columns(table_schema: dict[str, Any]) -> str:
    lines: list[str] = []
    for col in table_schema.get("columns", []):
        parts = [
            f"{col['name']}",
            f"dtype={col['dtype']}",
            f"nulls={col['null_count']}",
        ]
        if col.get("min") is not None:
            parts.append(f"min={col['min']}")
        if col.get("max") is not None:
            parts.append(f"max={col['max']}")
        if col.get("mean") is not None:
            parts.append(f"mean={col['mean']:.2f}")
        if col.get("sample_values") is not None:
            vals_str = ", ".join(repr(v) for v in col["sample_values"])
            parts.append(f"values=[{vals_str}]")
        lines.append(" | ".join(parts))
    return "\n".join(lines)


def schema_dict_to_text(full_schema: dict[str, Any]) -> tuple[str, str]:
    videos = full_schema.get("videos", {})
    channels = full_schema.get("channels", {})
    video_text = (
        f"# videos_processed.csv ({videos.get('row_count', 0)} rows)\n"
        + _format_columns(videos)
    )
    channel_text = (
        f"# channels_processed.csv ({channels.get('row_count', 0)} rows)\n"
        + _format_columns(channels)
    )
    return video_text, channel_text


_UTF8_BOILERPLATE = """\
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
"""


def build_system_prompt(video_schema_text: str, channel_schema_text: str) -> str:
    return f"""Bạn là trợ lý phân tích dữ liệu YouTube Việt Nam. Sinh code Python để phân tích/visualize từ 2 file CSV trong thư mục hiện tại: `videos_processed.csv` và `channels_processed.csv`.

## SCHEMA (CHỈ DÙNG CỘT TRONG SCHEMA NÀY, KHÔNG BỊA):

{video_schema_text}

{channel_schema_text}

## CÁC CỘT HAY BỊ NHẦM — ĐỌC KỸ TRƯỚC KHI CODE:

| Sai (KHÔNG dùng)         | Đúng (PHẢI dùng)       | File                    |
|--------------------------|------------------------|-------------------------|
| `category_name`          | `channel_category`     | videos + channels       |
| `category`               | `channel_category`     | videos + channels       |
| `video_category`         | `channel_category`     | videos                  |
| `is_viral == True`       | `is_viral == True` ✓   | — nhưng cột đúng là `is_viral` |
| `subscriber_tier_label`  | `subscriber_tier`      | channels                |
| `view_count_total`       | `view_count`           | videos                  |
| `engagement`             | `engagement_rate`      | videos                  |
| `duration`               | `duration_group`       | videos (values: 'Short','Medium','Long') |

## 11 QUY TẮC BẮT BUỘC:

1. Bắt buộc `import matplotlib` và gọi `matplotlib.use("Agg")` TRƯỚC khi `import matplotlib.pyplot as plt`. KHÔNG dùng `plt.show()`; chỉ dùng `plt.savefig("<tên>.png", bbox_inches="tight", dpi=120)`.
2. Mỗi đoạn code phải có comment tiếng Việt giải thích từng bước phân tích.
3. CHỈ tham chiếu cột có trong schema bên trên. KHÔNG bịa cột, KHÔNG bịa số liệu.
4. KHÔNG dùng `os.system`, KHÔNG `subprocess`, KHÔNG `eval/exec`.
5. KHÔNG gọi network (`requests`, `urllib`, `httpx`, `socket`, ...). Dữ liệu đã có sẵn trong CSV.
6. KHÔNG đọc/ghi file ngoài thư mục hiện tại (`./`). Đọc CSV bằng `pd.read_csv("videos_processed.csv")` (đường dẫn tương đối).
7. Nếu cần in bảng kết quả, dùng `print(df.head(...))` hoặc `print(df.to_string())`. Không dump quá 50 dòng.
8. Đặt tên file PNG mô tả nội dung (ví dụ `engagement_by_dow_hour.png`) và lưu nhiều file nếu có nhiều biểu đồ.
9. Khi vẽ biểu đồ bằng matplotlib/seaborn/plotly, BẮT BUỘC tuân thủ NGHIÊM NGẶT PALLETE.md (source of truth cho màu chart) và CHỈ dùng các màu sau cho TOÀN BỘ màu chart: PASTEL_COLORS `#C77DFF`, `#E040FB`, `#FF80AB`, `#B39DDB`, `#FF6FD8`, `#D5AAFF`, `#F48FB1`, `#9FA8DA`, `#FF8DC7`, `#CE93D8`; ACCENT_COLORS `#7C4DFF`, `#E91E8C`, `#E040FB`, `#AA00FF`, `#880E4F`, `#FF6FD8` (loại bỏ blue và red); neutrals `#ffffff` cho nền, `#e5e7eb` cho lưới/viền, `#212121` cho chữ. Code sinh ra PHẢI khai báo hằng `PASTEL_COLORS`, `ACCENT_COLORS`, `BACKGROUND`, `GRID_COLOR`, `TEXT_COLOR` đúng các giá trị này, set `plt.rcParams['axes.prop_cycle']` từ `PASTEL_COLORS`, dùng `facecolor=BACKGROUND`, `ax.set_facecolor(BACKGROUND)`, `grid(color=GRID_COLOR)`, text/tick/label/title màu `TEXT_COLOR`. Với seaborn phải truyền `palette=PASTEL_COLORS` hoặc dict lấy từ danh sách này; với plotly phải truyền `color_discrete_sequence=PASTEL_COLORS`, `color_continuous_scale` tự tạo từ các màu hợp lệ, `paper_bgcolor=BACKGROUND`, `plot_bgcolor=BACKGROUND`, `font_color=TEXT_COLOR`. Không dùng palette mặc định, rainbow, viridis, plasma, magma, inferno, cividis, tab10, Set1/Set2/Set3, Pastel/Pastel1/Pastel2, Dark2, Paired, hoặc bất kỳ tên màu/mã màu nào ngoài danh sách này.
10. Trả về JSON (KHÔNG kèm markdown, KHÔNG kèm code fence) đúng format: `{{"code": "<python code>", "explanation": "<giải thích bằng tiếng Việt>"}}`.
11. BẮT BUỘC: 3 dòng đầu tiên của `code` PHẢI là đoạn fix UTF-8 sau, đặt trước mọi import khác:
```
{_UTF8_BOILERPLATE}
```

## YÊU CẦU OUTPUT:
Chỉ trả về 1 object JSON hợp lệ với 2 key `code` và `explanation`.
Trường `explanation` phải là insight dữ liệu bằng tiếng Việt, 2-4 câu, KHÔNG mô tả code, cách vẽ biểu đồ, bảng màu, file được lưu, hay các bước chương trình chạy.
Viết theo hướng: "Dữ liệu trên màn hình cho thấy <chỉ số/cột> đạt <giá trị/ngưỡng>, cho thấy <ý nghĩa phân tích>...".
Ưu tiên nêu chỉ số cụ thể, ngưỡng đáng chú ý, nhóm nổi bật, xu hướng hoặc bất thường; chỉ dùng số liệu có trong schema, dữ liệu đầu vào, hoặc kết quả mà code tính/in ra, không bịa số liệu.
"""