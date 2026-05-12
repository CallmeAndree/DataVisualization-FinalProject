"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChatInput } from "@/components/ai/ChatInput";
import { CodeBlock } from "@/components/ai/CodeBlock";
import { StatusBadge, type RequestStatus } from "@/components/ai/StatusBadge";
import { ResultPanel } from "@/components/ai/ResultPanel";
import { SkeletonLoader } from "@/components/ai/SkeletonLoader";
import { GenerationProgress } from "@/components/ai/GenerationProgress";
import { useStreamingResponse } from "@/lib/hooks/useStreamingResponse";
import { api } from "@/lib/api";
import { toast } from "sonner";

type RequestState = {
  id: string;
  ai_code: string;
  edited_code: string | null;
  explanation: string;
  status: RequestStatus;
};

type ResultState = {
  figures: string[];
  stdout: string;
  execution_time_ms: number | null;
  error_message: string | null;
  prompt: string;
};

function AIWorkspaceContent() {
  const searchParams = useSearchParams();
  const requestId = searchParams.get("requestId");
  const [request, setRequest] = useState<RequestState | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);
  const [lastPrompt, setLastPrompt] = useState("");
  // Feature flag for streaming (default: true)
  const enableStreaming =
    process.env.NEXT_PUBLIC_ENABLE_STREAMING !== "false";

  // Use streaming hook
  const streaming = useStreamingResponse({
    enableStreaming,
    onComplete: (payload) => {
      if (payload.requestId) {
        setRequest({
          id: payload.requestId,
          ai_code: payload.code,
          edited_code: null,
          explanation: payload.explanation,
          status: "pending",
        });
      }
      toast.success("Code đã được sinh!");
    },
    onError: (error) => {
      toast.error("Lỗi khi sinh code: " + error);
      setRequest(null);
    },
  });

  const handleSubmit = async (prompt: string) => {
    setRequest(null);
    setResult(null);
    setLastPrompt(prompt);

    // Start streaming
    await streaming.startStreaming(prompt);
  };

  useEffect(() => {
    if (!requestId) {
      return;
    }

    const currentRequestId = requestId;
    let cancelled = false;

    async function restoreRequest() {
      try {
        const log = await api.logDetail(currentRequestId);
        if (cancelled) {
          return;
        }

        setLastPrompt(log.prompt);
        setRequest({
          id: log.id,
          ai_code: log.ai_code,
          edited_code: log.edited_code,
          explanation: log.explanation ?? "",
          status: log.status as RequestStatus,
        });

        if (log.status === "completed" || log.status === "failed") {
          setResult({
            figures: log.figures || [],
            stdout: log.stdout || "",
            execution_time_ms: log.execution_time_ms,
            error_message: log.error_message,
            prompt: log.prompt,
          });
        } else {
          setResult(null);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error("Không thể khôi phục request: " + (error as Error).message);
        }
      }
    }

    void restoreRequest();

    return () => {
      cancelled = true;
    };
  }, [requestId]);

  const handleCodeChange = (newCode: string) => {
    if (!request) return;

    if (newCode !== request.ai_code) {
      setRequest({
        ...request,
        edited_code: newCode,
        status: "edited",
      });
    } else {
      setRequest({
        ...request,
        edited_code: null,
        status: "pending",
      });
    }
  };

  const handleApprove = async () => {
    if (!request) return;

    try {
      setRequest({ ...request, status: "executing" });
      toast.info("Đang thực thi code...");

      const codeToExecute = request.edited_code ?? request.ai_code;
      const response = await api.execute({
        request_id: request.id,
        code: codeToExecute,
      });

      const finalStatus: RequestStatus =
        response.status === "completed" ? "completed" : "failed";

      setRequest({ ...request, status: finalStatus });
      setResult({
        figures: response.figures || [],
        stdout: response.stdout || "",
        execution_time_ms: response.execution_time_ms,
        error_message: response.error_message,
        prompt: lastPrompt,
      });

      if (finalStatus === "completed") {
        toast.success("Thực thi thành công!");
      } else {
        toast.error("Thực thi thất bại");
      }
    } catch (error) {
      setRequest({ ...request, status: "failed" });
      toast.error("Lỗi khi thực thi: " + (error as Error).message);
    }
  };

  const handleReject = async () => {
    if (!request) return;

    try {
      await api.updateLogStatus(request.id, "rejected");
      setRequest({ ...request, status: "rejected" });
      setResult(null);
      toast.info("Đã từ chối request");
    } catch (error) {
      toast.error("Lỗi khi cập nhật trạng thái: " + (error as Error).message);
    }
  };

  const isLoading = streaming.isStreaming;
  const showActions =
    request && (request.status === "pending" || request.status === "edited");

  // Determine generation phase for progress indicator
  const generationPhase = streaming.isStreaming
    ? streaming.code
      ? "streaming"
      : "connecting"
    : "complete";

  // Show skeleton when waiting for first chunk
  const showSkeleton = streaming.isStreaming && !streaming.code;

  // Sync request state with streaming progress after paint to avoid state updates during render.
  useEffect(() => {
    if (!streaming.isStreaming || !streaming.code) {
      return;
    }

    const timer = window.setTimeout(() => {
      setRequest((prev) => {
        if (!prev) {
          return {
            id: streaming.requestId || "",
            ai_code: streaming.code,
            edited_code: null,
            explanation: streaming.explanation,
            status: "generating",
          };
        }

        if (
          prev.ai_code !== streaming.code ||
          prev.explanation !== streaming.explanation
        ) {
          return {
            ...prev,
            ai_code: streaming.code,
            explanation: streaming.explanation,
          };
        }

        return prev;
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [streaming.isStreaming, streaming.code, streaming.explanation, streaming.requestId]);

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <header className="border-b bg-white px-10 py-8 dark:bg-zinc-950">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          Không gian AI
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Phân tích bằng ngôn ngữ tự nhiên
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">
          AI sinh mã, bạn xem lại, chỉnh sửa, duyệt, rồi hệ thống chạy cục bộ.
        </p>
      </header>

      {/* Two-column layout */}
      <div className="grid gap-0 lg:grid-cols-2">
        {/* Left: Chat + Explanation */}
        <div className="bg-white p-10 dark:bg-[#eeece7]">
          <Card>
            <CardHeader>
              <CardTitle>1. Yêu cầu</CardTitle>
            </CardHeader>
            <CardContent>
              <ChatInput
                onSubmit={handleSubmit}
                isLoading={isLoading}
                initialPrompt={lastPrompt}
              />
            </CardContent>
          </Card>

          {request && (
            <Card className="mt-6">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Giải thích</CardTitle>
                <StatusBadge status={request.status} />
              </CardHeader>
              <CardContent>
                {streaming.isStreaming && !streaming.explanation ? (
                  <div className="h-4 w-3/4 animate-pulse rounded bg-[#d4d4d8]" />
                ) : (
                  <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-600">
                    {request.explanation}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Show progress indicator during streaming */}
          {streaming.isStreaming && (
            <div className="mt-6">
              <GenerationProgress phase={generationPhase} />
            </div>
          )}
        </div>

{/* Right: Monaco + Result */}
        <div className="bg-zinc-50 p-5 flex flex-col">
          <Card className="overflow-hidden rounded-xl border border-zinc-700/50 bg-[#1e1e24] shadow-2xl shadow-black/50">
            <CardHeader className="border-b border-zinc-800 bg-[#1a1a20] px-4 py-3">
              <div className="flex items-center gap-3">
                {/* 3 nút giả lập cửa sổ macOS nhìn rất elegant */}
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full border border-zinc-600 bg-zinc-700/50" />
                  <div className="h-3 w-3 rounded-full border border-zinc-600 bg-zinc-700/50" />
                  <div className="h-3 w-3 rounded-full border border-zinc-600 bg-zinc-700/50" />
                </div>
                <CardTitle className="text-sm font-medium text-zinc-400">
                  2. Mã Python
                </CardTitle>
              </div>
            </CardHeader>
            
            {/* Chú ý: bỏ padding mặc định của CardContent bằng p-0 để code block tràn viền đẹp hơn */}
            <CardContent className="p-0">
              {showSkeleton ? (
                <div className="p-6">
                  <SkeletonLoader />
                </div>
              ) : request ? (
                <div className="relative">
                  <div className="p-4">
                    <CodeBlock
                      value={request.edited_code ?? request.ai_code}
                      onChange={handleCodeChange}
                      readOnly={request.status === "executing" || streaming.isStreaming}
                    />
                  </div>

                  {showActions && (
                    <div className="border-t border-zinc-800 bg-[#1a1a20] px-4 py-3 flex gap-3">
                      <Button
                        onClick={handleApprove}
                        disabled={request.status === "executing" || streaming.isStreaming}
                        className="flex-1 bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                      >
                        Duyệt và chạy
                      </Button>
                      <Button
                        onClick={handleReject}
                        variant="outline"
                        disabled={request.status === "executing" || streaming.isStreaming}
                        className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                      >
                        Từ chối
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-[400px] flex-col items-center justify-center gap-3 text-zinc-500">
                  {/* Có thể thêm 1 icon nhỏ ở đây cho đỡ trống */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256" className="opacity-50">
                    <path d="M74.34,85.66a8,8,0,0,1,11.32-11.32l48,48a8,8,0,0,1,0,11.32l-48,48a8,8,0,0,1-11.32-11.32L116.69,128ZM216,152a8,8,0,0,0-8,8v40H48V56h72a8,8,0,0,0,0-16H48A16,16,0,0,0,32,56V200a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V160A8,8,0,0,0,216,152Zm-24-48h24a8,8,0,0,0,0-16H192a8,8,0,0,0,0,16Z"></path>
                  </svg>
                  <span className="text-sm">Nhập yêu cầu bên trái để bắt đầu sinh mã</span>
                </div>
              )}
            </CardContent>
          </Card>

          {result && (
            <div className="mt-6">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
                Kết quả
              </h3>
              <ResultPanel
                figures={result.figures}
                stdout={result.stdout}
                execution_time_ms={result.execution_time_ms}
                error_message={result.error_message}
                request_id={request?.id ?? null}
                prompt={result.prompt}
                analysis={request?.explanation ?? null}
                status={
                  request?.status === "completed"
                    ? "completed"
                    : request?.status === "failed"
                      ? "failed"
                      : request?.status === "executing"
                        ? "executing"
                        : "idle"
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AIWorkspacePage() {
  return (
    <Suspense fallback={<div className="p-10">Dang tai...</div>}>
      <AIWorkspaceContent />
    </Suspense>
  );
}
