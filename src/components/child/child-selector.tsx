"use client";

import { cn } from "@/lib/utils";
import type { Child } from "@/types";

type ChildSelectorProps = {
  childrenList: Child[];
  selectedId: string;
  onChange: (childId: string) => void;
};

export function ChildSelector({
  childrenList,
  selectedId,
  onChange,
}: ChildSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {childrenList.map((child) => {
        const isSelected = selectedId === child.id;
        return (
          <button
            key={child.id}
            type="button"
            onClick={() => onChange(child.id)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-200",
              "hover:scale-105 active:scale-95",
              isSelected
                ? "border-primary bg-primary/10 text-primary shadow-sm"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-muted/80"
            )}
          >
            {child.name ?? "名前なし"}
          </button>
        );
      })}
    </div>
  );
}
