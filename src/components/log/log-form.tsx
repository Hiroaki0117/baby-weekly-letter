"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { toDateString } from "@/lib/date";
import { getMyFamilyId } from "@/lib/supabase/family";
import { logFormSchema, type LogFormValues } from "@/schemas/log";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MoodSelector } from "./mood-selector";
import { CategoryPicker } from "./category-picker";
import { PhotoUploader } from "./photo-uploader";
import { toast } from "sonner";
import { ChildSelector } from "@/components/child/child-selector";
import type { Child, DailyLog, Mood } from "@/types";

function safeFileName(file: File): string {
  const ext = file.name.split(".").pop() ?? "jpg";
  return `${crypto.randomUUID()}.${ext}`;
}

type LogFormProps = {
  childrenList: Child[];
  editingLog?: DailyLog | null;
  existingPhotoUrl?: string | null;
  onSaved: () => void;
  onCancel?: () => void;
};

export function LogForm({
  childrenList,
  editingLog,
  existingPhotoUrl,
  onSaved,
  onCancel,
}: LogFormProps) {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoResetKey, setPhotoResetKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<LogFormValues>({
    resolver: zodResolver(logFormSchema),
    defaultValues: {
      child_id:
        editingLog?.child_id ?? (childrenList.length === 1 ? childrenList[0].id : ""),
      text: editingLog?.text ?? "",
      mood: editingLog?.mood ?? undefined,
      categories: editingLog?.categories ?? [],
      log_date: editingLog?.log_date ?? toDateString(new Date()),
    },
  });

  const childId = watch("child_id");
  const mood = watch("mood");
  const categories = watch("categories");

  // childrenList が非同期で読み込まれた後に child_id をセットする
  useEffect(() => {
    if (!childId && childrenList.length === 1) {
      setValue("child_id", childrenList[0].id);
    }
  }, [childrenList, childId, setValue]);

  async function onSubmit(values: LogFormValues) {
    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("認証エラー");

      const familyId = await getMyFamilyId(supabase);
      if (!familyId) throw new Error("家族が設定されていません");

      let photoPath = editingLog?.photo_storage_path ?? null;

      if (editingLog) {
        const { error } = await supabase
          .from("daily_logs")
          .update({
            text: values.text,
            mood: values.mood,
            categories: values.categories,
            log_date: values.log_date,
          })
          .eq("id", editingLog.id);

        if (error) throw error;

        if (photoFile) {
          if (photoPath) {
            await supabase.storage.from("log-photos").remove([photoPath]);
          }
          photoPath = `logs/${familyId}/${editingLog.id}/${safeFileName(photoFile)}`;
          const { error: uploadError } = await supabase.storage
            .from("log-photos")
            .upload(photoPath, photoFile);
          if (uploadError) throw uploadError;

          await supabase
            .from("daily_logs")
            .update({ photo_storage_path: photoPath })
            .eq("id", editingLog.id);
        }

        toast.success("ログを更新しました");
      } else {
        const { data: newLogData, error } = await supabase
          .from("daily_logs")
          .insert({
            family_id: familyId,
            child_id: values.child_id,
            author_id: user.id,
            text: values.text,
            mood: values.mood,
            categories: values.categories,
            log_date: values.log_date,
          })
          .select()
          .single();

        if (error) throw error;

        const newLog = newLogData as DailyLog | null;

        if (photoFile && newLog) {
          photoPath = `logs/${familyId}/${newLog.id}/${safeFileName(photoFile)}`;
          const { error: uploadError } = await supabase.storage
            .from("log-photos")
            .upload(photoPath, photoFile);
          if (uploadError) throw uploadError;

          await supabase
            .from("daily_logs")
            .update({ photo_storage_path: photoPath })
            .eq("id", newLog.id);
        }

        toast.success("ログを保存しました");
        reset();
        setPhotoFile(null);
        setPhotoResetKey((k) => k + 1);
      }

      onSaved();
    } catch (error) {
      toast.error("保存に失敗しました", {
        description: error instanceof Error ? error.message : "不明なエラー",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm shadow-primary/5"
    >
      {/* フォームヘッダー */}
      <div className="border-b border-primary/10 bg-primary/5 px-5 py-3">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {editingLog ? "ログを編集" : "今日の記録"}
        </p>
      </div>

      <div className="space-y-5 p-5">
        {/* 子供セレクタ（2人以上の場合のみ表示） */}
        {childrenList.length >= 2 && (
          <div className="space-y-2.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              だれの記録？
            </Label>
            <ChildSelector
              childrenList={childrenList}
              selectedId={childId}
              onChange={(id) => setValue("child_id", id)}
            />
            {errors.child_id && (
              <p className="text-xs text-destructive">
                {errors.child_id.message}
              </p>
            )}
          </div>
        )}

        {/* 気分 */}
        <div className="space-y-2.5">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            今日の気分
          </Label>
          <MoodSelector
            value={mood as Mood | undefined}
            onChange={(m) => setValue("mood", m)}
          />
          {errors.mood && (
            <p className="text-xs text-destructive">{errors.mood.message}</p>
          )}
        </div>

        {/* テキスト（日記帳風） */}
        <div className="space-y-2.5">
          <Label
            htmlFor="text"
            className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            今日の出来事
          </Label>
          <Textarea
            id="text"
            placeholder="今日あったことや気持ちを自由に書いてください..."
            {...register("text")}
            className="resize-none border-border/60 bg-background/60 leading-8 focus:border-primary/50 h-[6rem] sm:h-[10rem] sm:notebook-lines"
          />
          {errors.text && (
            <p className="text-xs text-destructive">{errors.text.message}</p>
          )}
        </div>

        {/* カテゴリ */}
        <div className="space-y-2.5">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            カテゴリ
          </Label>
          <CategoryPicker
            value={categories}
            onChange={(c) => setValue("categories", c)}
          />
        </div>

        {/* 写真 */}
        <div className="space-y-2.5">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            写真
          </Label>
          <PhotoUploader
            key={photoResetKey}
            existingUrl={editingLog ? existingPhotoUrl : undefined}
            onChange={setPhotoFile}
          />
        </div>
      </div>

      {/* ボタン */}
      <div className="flex gap-2 border-t border-primary/10 bg-primary/5 px-5 py-3">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20 disabled:opacity-50"
        >
          {saving ? "保存中…" : editingLog ? "更新する" : "保存する"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border/70 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            キャンセル
          </button>
        )}
      </div>
    </form>
  );
}
