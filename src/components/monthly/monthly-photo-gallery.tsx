"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getMonthRange, toDateString } from "@/lib/date";

type MonthlyPhotoGalleryProps = {
  year: number;
  month: number;
};

type PhotoItem = {
  id: string;
  url: string;
};

export function MonthlyPhotoGallery({
  year,
  month,
}: MonthlyPhotoGalleryProps) {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchPhotos() {
      const { start, end } = getMonthRange(year, month);
      const { data: logs } = await supabase
        .from("daily_logs")
        .select("id, photo_storage_path")
        .gte("log_date", toDateString(start))
        .lte("log_date", toDateString(end))
        .not("photo_storage_path", "is", null);

      if (!logs || logs.length === 0) return;

      const paths = logs
        .filter((log) => log.photo_storage_path)
        .map((log) => log.photo_storage_path!);
      const { data: signedData } = await supabase.storage
        .from("log-photos")
        .createSignedUrls(paths, 3600);
      if (!signedData) return;

      const photoItems: PhotoItem[] = logs
        .filter((log) => log.photo_storage_path)
        .map((log, i) => ({
          id: log.id,
          url: signedData[i]?.signedUrl ?? "",
        }))
        .filter((p) => p.url);

      setPhotos(photoItems);
    }

    fetchPhotos();
  }, [supabase, year, month]);

  if (photos.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">
        この月の写真
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={photo.id}
            src={photo.url}
            alt="ログ写真"
            className="aspect-square rounded-lg object-cover"
          />
        ))}
      </div>
    </div>
  );
}
