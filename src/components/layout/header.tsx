"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Nav } from "./nav";

export function Header() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 glass">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          {/* 印鑑風ロゴマーク */}
          <span className="flex h-7 w-7 items-center justify-center rounded-sm border border-primary/60 bg-primary/8 text-[11px] font-bold text-primary transition-all duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
            日
          </span>
          <span className="font-mincho text-base font-semibold tracking-wider text-foreground">
            すくすく日記
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Nav />
          <button
            onClick={handleLogout}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            ログアウト
          </button>
        </div>
      </div>
    </header>
  );
}
