"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge, type RequestStatus } from "@/components/ai/StatusBadge";
import { api, type LogItem } from "@/lib/api";
import { FileImage } from "lucide-react";

export default function LogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>("all");
  const [page, setPage] = useState(0);
  const limit = 20;

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      setError(null);
      try {
        const params: { status?: string; limit: number; offset: number } = {
          limit,
          offset: page * limit,
        };
        if (statusFilter !== "all" && statusFilter !== null) {
          params.status = statusFilter;
        }
        const result = await api.logList(params);
        setLogs(result.items);
        setTotal(result.total);
      } catch (err) {
        setError("Không thể tải logs. Vui lòng kiểm tra backend.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, [statusFilter, page]);

  const handleRowClick = (id: string, status: RequestStatus) => {
    if (status === "pending" || status === "edited") {
      router.push(`/ai?requestId=${encodeURIComponent(id)}`);
      return;
    }

    router.push(`/audit/${id}`);
  };

  const startIndex = page * limit + 1;
  const endIndex = Math.min((page + 1) * limit, total);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-10 py-12">
        <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[#93939f]">
          Nhật ký kiểm duyệt
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[#4D1C2D]">
          Nhật ký kiểm duyệt
        </h1>
        <p className="mt-3 max-w-2xl text-[#75758a]">
          Lịch sử thực thi và gỡ lỗi. Để quản lý biểu đồ đã lưu, xem trang{" "}
          <Link
            href="/gallery"
            className="font-medium text-[#1863dc] underline underline-offset-2"
          >
            Bộ sưu tập
          </Link>
          .
        </p>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Yêu cầu gần nhất</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#93939f]">Lọc theo trạng thái:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="pending">Chờ duyệt</SelectItem>
                <SelectItem value="edited">Đã chỉnh sửa</SelectItem>
                <SelectItem value="approved">Đã duyệt</SelectItem>
                <SelectItem value="executing">Đang chạy</SelectItem>
                <SelectItem value="completed">Hoàn tất</SelectItem>
                <SelectItem value="failed">Thất bại</SelectItem>
                <SelectItem value="rejected">Đã từ chối</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#f2f2f2] border-t-[#4D1C2D]" />
            </div>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-[#93939f]">
              Chưa có request nào {statusFilter !== "all" && `với trạng thái "${statusFilter}"`}.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Câu hỏi</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thời gian chạy</TableHead>
                    <TableHead className="text-center">Hình ảnh</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow
                      key={log.id}
                      className="cursor-pointer hover:bg-[#f9f9f9]"
                      onClick={() => handleRowClick(log.id, log.status as RequestStatus)}
                    >
                      <TableCell className="text-xs text-[#93939f]">
                        {new Date(log.created_at).toLocaleString("vi-VN")}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="truncate text-sm">
                          {log.prompt.length > 60
                            ? `${log.prompt.slice(0, 60)}...`
                            : log.prompt}
                        </p>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={log.status as RequestStatus} />
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {log.execution_time_ms != null
                          ? `${log.execution_time_ms}ms`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {log.has_figures && (
                          <FileImage className="inline h-4 w-4 text-[#93939f]" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination info */}
              <div className="mt-4 flex items-center justify-between text-sm text-[#93939f]">
                <p>
                  Hiển thị {startIndex}–{endIndex} trong tổng số {total} kết quả
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="rounded border border-[#e5e5e5] px-3 py-1 text-sm disabled:opacity-50"
                  >
                    Trước
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={endIndex >= total}
                    className="rounded border border-[#e5e5e5] px-3 py-1 text-sm disabled:opacity-50"
                  >
                    Sau
                  </button>
                </div>
              </div>
            </>
          )}
        </CardContent>
        </Card>
      </div>
    </div>
  );
}
