"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Settings, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
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
    <header className="sticky top-0 z-50 border-b border-border/50 glass hidden md:block">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-1.5 shrink-0 group">
          {/* 印鑑風ロゴマーク */}
          <span className="flex h-6 w-6 items-center justify-center rounded-sm border border-primary/60 bg-primary/8 text-[10px] font-bold text-primary transition-all duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
            日
          </span>
          <span className="font-mincho text-sm font-semibold tracking-wide text-foreground">
            すくすく日記
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <Nav className="hidden md:flex" />
          <div className="hidden md:flex items-center gap-1 md:border-l md:border-border/40 md:pl-2">
            <Link
              href="/family"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="家族"
            >
              <Users size={14} />
            </Link>
            <Link
              href="/settings"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="設定"
            >
              <Settings size={14} />
            </Link>
            <button
              onClick={handleLogout}
              className="hidden md:inline-block whitespace-nowrap text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              ログアウト
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
