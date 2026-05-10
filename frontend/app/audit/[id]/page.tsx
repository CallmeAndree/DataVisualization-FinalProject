"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, type RequestStatus } from "@/components/ai/StatusBadge";
import { ResultPanel } from "@/components/ai/ResultPanel";
import { api, type LogDetail } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

export default function LogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [log, setLog] = useState<LogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"ai" | "edited">("ai");

  useEffect(() => {
    async function fetchLog() {
      setLoading(true);
      setError(null);
      try {
        const result = await api.logDetail(id);
        setLog(result);
      } catch (err) {
        setError("Không tìm thấy request này.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchLog();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#f2f2f2] border-t-[#212121]" />
      </div>
    );
  }

  if (error || !log) {
    return (
      <div className="px-10 py-12">
        <Button
          variant="ghost"
          onClick={() => router.push("/audit")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-sm text-red-700">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-10 py-12">
      <Button
        variant="ghost"
        onClick={() => router.push("/audit")}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Quay lại
      </Button>

      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#93939f]">
              Chi tiết nhật ký
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[#212121]">
              Chi tiết request
            </h1>
          </div>
          <StatusBadge status={log.status as RequestStatus} />
        </div>
        <p className="mt-3 text-sm text-[#93939f]">
          {new Date(log.created_at).toLocaleString("vi-VN")}
        </p>
      </header>

      <div className="space-y-6">
        {/* Prompt */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Câu hỏi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[#212121]">{log.prompt}</p>
          </CardContent>
        </Card>

        {/* Explanation */}
        {log.explanation && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Giải thích</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[#75758a]">{log.explanation}</p>
            </CardContent>
          </Card>
        )}

        {/* Code */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mã nguồn</CardTitle>
            {log.was_edited && (
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => setActiveTab("ai")}
                  className={`rounded px-3 py-1 text-sm ${
                    activeTab === "ai"
                      ? "bg-[#212121] text-white"
                      : "bg-[#f2f2f2] text-[#75758a]"
                  }`}
                >
                  AI tạo
                </button>
                <button
                  onClick={() => setActiveTab("edited")}
                  className={`rounded px-3 py-1 text-sm ${
                    activeTab === "edited"
                      ? "bg-[#212121] text-white"
                      : "bg-[#f2f2f2] text-[#75758a]"
                  }`}
                >
                  Đã chỉnh sửa
                </button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="rounded border border-[#e5e5e5]">
              <MonacoEditor
                height="400px"
                language="python"
                theme="vs-dark"
                value={
                  activeTab === "edited" && log.edited_code
                    ? log.edited_code
                    : log.ai_code
                }
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Execution Results */}
        {(log.status === "completed" || log.status === "failed") && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-[#212121]">
              Kết quả thực thi
            </h2>
            <ResultPanel
              figures={log.figures || []}
              stdout={log.stdout || ""}
              execution_time_ms={log.execution_time_ms}
              error_message={log.error_message}
              request_id={log.id}
              prompt={log.prompt}
              analysis={log.explanation}
              status={log.status === "completed" ? "completed" : "failed"}
              compactCharts
            />
          </div>
        )}
      </div>
    </div>
  );
}
