"use client";

import { useState } from "react";
import { formatDateJa } from "@/lib/date";
import { MILESTONE_CATEGORY_OPTIONS } from "@/types";
import type { Milestone } from "@/types";

type MilestoneCardProps = {
  milestone: Milestone;
  onEdit: (milestone: Milestone) => void;
  onDelete: (id: string) => void;
};

const COLOR_MAP: Record<string, { bg: string; border: string; dot: string }> = {
  blue: { bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-400" },
  purple: { bg: "bg-purple-50", border: "border-purple-200", dot: "bg-purple-400" },
  orange: { bg: "bg-orange-50", border: "border-orange-200", dot: "bg-orange-400" },
  green: { bg: "bg-green-50", border: "border-green-200", dot: "bg-green-400" },
  gray: { bg: "bg-gray-50", border: "border-gray-200", dot: "bg-gray-400" },
};

export function MilestoneCard({
  milestone,
  onEdit,
  onDelete,
}: MilestoneCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const catOpt = MILESTONE_CATEGORY_OPTIONS.find(
    (o) => o.value === milestone.category
  );
  const colors = COLOR_MAP[catOpt?.color ?? "gray"];

  return (
    <div className="relative flex gap-3">
      {/* タイムラインドット */}
      <div className="flex flex-col items-center pt-1.5">
        <div className={`h-3 w-3 rounded-full ${colors.dot} ring-2 ring-background`} />
        <div className="w-px flex-1 bg-border/50" />
      </div>

      {/* カード本体 */}
      <div className={`mb-3 flex-1 rounded-lg border ${colors.border} ${colors.bg} p-3`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              {catOpt?.emoji} {milestone.title}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{formatDateJa(milestone.milestone_date)}</span>
              <span className="rounded-full bg-background/60 px-2 py-0.5">
                {catOpt?.label ?? "その他"}
              </span>
              {milestone.source === "ai" && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                  AI検出
                </span>
              )}
            </div>
            {milestone.memo && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                {milestone.memo}
              </p>
            )}
          </div>

          {/* 三点メニュー */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="rounded p-1 text-muted-foreground/60 transition-colors hover:bg-background/60 hover:text-foreground"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="3" r="1.5" />
                <circle cx="8" cy="8" r="1.5" />
                <circle cx="8" cy="13" r="1.5" />
              </svg>
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => {
                    setShowMenu(false);
                    setConfirmDelete(false);
                  }}
                />
                <div className="absolute right-0 top-7 z-20 w-28 overflow-hidden rounded-lg border border-border/60 bg-card shadow-lg">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onEdit(milestone);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-foreground transition-colors hover:bg-muted/50"
                  >
                    編集
                  </button>
                  {!confirmDelete ? (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-destructive transition-colors hover:bg-destructive/5"
                    >
                      削除
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setConfirmDelete(false);
                        onDelete(milestone.id);
                      }}
                      className="flex w-full items-center gap-2 bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive"
                    >
                      本当に削除
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
