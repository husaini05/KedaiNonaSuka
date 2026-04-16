import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  tone?: "default" | "accent" | "warn";
  icon?: ComponentType<{ className?: string }>;
}

export function StatCard({ title, value, description, tone = "default", icon: Icon }: StatCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-4 shadow-sm transition-shadow duration-150 hover:shadow-md",
        tone === "default" && "bg-white",
        tone === "accent" && "bg-green-50",
        tone === "warn"   && "bg-orange-50",
      )}
    >
      {/* Left accent bar */}
      <div
        className={cn(
          "absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full",
          tone === "default" && "bg-primary/40",
          tone === "accent" && "bg-green-400",
          tone === "warn"   && "bg-primary",
        )}
      />

      {/* Icon — top right */}
      {Icon && (
        <div
          className={cn(
            "absolute right-3 top-3 flex size-7 items-center justify-center rounded-xl",
            tone === "default" && "bg-gray-100",
            tone === "accent" && "bg-green-100",
            tone === "warn"   && "bg-orange-100",
          )}
        >
          <Icon
            className={cn(
              "size-3.5",
              tone === "default" && "text-muted-foreground",
              tone === "accent" && "text-green-600",
              tone === "warn"   && "text-primary",
            )}
          />
        </div>
      )}

      <div className="pl-4">
        <p
          className={cn(
            "text-[11px] font-semibold uppercase tracking-widest",
            tone === "default" && "text-muted-foreground",
            tone === "accent" && "text-green-700",
            tone === "warn"   && "text-primary/80",
          )}
        >
          {title}
        </p>

        <p
          className={cn(
            "mt-2 font-mono text-[21px] font-bold leading-tight",
            tone === "default" && "text-foreground",
            tone === "accent" && "text-green-800",
            tone === "warn"   && "text-primary",
          )}
        >
          {value}
        </p>

        <p
          className={cn(
            "mt-1.5 text-[12px] leading-relaxed",
            tone === "default" && "text-muted-foreground",
            tone === "accent" && "text-green-700/70",
            tone === "warn"   && "text-primary/60",
          )}
        >
          {description}
        </p>
      </div>
    </div>
  );
}
