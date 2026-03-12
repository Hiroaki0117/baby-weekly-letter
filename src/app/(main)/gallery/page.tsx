"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GalleryRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/logs?tab=photos");
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      <p className="text-xs text-muted-foreground">リダイレクト中...</p>
    </div>
  );
}
