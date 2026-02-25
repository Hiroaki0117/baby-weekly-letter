"use client";

import { useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { formatDateJa } from "@/lib/date";

const moodLabels: Record<string, string> = {
  moved: "🥰",
  happy: "🙂",
  neutral: "😐",
  tired: "😴",
  sad: "😭",
};

type PhotoModalProps = {
  imageUrl: string;
  logDate: string;
  text: string;
  mood: string;
  childName?: string;
  onClose: () => void;
};

export function PhotoModal({
  imageUrl,
  logDate,
  text,
  mood,
  childName,
  onClose,
}: PhotoModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
          aria-label="閉じる"
        >
          <X size={18} />
        </button>

        {/* 写真 */}
        <div className="relative w-full bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={`${formatDateJa(logDate)}の写真`}
            className="mx-auto max-h-[60vh] w-full object-contain"
          />
        </div>

        {/* ログ情報 */}
        <div className="space-y-2 p-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {formatDateJa(logDate)}
            </span>
            <span className="text-lg leading-none">
              {moodLabels[mood] ?? ""}
            </span>
            {childName && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                {childName}
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground line-clamp-4">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}
