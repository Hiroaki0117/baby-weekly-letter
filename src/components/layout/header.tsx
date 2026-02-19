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
    <header className="sticky top-0 z-50 border-b border-border/60 backdrop-blur-md bg-background/80">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-xl">🌱</span>
          <span className="text-lg font-bold bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
            すくすく日記
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Nav />
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
            ログアウト
          </Button>
        </div>
      </div>
    </header>
  );
}
