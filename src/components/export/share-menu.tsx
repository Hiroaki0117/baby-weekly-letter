"use client";

import { useState, useRef, useEffect } from "react";

type ShareMenuProps = {
  onExport: (format: "png" | "pdf") => void;
  exporting: boolean;
};

export function ShareMenu({ onExport, exporting }: ShareMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 外側クリックで閉じる
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={exporting}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-card py-3 text-sm text-muted-foreground shadow-sm transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-primary disabled:opacity-50"
      >
        {exporting ? (
          <>
            <span className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30 border-t-primary animate-spin" />
            エクスポート中...
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" x2="12" y1="2" y2="15" />
            </svg>
            共有
          </>
        )}
      </button>

      {open && !exporting && (
        <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border border-border/60 bg-card shadow-lg">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onExport("png");
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted"
          >
            <span className="text-base">📷</span>
            画像で保存
          </button>
          <div className="h-px bg-border/40" />
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onExport("pdf");
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted"
          >
            <span className="text-base">📄</span>
            PDFで保存
          </button>
        </div>
      )}
    </div>
  );
}
