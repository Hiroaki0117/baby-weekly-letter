"use client";

import { useState } from "react";

type Props = {
  label: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function QuickInputSection({
  label,
  children,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = controlledOpen ?? internalOpen;

  function toggle() {
    const next = !isOpen;
    setInternalOpen(next);
    onOpenChange?.(next);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/30"
      >
        {label}
        <span className="text-xs text-muted-foreground">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="space-y-3 border-t border-border/40 px-4 py-3">
          {children}
        </div>
      )}
    </div>
  );
}
