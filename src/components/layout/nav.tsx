"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, BookOpen, Mail, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "きょう", icon: Home },
  { href: "/calendar", label: "カレンダー", icon: Calendar },
  { href: "/logs", label: "きろく", icon: BookOpen },
  { href: "/weekly", label: "通信", icon: Mail },
  { href: "/family", label: "家族", icon: Users },
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
              "relative flex items-center gap-1.5 px-2.5 py-1.5 text-sm transition-colors",
              isActive
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon size={14} />
            {item.label}
            {isActive && (
              <span className="absolute bottom-0 left-3 right-3 h-px bg-primary" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
