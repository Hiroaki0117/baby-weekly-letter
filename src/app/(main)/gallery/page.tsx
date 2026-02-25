"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { groupPhotosByMonth } from "@/lib/gallery";
import { PhotoGrid } from "@/components/gallery/photo-grid";
import { PhotoModal } from "@/components/gallery/photo-modal";
import { toast } from "sonner";
import type { Child } from "@/types";

type ModalState = {
  imageUrl: string;
  logDate: string;
  text: string;
  mood: string;
  childName?: string;
} | null;

export default function GalleryPage() {
  const [months, setMonths] = useState<ReturnType<typeof groupPhotosByMonth>>(
    []
  );
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState<ModalState>(null);
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    const client = supabaseRef.current;
    async function load() {
      const [logsRes, childrenRes] = await Promise.all([
        client
          .from("daily_logs")
          .select("id, log_date, text, mood, child_id, photo_storage_path")
          .not("photo_storage_path", "is", null)
          .order("log_date", { ascending: false })
          .order("created_at", { ascending: false }),
        client
          .from("children")
          .select("*")
          .order("created_at", { ascending: true }),
      ]);

      if (logsRes.error) {
        toast.error("写真の取得に失敗しました");
        setLoading(false);
        return;
      }

      const logs = (logsRes.data ?? []) as {
        id: string;
        log_date: string;
        text: string;
        mood: string;
        child_id: string;
        photo_storage_path: string;
      }[];

      setMonths(groupPhotosByMonth(logs));

      if (!childrenRes.error && childrenRes.data) {
        setChildrenList(childrenRes.data as Child[]);
      }

      setLoading(false);
    }
    load();
  }, []);

  const childrenMap = new Map(
    childrenList.map((c) => [c.id, c.name ?? ""])
  );
  const showChildBadge = childrenList.length >= 2;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <p className="text-xs text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ページヘッダー */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Photos
          </p>
          <h1 className="font-mincho mt-0.5 text-xl font-semibold text-foreground">
            写真ギャラリー
          </h1>
        </div>
        {months.length > 0 && (
          <span className="font-mono text-2xl font-light leading-none text-muted-foreground/50">
            {String(months.reduce((sum, m) => sum + m.photos.length, 0)).padStart(3, "0")}
          </span>
        )}
      </div>

      <div className="h-px bg-border/60" />

      {/* コンテンツ */}
      {months.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-border text-2xl">
            📷
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              まだ写真がありません
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              記録に写真を添付してみましょう
            </p>
          </div>
        </div>
      ) : (
        <PhotoGrid
          months={months}
          childrenMap={childrenMap}
          showChildBadge={showChildBadge}
          onSelect={setModalState}
        />
      )}

      {/* モーダル */}
      {modalState && (
        <PhotoModal
          imageUrl={modalState.imageUrl}
          logDate={modalState.logDate}
          text={modalState.text}
          mood={modalState.mood}
          childName={modalState.childName}
          onClose={() => setModalState(null)}
        />
      )}
    </div>
  );
}
