import type { StatusKind } from "@/types";

// Maps the various status strings the backend uses (object status, node
// status, replica status, repair status) onto the 4 visual states the
// existing StatusBadge component knows how to render.
export function toStatusKind(status: string): StatusKind {
  switch (status) {
    case "HEALTHY":
    case "VERIFIED":
    case "COMPLETED":
    case "RECOVERING":
      return "healthy";
    case "AT_RISK":
    case "DEGRADED":
    case "RUNNING":
    case "QUEUED":
    case "REPAIRING":
      return "warning";
    case "FAILED":
    case "CORRUPTED":
    case "UNAVAILABLE":
    case "CRITICAL":
    case "LOST":
      return "failed";
    default:
      return "info";
  }
}
