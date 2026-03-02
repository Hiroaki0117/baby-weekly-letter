import type { ReactNode } from "react";

const ACCENT_STYLES = {
  primary: "from-primary via-primary/70 to-primary/30",
  amber: "from-amber-500 via-amber-400/70 to-amber-300/30",
} as const;

type AccentCardProps = {
  accent?: keyof typeof ACCENT_STYLES;
  className?: string;
  children: ReactNode;
};

export function AccentCard({
  accent = "primary",
  className,
  children,
}: AccentCardProps) {
  return (
    <div
      className={`group overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm shadow-primary/5 transition-all duration-200 hover:shadow-md hover:shadow-primary/10 hover:-translate-y-1${className ? ` ${className}` : ""}`}
    >
      <div className="flex">
        <div
          className={`w-1 flex-shrink-0 bg-gradient-to-b ${ACCENT_STYLES[accent]}`}
        />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
