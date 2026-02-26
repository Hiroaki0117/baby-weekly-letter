"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, BookOpen, ImageIcon, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "今日", icon: Home },
  { href: "/calendar", label: "カレンダー", icon: Calendar },
  { href: "/logs", label: "記録", icon: BookOpen },
  { href: "/gallery", label: "写真", icon: ImageIcon },
  { href: "/stats", label: "統計", icon: BarChart3 },
];

type NavProps = {
  className?: string;
};

export function Nav({ className }: NavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn(className, "flex gap-1")} aria-label="メインナビゲーション">
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
              "relative flex items-center gap-1 whitespace-nowrap px-1.5 py-1.5 text-xs transition-colors",
              isActive
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon size={12} className="shrink-0" />
            {item.label}
            {isActive && (
              <span className="absolute bottom-0 left-2 right-2 h-px bg-primary" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
