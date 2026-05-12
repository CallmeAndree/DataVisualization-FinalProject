"use client";
/**
 * InsightCard — displays an analytical insight with dynamic loading states.
 * Design: warm burgundy product band with hot pink action accent.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface InsightCardProps {
  title?: string;
  content?: string;
  loading?: boolean;
  error?: string;
  onGetInsight?: () => void;
}

export function InsightCard({ title, content, loading, error, onGetInsight }: InsightCardProps) {
  const [isDebouncing, setIsDebouncing] = useState(false);

  const handleClick = () => {
    if (!onGetInsight || isDebouncing || loading) return;

    // Debounce: prevent spam clicks
    setIsDebouncing(true);
    setTimeout(() => setIsDebouncing(false), 1000);

    onGetInsight();
  };

  const parseInsightContent = (text: string) => {
    const normalized = text.replace(/\r\n/g, "\n");
    const sectionRegex = /\b(Phân tích biểu đồ:|Insight:|Action:)/gmi;
    const matches = [...normalized.matchAll(sectionRegex)];
    if (matches.length === 0) {
      return [
        {
          heading: "",
          lines: normalized
            .split(/\n|\s*-\s+/)
            .map((line) => line.trim())
            .filter(Boolean),
        },
      ];
    }

    const sections: { heading: string; lines: string[] }[] = [];
    for (let i = 0; i < matches.length; i += 1) {
      const currentMatch = matches[i];
      const nextMatch = matches[i + 1];
      const start = (currentMatch.index ?? 0) + currentMatch[0].length;
      const end = nextMatch?.index ?? normalized.length;
      const bodyText = normalized.slice(start, end).trim();
      const lines = bodyText
        .split(/\n|\s*-\s+/)
        .map((line) => line.trim())
        .filter(Boolean);
      sections.push({ heading: currentMatch[1].trim(), lines: lines.length ? lines : [""] });
    }

    return sections;
  };

  // State 1: No insight - show "Get Insight" button
  if (!content && !loading && !error) {
    return (
      <div
        className="flex gap-3 p-4 rounded-[8px] items-center justify-center"
        style={{ background: "#612e3f", border: "1px solid rgba(178,62,89,0.5)" }}
      >
        <Button
          onClick={handleClick}
          disabled={isDebouncing}
          className="bg-[#FF0051] text-white hover:bg-[#e00048] font-medium"
        >
          Nhận Insight
        </Button>
      </div>
    );
  }

  // State 2: Loading
  if (loading) {
    return (
      <div
        className="flex gap-3 p-4 rounded-[8px] items-center justify-center text-white"
        style={{ background: "#612e3f", border: "1px solid rgba(178,62,89,0.5)" }}
      >
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
        <span className="text-sm">Đang tạo insight...</span>
      </div>
    );
  }

  // State 3: Error - show error message with retry button
  if (error) {
    return (
      <div
        className="flex flex-col gap-2 p-4 rounded-[8px] text-white"
        style={{ background: "#612e3f", border: "1px solid rgba(178,62,89,0.5)" }}
      >
        <div className="flex gap-2 items-start">
          <span className="text-lg shrink-0">⚠️</span>
          <p className="text-sm leading-relaxed opacity-90">{error}</p>
        </div>
        <Button
          onClick={handleClick}
          disabled={isDebouncing}
          size="sm"
          className="bg-[#FF0051] text-white hover:bg-[#e00048] font-medium self-start"
        >
          Thử lại
        </Button>
      </div>
    );
  }

  const sections = content ? parseInsightContent(content) : [];

  // State 4: Display insight
  return (
    <div
      className="flex gap-3 p-4 rounded-[8px] text-white"
      style={{ background: "#612e3f", border: "1px solid rgba(178,62,89,0.5)" }}
    >
      <span className="text-lg font-bold shrink-0 mt-0.5">ⓘ</span>
      <div className="flex flex-col gap-4">
        {title && (
          <p
            className="text-sm font-semibold leading-tight"
            style={{ fontFamily: "var(--font-display, 'Space Grotesk', Inter, sans-serif)" }}
          >
            {title}
          </p>
        )}
        {sections.map((section) => (
          <div key={section.heading} className="flex flex-col gap-2">
            {section.heading && (
              <p className="text-xs uppercase tracking-[0.2em] opacity-80">{section.heading}</p>
            )}
            <ul className="list-disc list-inside space-y-1 text-sm leading-relaxed opacity-100">
              {section.lines.map((line, index) => (
                <li key={`${section.heading}-${index}`}>{line}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
