/**
 * TopVideosTable — table with inline mini-bar for Chart D2 (top viral videos).
 * Design: hairline-bordered rows, rank column, viral badge, Cohere typography.
 */
import { CHART_CHROME, REFERENCE_COLORS, formatNumber } from "@/lib/constants";

interface VideoRow {
  rank?: number;
  title: string;
  channel: string;
  view_count: number;
  is_viral?: boolean;
}

interface TopVideosTableProps {
  data: VideoRow[];
}

export function TopVideosTable({ data }: TopVideosTableProps) {
  const maxViews = Math.max(...data.map((r) => r.view_count), 1);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b" style={{ borderColor: CHART_CHROME.grid }}>
            <th className="text-left py-2 px-3 font-medium w-8" style={{ color: CHART_CHROME.axis }}>#</th>
            <th className="text-left py-2 px-3 font-medium" style={{ color: CHART_CHROME.axis }}>Tiêu đề</th>
            <th className="text-left py-2 px-3 font-medium hidden md:table-cell" style={{ color: CHART_CHROME.axis }}>Kênh</th>
            <th className="text-right py-2 px-3 font-medium" style={{ color: CHART_CHROME.axis }}>Lượt xem</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={i}
              className="border-b transition-colors"
              style={{ borderColor: CHART_CHROME.grid }}
            >
              <td className="py-2 px-3 tabular-nums" style={{ color: CHART_CHROME.axis }}>{row.rank ?? i + 1}</td>
              <td className="py-2 px-3">
                <div className="flex flex-col gap-1">
                  <span className="truncate max-w-[220px]" style={{ color: CHART_CHROME.tooltipText }} title={row.title}>
                    {row.title.length > 40 ? `${row.title.slice(0, 40)}…` : row.title}
                  </span>
                  {/* Mini horizontal bar */}
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: CHART_CHROME.grid }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(row.view_count / maxViews) * 100}%`,
                        background: row.is_viral ? CHART_CHROME.emphasis : CHART_CHROME.reference,
                      }}
                    />
                  </div>
                </div>
              </td>
              <td className="py-2 px-3 hidden md:table-cell truncate max-w-[120px]" style={{ color: CHART_CHROME.legend }}>
                {row.channel}
              </td>
              <td className="py-2 px-3 text-right tabular-nums" style={{ color: CHART_CHROME.tooltipText }}>
                <div className="flex flex-col items-end gap-1">
                  <span>{formatNumber(row.view_count)}</span>
                  {row.is_viral && (
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                      style={{ background: `${REFERENCE_COLORS.viral}1A`, color: REFERENCE_COLORS.viral }}
                    >
                      Lan truyền
                    </span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
