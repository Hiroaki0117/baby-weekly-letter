type Props = {
  message?: string;
};

export function LoadingSpinner({ message = "読み込み中..." }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  );
}
