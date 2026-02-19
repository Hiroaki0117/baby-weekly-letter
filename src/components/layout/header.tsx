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
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold">
          すくすく日記
        </Link>
        <div className="flex items-center gap-2">
          <Nav />
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            ログアウト
          </Button>
        </div>
      </div>
    </header>
  );
}
