import { useEffect, useState } from "react";
import {
  HardDrive,
  Boxes,
  Server,
  GitBranch,
  Wrench,
  ShieldCheck,
  LineChart,
  Activity as ActivityIcon,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { MetricCard } from "@/components/ui/MetricCard";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ActivityItem } from "@/components/ui/ActivityItem";
import { api, formatBytes, timeAgo, type ClusterMetrics, type VaultNode, type ActivityEvent } from "@/lib/api";
import { toStatusKind } from "@/lib/status";

export function Dashboard() {
  const [metrics, setMetrics] = useState<ClusterMetrics | null>(null);
  const [nodes, setNodes] = useState<VaultNode[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  async function load() {
    try {
      const [m, n, a] = await Promise.all([
        api.getMetrics(),
        api.listNodes(),
        api.listActivity(6),
      ]);
      setMetrics(m.metrics);
      setNodes(n.nodes);
      setActivity(a.activity);
      setLastChecked(new Date());
      setError(null);
    } catch (err: any) {
      setError(err.message ?? "Failed to reach the Vault backend");
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  const allHealthy = nodes.length > 0 && nodes.every((n) => n.status === "HEALTHY");
  const usedLabel = metrics ? formatBytes(metrics.storageUsed).split(" ") : ["—", ""];

  return (
    <div>
      <PageHeader title="Dashboard" description="Cluster-wide overview, updated in real time." />

      {error && (
        <Card padding="md" className="mb-6 border-status-failed/40 bg-status-failedDim">
          <span className="text-sm text-status-failed">
            Couldn't reach the backend at the configured API URL: {error}. Is it running?
          </span>
        </Card>
      )}

      {/* System status banner */}
      <Card padding="md" className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <StatusBadge
            status={allHealthy ? "healthy" : "warning"}
            label={allHealthy ? "HEALTHY" : "DEGRADED"}
            pulse
          />
          <span className="text-sm text-text-secondary">
            {nodes.length > 0
              ? `${nodes.filter((n) => n.status === "HEALTHY").length} of ${nodes.length} storage nodes are operational.`
              : "Waiting for cluster data..."}
          </span>
        </div>
        <span className="font-mono text-xs text-text-muted">
          {lastChecked ? `Last checked ${timeAgo(lastChecked.toISOString())}` : ""}
        </span>
      </Card>

      {/* Metric cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Storage Used" value={usedLabel[0]} unit={usedLabel[1]} icon={HardDrive} />
        <MetricCard label="Objects" value={metrics ? String(metrics.totalObjects) : "—"} icon={Boxes} />
        <MetricCard
          label="Nodes Online"
          value={metrics ? `${metrics.healthyNodes} / ${metrics.totalNodes}` : "—"}
          icon={Server}
          accent={metrics && metrics.healthyNodes === metrics.totalNodes ? "healthy" : "warning"}
        />
        <MetricCard
          label="Replication Factor"
          value={metrics ? `${metrics.replicationFactor}x` : "—"}
          icon={GitBranch}
          accent="info"
        />
        <MetricCard
          label="Pending Repairs"
          value={metrics ? String(metrics.activeRepairs) : "—"}
          icon={Wrench}
          accent={metrics && metrics.activeRepairs > 0 ? "warning" : "healthy"}
        />
        <MetricCard
          label="Integrity"
          value={metrics ? String(metrics.integrityPercentage) : "—"}
          unit="%"
          icon={ShieldCheck}
          accent="healthy"
        />
      </div>

      {/* Storage Overview + Node Health */}
      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card padding="lg" className="flex flex-col xl:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <CardTitle>Storage Overview</CardTitle>
              <CardDescription className="mt-1">
                {metrics
                  ? `${formatBytes(metrics.storageUsed)} used of ${formatBytes(metrics.storageCapacity)} capacity across the cluster`
                  : "Capacity used across the cluster"}
              </CardDescription>
            </div>
            <div className="rounded-md bg-brand/10 p-2 text-brand">
              <LineChart className="h-4 w-4" />
            </div>
          </div>
          <div className="flex h-56 flex-1 flex-col items-center justify-center gap-3 rounded-md border border-dashed border-base-border bg-base-surface2/40 px-8">
            {metrics && metrics.storageCapacity > 0 ? (
              <div className="w-full max-w-md">
                <div className="h-3 w-full overflow-hidden rounded-full bg-base-border">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{
                      width: `${Math.min(100, (metrics.storageUsed / metrics.storageCapacity) * 100)}%`,
                    }}
                  />
                </div>
                <p className="mt-3 text-center text-xs text-text-muted">
                  {((metrics.storageUsed / metrics.storageCapacity) * 100).toFixed(1)}% of capacity used
                </p>
              </div>
            ) : (
              <span className="text-xs text-text-muted">Storage trend chart will render here</span>
            )}
          </div>
        </Card>

        <Card padding="lg" className="flex flex-col">
          <div className="mb-5 flex items-center justify-between">
            <CardTitle>Node Health</CardTitle>
            <div className="rounded-md bg-status-healthyDim p-2 text-status-healthy">
              <Server className="h-4 w-4" />
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-2.5">
            {nodes.length === 0 && <span className="text-xs text-text-muted">No node data yet.</span>}
            {nodes.map((node) => (
              <div
                key={node.id}
                className="flex items-center justify-between rounded-md border border-base-border bg-base-surface2/40 px-3 py-2.5"
              >
                <span className="font-mono text-sm text-text-primary">{node.node_name}</span>
                <StatusBadge
                  status={toStatusKind(node.status)}
                  label={node.status === "HEALTHY" ? "Online" : node.status}
                />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card padding="lg">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription className="mt-1">Latest events across the cluster</CardDescription>
          </div>
          <div className="rounded-md bg-status-infoDim p-2 text-status-info">
            <ActivityIcon className="h-4 w-4" />
          </div>
        </div>
        <div>
          {activity.length === 0 && <span className="text-xs text-text-muted">No activity recorded yet.</span>}
          {activity.map((entry) => {
            const isBad =
              entry.event_type.includes("FAIL") ||
              entry.event_type.includes("MISMATCH") ||
              entry.event_type.includes("CORRUPT");
            return (
              <ActivityItem
                key={entry.id}
                entry={{
                  id: entry.id,
                  title: entry.event_type.replace(/_/g, " "),
                  detail: entry.message,
                  timestamp: timeAgo(entry.created_at),
                  status: isBad ? "failed" : "healthy",
                }}
              />
            );
          })}
        </div>
      </Card>
    </div>
  );
}
