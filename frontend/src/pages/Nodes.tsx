import { useEffect, useState } from "react";
import { Server } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { api, formatBytes, timeAgo, type VaultNode } from "@/lib/api";
import { toStatusKind } from "@/lib/status";

export function Nodes() {
  const [nodes, setNodes] = useState<VaultNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await api.listNodes();
      setNodes(res.nodes);
      setError(null);
    } catch (err: any) {
      setError(err.message ?? "Failed to load nodes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, []);

  async function handleFail(id: string) {
    setBusyId(id);
    try {
      await api.failNode(id);
      await load();
    } catch (err: any) {
      setError(err.message ?? "Failed to fail node");
    } finally {
      setBusyId(null);
    }
  }

  async function handleRecover(id: string) {
    setBusyId(id);
    try {
      await api.recoverNode(id);
      await load();
    } catch (err: any) {
      setError(err.message ?? "Failed to recover node");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Nodes"
        description="Monitor the health, capacity and uptime of every storage node in the cluster."
      />

      {error && (
        <Card padding="md" className="mb-6 border-status-failed/40 bg-status-failedDim">
          <span className="text-sm text-status-failed">{error}</span>
        </Card>
      )}

      {!loading && nodes.length === 0 ? (
        <EmptyState
          icon={Server}
          title="No nodes registered"
          description="Nodes are seeded automatically the first time the backend starts. Make sure it's running and reachable."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {nodes.map((node) => {
            const pct =
              node.storage_capacity > 0
                ? Math.min(100, (node.storage_used / node.storage_capacity) * 100)
                : 0;
            return (
              <Card key={node.id} padding="lg" className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-medium text-text-primary">{node.node_name}</span>
                  <StatusBadge status={toStatusKind(node.status)} label={node.status} />
                </div>

                <div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-base-border">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-text-muted">
                    {formatBytes(node.storage_used)} / {formatBytes(node.storage_capacity)}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span>{node.replica_count} replicas</span>
                  <span>Heartbeat {timeAgo(node.last_heartbeat)}</span>
                </div>

                <div className="flex gap-2">
                  {node.status === "FAILED" ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1"
                      disabled={busyId === node.id}
                      onClick={() => handleRecover(node.id)}
                    >
                      {busyId === node.id ? "Recovering…" : "Recover"}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="danger"
                      className="flex-1"
                      disabled={busyId === node.id}
                      onClick={() => handleFail(node.id)}
                    >
                      {busyId === node.id ? "Failing…" : "Simulate failure"}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
