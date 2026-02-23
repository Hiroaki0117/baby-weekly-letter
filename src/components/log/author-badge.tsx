"use client";

type AuthorBadgeProps = {
  displayName: string | null;
};

export function AuthorBadge({ displayName }: AuthorBadgeProps) {
  if (!displayName) return null;

  return (
    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
      {displayName}
    </span>
  );
}
