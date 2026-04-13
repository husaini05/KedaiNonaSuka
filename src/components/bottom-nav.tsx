"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gauge, Package2, ScrollText, ShoppingBasket, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/kasir", label: "Kasir", icon: ShoppingBasket },
  { href: "/inventaris", label: "Stok", icon: Package2 },
  { href: "/buku-hutang", label: "Hutang", icon: Wallet },
  { href: "/laporan", label: "Laporan", icon: ScrollText },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex border-t border-border/40 bg-background/96 backdrop-blur-xl">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors active:scale-95",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-full transition-all",
                  isActive && "bg-primary/12"
                )}
              >
                <Icon className={cn("size-5", isActive && "stroke-[2.5]")} />
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
