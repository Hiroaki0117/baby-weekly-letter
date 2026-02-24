"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "きょう" },
  { href: "/calendar", label: "カレンダー" },
  { href: "/logs", label: "きろく" },
  { href: "/weekly", label: "通信" },
  { href: "/family", label: "家族" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1">
      {navItems.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative px-2.5 py-1.5 text-sm transition-colors",
              isActive
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
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
