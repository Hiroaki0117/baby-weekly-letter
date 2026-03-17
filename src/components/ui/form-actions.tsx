type Props = {
  saving: boolean;
  isEditing?: boolean;
  submitLabel?: string;
  savingLabel?: string;
  cancelLabel?: string;
  onCancel: () => void;
  className?: string;
  submitClassName?: string;
};

export function FormActions({
  saving,
  isEditing,
  submitLabel,
  savingLabel = "保存中...",
  cancelLabel = "取消",
  onCancel,
  className,
  submitClassName = "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50",
}: Props) {
  const label = submitLabel ?? (isEditing ? "更新" : "追加");

  return (
    <div className={className ?? "flex gap-2"}>
      <button
        type="submit"
        disabled={saving}
        className={submitClassName}
      >
        {saving ? savingLabel : label}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-border/60 px-4 py-2 text-sm text-muted-foreground transition-all hover:bg-secondary/60"
      >
        {cancelLabel}
      </button>
    </div>
  );
}
