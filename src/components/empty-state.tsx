interface EmptyStateProps {
  emoji: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ emoji, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white px-6 py-8 text-center shadow-sm">
      <span className="text-4xl leading-none">{emoji}</span>
      <p className="mt-3 font-heading text-base font-semibold text-foreground">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-[260px] text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
