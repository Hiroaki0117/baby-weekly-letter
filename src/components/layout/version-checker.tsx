"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

const CLIENT_BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID ?? "";
const CHECK_INTERVAL_MS = 30_000; // 連続チェック防止: 最低30秒空ける

export function VersionChecker() {
  const lastCheckRef = useRef(0);
  const notifiedRef = useRef(false);

  useEffect(() => {
    async function check() {
      // 既に通知済み or 短時間の再チェック防止
      if (notifiedRef.current) return;
      const now = Date.now();
      if (now - lastCheckRef.current < CHECK_INTERVAL_MS) return;
      lastCheckRef.current = now;

      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { buildId: string };
        if (!CLIENT_BUILD_ID || !data.buildId) return;
        if (data.buildId === CLIENT_BUILD_ID) return;

        notifiedRef.current = true;
        toast("新しいバージョンがあります", {
          description: "最新の修正を反映するには更新してください",
          duration: Infinity,
          action: {
            label: "更新する",
            onClick: () => window.location.reload(),
          },
        });
      } catch {
        // ネットワークエラー等はサイレントに無視
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        check();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
}
