import { useEffect, useState } from "react";
import { GitBranch } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { api, type ReplicationOverview } from "@/lib/api";
import { toStatusKind } from "@/lib/status";
import { Layers, ShieldAlert, GitCommit } from "lucide-react";

export function Replication() {
  const [data, setData] = useState<ReplicationOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await api.getReplication();
      setData(res);
      setError(null);
    } catch (err: any) {
      setError(err.message ?? "Failed to load replication data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <PageHeader
        title="Replication"
        description="Track replica counts, placement across nodes, and consistency across the cluster."
      />

      {error && (
        <Card padding="md" className="mb-6 border-status-failed/40 bg-status-failedDim">
          <span className="text-sm text-status-failed">{error}</span>
        </Card>
      )}

      {!loading && !data ? (
        <EmptyState
          icon={GitBranch}
          title="Replication topology not configured"
          description="Couldn't load replication data from the backend."
        />
      ) : data ? (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Replication Factor" value={`${data.replicationFactor}x`} icon={GitCommit} accent="info" />
            <MetricCard label="Healthy Replicas" value={`${data.healthyReplicas} / ${data.totalReplicas}`} icon={Layers} accent="healthy" />
            <MetricCard
              label="Objects At Risk"
              value={String(data.objectsAtRisk)}
              icon={ShieldAlert}
              accent={data.objectsAtRisk > 0 ? "warning" : "healthy"}
            />
            <MetricCard label="Total Replicas" value={String(data.totalReplicas)} icon={GitBranch} />
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card padding="lg" className="lg:col-span-1">
              <CardTitle>Distribution by node</CardTitle>
              <CardDescription className="mt-1 mb-4">Healthy replicas placed per node</CardDescription>
              <div className="flex flex-col gap-2.5">
                {data.replicaDistribution.map((d) => (
                  <div
                    key={d.node}
                    className="flex items-center justify-between rounded-md border border-base-border bg-base-surface2/40 px-3 py-2.5"
                  >
                    <span className="font-mono text-sm text-text-primary">{d.node}</span>
                    <span className="font-mono text-sm text-text-secondary">{d.replicaCount}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card padding="none" className="overflow-hidden lg:col-span-2">
              <div className="border-b border-base-border p-5">
                <CardTitle>Objects</CardTitle>
                <CardDescription className="mt-1">Desired vs. healthy replicas per object</CardDescription>
              </div>
              {data.objects.length === 0 ? (
                <div className="p-5 text-sm text-text-muted">No objects uploaded yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-base-border text-xs text-text-secondary">
                        <th className="px-4 py-3 font-medium">Object</th>
                        <th className="px-4 py-3 font-medium">Desired</th>
                        <th className="px-4 py-3 font-medium">Healthy</th>
                        <th className="px-4 py-3 font-medium">Missing</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.objects.map((o) => (
                        <tr key={o.objectId} className="border-b border-base-border last:border-0">
                          <td className="px-4 py-3 font-mono text-text-primary">{o.name}</td>
                          <td className="px-4 py-3 font-mono text-text-secondary">{o.desiredReplicas}</td>
                          <td className="px-4 py-3 font-mono text-text-secondary">{o.healthyReplicas}</td>
                          <td className="px-4 py-3 font-mono text-text-secondary">{o.missingReplicas}</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={toStatusKind(o.status)} label={o.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
