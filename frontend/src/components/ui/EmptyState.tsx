import type { LucideIcon } from "lucide-react";
import { Button } from "./Button";

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-lg border border-dashed border-base-border bg-base-surface/40 px-6 py-16 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-lg border border-base-border bg-base-surface2">
        <Icon className="h-6 w-6 text-brand" strokeWidth={1.75} />
      </div>
      <h3 className="text-base font-semibold text-text-primary">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-text-secondary">
        {description}
      </p>
      {actionLabel && (
        <Button variant="secondary" size="sm" className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
