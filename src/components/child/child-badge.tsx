import { cn } from "@/lib/utils";

type ChildBadgeProps = {
  name: string;
  className?: string;
};

export function ChildBadge({ name, className }: ChildBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary",
        className
      )}
    >
      {name}
    </span>
  );
}
