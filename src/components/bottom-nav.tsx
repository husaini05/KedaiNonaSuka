"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, LayoutDashboard, Package2, Settings2, ShoppingBasket, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard",   label: "Beranda",    icon: LayoutDashboard },
  { href: "/kasir",       label: "Kasir",      icon: ShoppingBasket },
  { href: "/inventaris",  label: "Stok",       icon: Package2 },
  { href: "/laporan",     label: "Laporan",    icon: BarChart3 },
  { href: "/pengaturan",  label: "Pengaturan", icon: Settings2 },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {/* Material 3-inspired bottom nav: white, top-shadow, pill active indicator */}
      <div className="flex bg-white shadow-[0_-1px_0_rgba(0,0,0,0.07),0_-4px_12px_rgba(0,0,0,0.04)] px-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center pt-1.5 pb-2 gap-0.5 transition-opacity active:opacity-60"
            >
              {/* Pill indicator — filled orange when active */}
              <div
                className={cn(
                  "flex h-8 w-[3.75rem] items-center justify-center rounded-full transition-all duration-200",
                  isActive ? "bg-primary/15" : "bg-transparent"
                )}
              >
                <Icon
                  className={cn(
                    "size-[22px] transition-all duration-200",
                    isActive ? "text-primary" : "text-gray-400"
                  )}
                  strokeWidth={isActive ? 2.5 : 1.75}
                />
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-[11px] leading-none font-medium transition-colors",
                  isActive ? "text-primary font-semibold" : "text-gray-400"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
