"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { toDateString } from "@/lib/date";
import { logFormSchema, type LogFormValues } from "@/schemas/log";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MoodSelector } from "./mood-selector";
import { CategoryPicker } from "./category-picker";
import { PhotoUploader } from "./photo-uploader";
import { toast } from "sonner";
import type { DailyLog, Mood } from "@/types";

type LogFormProps = {
  editingLog?: DailyLog | null;
  existingPhotoUrl?: string | null;
  onSaved: () => void;
  onCancel?: () => void;
};

export function LogForm({
  editingLog,
  existingPhotoUrl,
  onSaved,
  onCancel,
}: LogFormProps) {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
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
      text: editingLog?.text ?? "",
      mood: editingLog?.mood ?? undefined,
      categories: editingLog?.categories ?? [],
      log_date: editingLog?.log_date ?? toDateString(new Date()),
    },
  });

  const mood = watch("mood");
  const categories = watch("categories");

  async function onSubmit(values: LogFormValues) {
    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("認証エラー");

      let photoPath = editingLog?.photo_storage_path ?? null;

      if (editingLog) {
        // 更新
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

        // 新しい写真がある場合
        if (photoFile) {
          // 古い写真を削除
          if (photoPath) {
            await supabase.storage.from("log-photos").remove([photoPath]);
          }
          photoPath = `logs/${user.id}/${editingLog.id}/${photoFile.name}`;
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
        // 新規作成
        const { data: newLogData, error } = await supabase
          .from("daily_logs")
          .insert({
            user_id: user.id,
            text: values.text,
            mood: values.mood,
            categories: values.categories,
            log_date: values.log_date,
          })
          .select()
          .single();

        if (error) throw error;

        const newLog = newLogData as DailyLog | null;

        // 写真アップロード
        if (photoFile && newLog) {
          photoPath = `logs/${user.id}/${newLog.id}/${photoFile.name}`;
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>今日の気分</Label>
        <MoodSelector
          value={mood as Mood | undefined}
          onChange={(m) => setValue("mood", m)}
        />
        {errors.mood && (
          <p className="text-sm text-destructive">{errors.mood.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="text">今日の出来事</Label>
        <Textarea
          id="text"
          placeholder="今日あったことや気持ちを自由に書いてください..."
          rows={4}
          {...register("text")}
        />
        {errors.text && (
          <p className="text-sm text-destructive">{errors.text.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>カテゴリ</Label>
        <CategoryPicker
          value={categories}
          onChange={(c) => setValue("categories", c)}
        />
      </div>

      <div className="space-y-2">
        <Label>写真</Label>
        <PhotoUploader
          existingUrl={editingLog ? existingPhotoUrl : undefined}
          onChange={setPhotoFile}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={saving}>
          {saving
            ? "保存中..."
            : editingLog
              ? "更新する"
              : "保存する"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            キャンセル
          </Button>
        )}
      </div>
    </form>
  );
}
