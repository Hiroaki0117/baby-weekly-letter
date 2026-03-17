type Props = {
  emoji?: string;
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ emoji, icon, title, subtitle, action, className = "py-20" }: Props) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      {icon
        ? icon
        : emoji && (
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-border text-2xl">
              {emoji}
            </div>
          )}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">{title}</p>
        {subtitle && (
          <p className="mt-1 text-xs text-muted-foreground/70">{subtitle}</p>
        )}
        {action}
      </div>
    </div>
  );
}
