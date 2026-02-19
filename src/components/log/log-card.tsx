"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateJa } from "@/lib/date";
import { MOOD_OPTIONS, CATEGORY_OPTIONS, type DailyLog } from "@/types";

type LogCardProps = {
  log: DailyLog;
  onEdit: (log: DailyLog) => void;
  onDelete: (id: string) => void;
};

export function LogCard({ log, onEdit, onDelete }: LogCardProps) {
  const moodOption = MOOD_OPTIONS.find((m) => m.value === log.mood);

  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{moodOption?.emoji}</span>
            <span className="text-sm text-muted-foreground">
              {formatDateJa(log.log_date)}
            </span>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => onEdit(log)}>
              編集
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() => onDelete(log.id)}
            >
              削除
            </Button>
          </div>
        </div>

        <p className="whitespace-pre-wrap text-sm">{log.text}</p>

        {log.categories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {log.categories.map((cat) => {
              const label =
                CATEGORY_OPTIONS.find((c) => c.value === cat)?.label ?? cat;
              return (
                <Badge key={cat} variant="secondary">
                  {label}
                </Badge>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
