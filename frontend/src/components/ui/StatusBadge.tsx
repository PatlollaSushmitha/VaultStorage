import { cn } from "@/lib/utils";
import type { StatusKind } from "@/types";

const STATUS_MAP: Record<
  StatusKind,
  { label: string; dot: string; text: string; bg: string; border: string }
> = {
  healthy: {
    label: "Healthy",
    dot: "bg-status-healthy",
    text: "text-status-healthy",
    bg: "bg-status-healthyDim",
    border: "border-status-healthy/25",
  },
  warning: {
    label: "Warning",
    dot: "bg-status-warning",
    text: "text-status-warning",
    bg: "bg-status-warningDim",
    border: "border-status-warning/25",
  },
  failed: {
    label: "Failed",
    dot: "bg-status-failed",
    text: "text-status-failed",
    bg: "bg-status-failedDim",
    border: "border-status-failed/25",
  },
  info: {
    label: "Info",
    dot: "bg-status-info",
    text: "text-status-info",
    bg: "bg-status-infoDim",
    border: "border-status-info/25",
  },
};

export function StatusBadge({
  status,
  label,
  pulse = false,
  className,
}: {
  status: StatusKind;
  label?: string;
  pulse?: boolean;
  className?: string;
}) {
  const cfg = STATUS_MAP[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium",
        cfg.bg,
        cfg.text,
        cfg.border,
        className
      )}
    >
      <span className="relative flex h-1.5 w-1.5">
        {pulse && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
              cfg.dot
            )}
          />
        )}
        <span
          className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", cfg.dot)}
        />
      </span>
      {label ?? cfg.label}
    </span>
  );
}
