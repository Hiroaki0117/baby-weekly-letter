"use client";

import { REACTION_STAMPS, type ReactionSummary } from "@/lib/reactions";
import { cn } from "@/lib/utils";

type ReactionBarProps = {
  logId: string;
  reactions: ReactionSummary[];
  nameMap: Record<string, string>;
  onToggle: (logId: string, emoji: string) => void;
};

export function ReactionBar({ logId, reactions, nameMap, onToggle }: ReactionBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {REACTION_STAMPS.map((stamp) => {
        const summary = reactions.find((r) => r.emoji === stamp.key);
        const count = summary?.count ?? 0;
        const reacted = summary?.reacted ?? false;
        const names = (summary?.userIds ?? [])
          .map((id) => nameMap[id])
          .filter(Boolean);

        return (
          <button
            key={stamp.key}
            type="button"
            onClick={() => onToggle(logId, stamp.key)}
            title={stamp.label}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-all",
              reacted
                ? "border border-primary/40 bg-primary/10 text-foreground shadow-sm"
                : "border border-transparent bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <span className="text-sm leading-none">{stamp.emoji}</span>
            {count > 0 && (
              <span className={cn("font-medium", reacted ? "text-primary" : "text-muted-foreground")}>
                {names.length > 0 ? names.join(", ") : count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
