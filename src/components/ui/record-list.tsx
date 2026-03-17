import { Pencil, Trash2 } from "lucide-react";

type Props<T extends { id: string }> = {
  records: T[];
  emptyMessage: string;
  renderContent: (record: T) => React.ReactNode;
  onEdit: (record: T) => void;
  onDelete: (id: string) => void;
};

export function RecordList<T extends { id: string }>({
  records,
  emptyMessage,
  renderContent,
  onEdit,
  onDelete,
}: Props<T>) {
  if (records.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="divide-y divide-border/30">
      {[...records].reverse().map((record) => (
        <div
          key={record.id}
          className="flex items-center justify-between py-3"
        >
          {renderContent(record)}
          <div className="flex gap-1">
            <button
              onClick={() => onEdit(record)}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="編集"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => onDelete(record.id)}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500"
              aria-label="削除"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
