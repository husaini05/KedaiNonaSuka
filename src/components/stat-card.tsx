import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  tone?: "default" | "accent" | "warn";
}

export function StatCard({ title, value, description, tone = "default" }: StatCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-4 shadow-sm",
        tone === "default" && "bg-white",
        tone === "accent" && "bg-green-50",
        tone === "warn"   && "bg-orange-50",
      )}
    >
      {/* Left accent bar */}
      <div
        className={cn(
          "absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full",
          tone === "default" && "bg-gray-200",
          tone === "accent" && "bg-green-400",
          tone === "warn"   && "bg-primary",
        )}
      />

      <div className="pl-4">
        <p
          className={cn(
            "text-[11px] font-semibold uppercase tracking-wider",
            tone === "default" && "text-muted-foreground",
            tone === "accent" && "text-green-700",
            tone === "warn"   && "text-primary/80",
          )}
        >
          {title}
        </p>

        <p
          className={cn(
            "mt-2 font-heading text-[22px] font-bold leading-tight",
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
