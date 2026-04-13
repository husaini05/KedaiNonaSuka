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
        "relative overflow-hidden rounded-[24px] border bg-white p-5 shadow-sm transition-shadow hover:shadow-md",
        tone === "default" && "border-border/60",
        tone === "accent" && "border-green-200 bg-green-50/60",
        tone === "warn"   && "border-primary/25 bg-orange-50/60",
      )}
    >
      {/* Top accent stripe */}
      <div
        className={cn(
          "absolute left-0 top-0 h-[3px] w-full rounded-t-[24px]",
          tone === "default" && "bg-foreground/15",
          tone === "accent" && "bg-green-400",
          tone === "warn"   && "bg-primary",
        )}
      />

      <p
        className={cn(
          "text-xs font-semibold uppercase tracking-wider",
          tone === "default" && "text-muted-foreground",
          tone === "accent" && "text-green-700",
          tone === "warn"   && "text-primary/80",
        )}
      >
        {title}
      </p>

      <p
        className={cn(
          "mt-2 font-heading text-2xl font-bold tracking-tight md:text-3xl",
          tone === "default" && "text-foreground",
          tone === "accent" && "text-green-800",
          tone === "warn"   && "text-primary",
        )}
      >
        {value}
      </p>

      <p
        className={cn(
          "mt-1.5 text-xs leading-relaxed",
          tone === "default" && "text-muted-foreground",
          tone === "accent" && "text-green-700/70",
          tone === "warn"   && "text-primary/60",
        )}
      >
        {description}
      </p>
    </div>
  );
}
