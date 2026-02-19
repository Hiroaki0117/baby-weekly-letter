"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateJa } from "@/lib/date";
import { MOOD_OPTIONS, CATEGORY_OPTIONS, type DailyLog } from "@/types";
import { createClient } from "@/lib/supabase/client";

type LogCardProps = {
  log: DailyLog;
  onEdit: (log: DailyLog) => void;
  onDelete: (id: string) => void;
};

export function LogCard({ log, onEdit, onDelete }: LogCardProps) {
  const moodOption = MOOD_OPTIONS.find((m) => m.value === log.mood);
  const supabase = createClient();

  let photoUrl: string | null = null;
  if (log.photo_storage_path) {
    const { data } = supabase.storage
      .from("log-photos")
      .getPublicUrl(log.photo_storage_path);
    photoUrl = data.publicUrl;
  }

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5">
      {photoUrl && (
        <div className="relative h-48 w-full">
          <Image
            src={photoUrl}
            alt="ログ写真"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 672px"
          />
        </div>
      )}
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{moodOption?.emoji}</span>
            <div>
              <p className="text-sm font-medium">{formatDateJa(log.log_date)}</p>
              <p className="text-xs text-muted-foreground">{moodOption?.label}</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(log)}
              className="text-muted-foreground hover:text-foreground"
            >
              編集
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
              onClick={() => onDelete(log.id)}
            >
              削除
            </Button>
          </div>
        </div>

        <p className="whitespace-pre-wrap text-sm leading-relaxed">{log.text}</p>

        {log.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {log.categories.map((cat) => {
              const option = CATEGORY_OPTIONS.find((c) => c.value === cat);
              const label = option?.label ?? cat;
              return (
                <Badge
                  key={cat}
                  variant="secondary"
                  className="bg-accent text-accent-foreground border-0 text-xs"
                >
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
