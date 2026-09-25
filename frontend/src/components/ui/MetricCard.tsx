import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "./Card";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  unit,
  icon: Icon,
  trend,
  trendDirection = "up",
  accent = "default",
}: {
  label: string;
  value: string;
  unit?: string;
  icon: LucideIcon;
  trend?: string;
  trendDirection?: "up" | "down";
  accent?: "default" | "healthy" | "warning" | "failed" | "info";
}) {
  const accentMap: Record<string, string> = {
    default: "text-brand bg-brand/10",
    healthy: "text-status-healthy bg-status-healthyDim",
    warning: "text-status-warning bg-status-warningDim",
    failed: "text-status-failed bg-status-failedDim",
    info: "text-status-info bg-status-infoDim",
  };

  return (
    <Card padding="lg" className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-text-secondary">
          {label}
        </span>
        <div className={cn("rounded-md p-1.5", accentMap[accent])}>
          <Icon className="h-4 w-4" strokeWidth={2} />
        </div>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="font-mono text-2xl font-semibold tracking-tight text-text-primary">
          {value}
        </span>
        {unit && (
          <span className="font-mono text-sm text-text-secondary">{unit}</span>
        )}
      </div>
      {trend && (
        <div
          className={cn(
            "flex items-center gap-1 text-xs font-medium",
            trendDirection === "up" ? "text-status-healthy" : "text-status-failed"
          )}
        >
          {trendDirection === "up" ? (
            <ArrowUpRight className="h-3.5 w-3.5" />
          ) : (
            <ArrowDownRight className="h-3.5 w-3.5" />
          )}
          {trend}
        </div>
      )}
    </Card>
  );
}
