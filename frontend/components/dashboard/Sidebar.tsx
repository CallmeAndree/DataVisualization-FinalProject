"use client";
/**
 * Sidebar — 8-item navigation following warm burgundy palette.
 * Active route: hot-pink left border + subtle highlight.
 * No slide animation — always visible.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  AlertTriangle,
  Heart,
  ShoppingCart,
  Sparkles,
  ScrollText,
  Images,
  Clock1,
  TrendingUpIcon,
  VideotapeIcon,
  FileVideoCamera,
  FilmIcon,
} from "lucide-react";

const items = [
  { href: "/",            label: "Tổng quan",             icon: LayoutDashboard },
  { href: "/short-form",  label: "Xu hướng video ngắn",    icon: FilmIcon },
  { href: "/channels",    label: "Định dạng & tương tác",   icon: Users },
  { href: "/interaction", label: "Giờ vàng đăng video",     icon: Clock1 },
  { href: "/anomaly",     label: "Giải phẫu viral",         icon: TrendingUpIcon },
  { href: "/economy",     label: "Quy mô & chiến lược",     icon: ShoppingCart },
  { href: "/ai",          label: "Không gian AI",          icon: Sparkles },
  { href: "/gallery",     label: "Bộ sưu tập",             icon: Images },
  { href: "/audit",       label: "Nhật ký kiểm duyệt",     icon: ScrollText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="flex h-screen w-64 shrink-0 flex-col overflow-hidden px-3 py-6"
      style={{ background: "#4D1C2D", borderRight: "1px solid rgba(255,0,76,0.15)" }}
    >
      {/* Brand */}
      <div className="mb-8 px-3">
        <p
          className="text-[10px] uppercase tracking-[0.2em] font-medium"
          style={{ color: "#c9c9d4", fontFamily: "var(--font-mono, monospace)", letterSpacing: "0.28px" }}
        >
          Việt Nam • YouTube
        </p>
        <h2
          className="mt-1 text-lg font-semibold text-white leading-tight"
          style={{ fontFamily: "var(--font-display, 'Space Grotesk', Inter, sans-serif)" }}
        >
          Phân tích dữ liệu
        </h2>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5">
        {items.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-sm transition-colors duration-150"
              style={{
                color: isActive ? "#ffffff" : "#93939f",
                background: isActive ? "rgba(255,0,76,0.15)" : "transparent",
                borderLeft: isActive ? "2px solid #FF004C" : "2px solid transparent",
                fontFamily: "var(--font-sans, Inter, Arial, sans-serif)",
              }}
            >
              <Icon
                className="h-4 w-4 shrink-0"
                style={{ color: isActive ? "#FF004C" : "#93939f" }}
              />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-6 px-3">
        <p className="text-[11px]" style={{ color: "#93939f" }}>
          Đồ án Trực quan hóa Dữ liệu
        </p>
      </div>
    </aside>
  );
}
