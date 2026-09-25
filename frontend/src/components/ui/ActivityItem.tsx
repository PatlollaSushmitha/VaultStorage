import type { ActivityEntry } from "@/types";
import { StatusBadge } from "./StatusBadge";

export function ActivityItem({ entry }: { entry: ActivityEntry }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-base-border py-3.5 last:border-0 last:pb-0">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-text-primary">
          {entry.title}
        </span>
        <span className="text-xs text-text-secondary">{entry.detail}</span>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <StatusBadge status={entry.status} />
        <span className="font-mono text-[11px] text-text-muted">
          {entry.timestamp}
        </span>
      </div>
    </div>
  );
}
