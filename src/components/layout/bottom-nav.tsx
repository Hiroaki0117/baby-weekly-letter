"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Calendar,
  BookOpen,
  ImageIcon,
  MoreHorizontal,
  BarChart3,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/", label: "今日", icon: Home },
  { href: "/calendar", label: "カレンダー", icon: Calendar },
  { href: "/logs", label: "記録", icon: BookOpen },
  { href: "/gallery", label: "写真", icon: ImageIcon },
];

const moreMenuItems = [
  { href: "/stats", label: "統計", icon: BarChart3 },
  { href: "/family", label: "家族", icon: Users },
  { href: "/settings", label: "設定", icon: Settings },
];

const morePaths = ["/stats", "/family", "/settings"];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isMoreActive = morePaths.some((p) => pathname.startsWith(p));

  // メニュー外タップで閉じる
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  async function handleLogout() {
    setMenuOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden glass border-t border-border/50 pb-[env(safe-area-inset-bottom)]"
      aria-label="メインナビゲーション"
    >
      {/* その他メニュー */}
      {menuOpen && (
        <div
          ref={menuRef}
          className="absolute bottom-full right-2 mb-2 w-48 rounded-xl border border-border/60 bg-background shadow-lg"
        >
          <div className="py-1">
            {moreMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm transition-colors",
                    isActive
                      ? "text-primary font-medium"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div className="mx-3 border-t border-border/40" />
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogOut size={18} />
              <span>ログアウト</span>
            </button>
          </div>
        </div>
      )}

      <div className="grid w-full grid-cols-5">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] text-[10px] font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon
                size={20}
                className={cn(
                  "transition-transform duration-150",
                  isActive && "scale-110"
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* その他ボタン */}
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] text-[10px] font-medium transition-colors",
            isMoreActive || menuOpen
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <MoreHorizontal
            size={20}
            className={cn(
              "transition-transform duration-150",
              (isMoreActive || menuOpen) && "scale-110"
            )}
          />
          <span>その他</span>
        </button>
      </div>
    </nav>
  );
}
