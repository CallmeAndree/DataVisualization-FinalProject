"use client";

import { useEffect, useState, Suspense, type CompositionEvent } from "react";
import Link from "next/link";
import { Download, Trash2, Search, X } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { api, type SavedChart } from "@/lib/api";
import { useChartFilter } from "@/lib/hooks/useChartFilter";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

function toSafeFilename(value: string): string {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return normalized || "chart";
}

function downloadChartPng(chart: SavedChart) {
  const link = document.createElement("a");
  link.href = chart.figure_base64;
  link.download = `${toSafeFilename(chart.title)}-${chart.id}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function GalleryContent() {
  const [charts, setCharts] = useState<SavedChart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SavedChart | null>(null);
  const [viewTarget, setViewTarget] = useState<SavedChart | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [isComposingSearch, setIsComposingSearch] = useState(false);
 
  // Use the chart filter hook with URL sync
  const { filteredCharts, updateFilters, clearFilters, hasActiveFilters } =
    useChartFilter(charts);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.listCharts();
        if (!cancelled) setCharts(data);
      } catch (err) {
        if (!cancelled) {
          setError("Không thể tải gallery. Vui lòng kiểm tra backend.");
          console.error(err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (!isComposingSearch) {
      updateFilters({ search: value });
    }
  };

  const handleSearchCompositionEnd = (
    e: CompositionEvent<HTMLInputElement>
  ) => {
    setIsComposingSearch(false);
    const value = e.currentTarget.value;
    setSearchInput(value);
    updateFilters({ search: value });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteChart(deleteTarget.id);
      setCharts((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      toast.success("Đã xóa chart");
      setDeleteTarget(null);
    } catch (err) {
      toast.error("Lỗi khi xóa: " + (err as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-10 py-12">
        <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[#93939f]">
          Gallery
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[#4D1C2D]">
          Chart đã lưu
        </h1>
        <p className="mt-3 max-w-2xl text-[#75758a]">
          Bộ sưu tập các chart bạn đã lưu từ AI Workspace. Click vào chart để xem
          chi tiết.
        </p>
      </header>

      {/* Search filter */}
      <div className="mb-6 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#93939f]" />
          <Input
            type="text"
            placeholder="Tìm kiếm chart..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            onCompositionStart={() => setIsComposingSearch(true)}
            onCompositionEnd={handleSearchCompositionEnd}
            className="pl-9"
          />
        </div>
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchInput("");
              clearFilters();
            }}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Xóa bộ lọc
          </Button>
        )}
      </div>

      {hasActiveFilters && (
        <p className="mb-4 text-sm text-[#75758a]">
          Hiển thị {filteredCharts.length} / {charts.length} chart
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#f2f2f2] border-t-[#4D1C2D]" />
        </div>
      ) : error ? (
        <p className="text-sm text-[#b30000]">{error}</p>
      ) : charts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-[#75758a]">
              Chưa có chart nào được lưu. Tạo chart từ{" "}
              <Link
                href="/ai"
                className="font-medium text-[#1863dc] underline underline-offset-2"
              >
                AI Workspace
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      ) : filteredCharts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-[#75758a]">
              Không tìm thấy chart nào phù hợp với bộ lọc.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCharts.map((chart) => (
            <Card
              key={chart.id}
              className="group cursor-pointer overflow-hidden transition-shadow hover:shadow-md"
              onClick={() => setViewTarget(chart)}
            >
              <div className="relative bg-[#eeece7]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={chart.figure_base64}
                  alt={chart.title}
                  className="h-[200px] w-full object-contain"
                />
                <div className="absolute right-2 top-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    className="bg-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadChartPng(chart);
                      toast.success("Đã tải ảnh PNG");
                    }}
                    aria-label="Tải ảnh PNG"
                    title="Tải ảnh PNG"
                  >
                    <Download className="h-4 w-4 text-[#1863dc]" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    className="bg-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(chart);
                    }}
                    aria-label="Xóa chart"
                    title="Xóa chart"
                  >
                    <Trash2 className="h-4 w-4 text-[#b30000]" />
                  </Button>
                </div>
              </div>
              <CardContent className="space-y-2 pt-4">
                <h3 className="line-clamp-2 font-semibold text-[#4D1C2D]">
                  {chart.title}
                </h3>
                <p className="text-xs text-[#93939f]">
                  {formatDate(chart.created_at)}
                </p>
                <p className="text-sm text-[#75758a]">
                  {truncate(chart.prompt, 60)}
                </p>
                <p className="text-xs text-[#a1a1aa]">
                  {chart.analysis
                    ? truncate(chart.analysis, 80)
                    : "Chưa có phân tích AI cho chart này"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa chart này?</DialogTitle>
            <DialogDescription>
              Hành động không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" disabled={deleting} />}
            >
              Hủy
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Đang xóa..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full-size view dialog */}
      <Dialog
        open={viewTarget !== null}
        onOpenChange={(open) => !open && setViewTarget(null)}
      >
        <DialogContent className="sm:max-w-3xl">
          {viewTarget && (
            <>
              <DialogHeader>
                <DialogTitle>{viewTarget.title}</DialogTitle>
                <DialogDescription>
                  Lưu lúc {formatDate(viewTarget.created_at)}
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    downloadChartPng(viewTarget);
                    toast.success("Đã tải ảnh PNG");
                  }}
                >
                  <Download className="h-4 w-4" />
                  Tải PNG
                </Button>
              </div>
              <div className="space-y-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={viewTarget.figure_base64}
                  alt={viewTarget.title}
                  className="w-full rounded border"
                />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#93939f]">
                    Prompt
                  </p>
                  <p className="mt-1 text-sm text-[#4D1C2D]">
                    {viewTarget.prompt}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#93939f]">
                    Phân tích AI
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-[#4D1C2D]">
                    {viewTarget.analysis ?? "Chart này được lưu trước khi hệ thống hỗ trợ lưu phân tích AI."}
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default function GalleryPage() {
  return (
    <Suspense fallback={<div className="h-full px-10 py-12">Đang tải...</div>}>
      <GalleryContent />
    </Suspense>
  );
}
