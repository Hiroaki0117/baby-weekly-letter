"use client";

import { useEffect } from "react";

type GeneratingOverlayProps = {
  visible: boolean;
  message?: string;
};

export function GeneratingOverlay({
  visible,
  message = "アルバムを生成中です…",
}: GeneratingOverlayProps) {
  // beforeunload warning
  useEffect(() => {
    if (!visible) return;

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/60 bg-card px-8 py-6 shadow-lg">
        <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <p className="text-sm font-medium text-foreground">{message}</p>
        <p className="text-xs text-muted-foreground">
          画面を閉じないでください
        </p>
      </div>
    </div>
  );
}
