/**
 * FilterBar — generic horizontal filter container.
 * Design: Cohere soft-stone (#eeece7) surface with hairline bottom border.
 */
import React from "react";

interface FilterBarProps {
  children: React.ReactNode;
  onReset?: () => void;
}

export function FilterBar({ children, onReset }: FilterBarProps) {
  return (
    <div
      className="flex flex-wrap items-center gap-3 px-4 py-3 border-b"
      style={{ background: "#FFFBF6", borderColor: "#f2d0c2" }}
    >
      {children}
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="ml-auto text-sm font-medium text-white px-4 py-1.5 transition-opacity hover:opacity-80"
          style={{
            background: "#FF004C",
            borderRadius: 32,
            border: "none",
            cursor: "pointer",
          }}
        >
          Đặt lại
        </button>
      )}
    </div>
  );
}
