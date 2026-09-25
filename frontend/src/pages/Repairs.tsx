import { useEffect, useState } from "react";
import { Wrench } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { api, timeAgo, type Repair } from "@/lib/api";
import { toStatusKind } from "@/lib/status";

export function Repairs() {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    try {
      const res = await api.listRepairs();
      setRepairs(res.repairs);
      setError(null);
    } catch (err: any) {
      setError(err.message ?? "Failed to load repairs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  async function handleRetry(id: string) {
    setBusyId(id);
    try {
      await api.retryRepair(id);
      await load();
    } catch (err: any) {
      setError(err.message ?? "Retry failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Repairs"
        description="Review and queue repair jobs for under-replicated or corrupted objects."
      />

      {error && (
        <Card padding="md" className="mb-6 border-status-failed/40 bg-status-failedDim">
          <span className="text-sm text-status-failed">{error}</span>
        </Card>
      )}

      {!loading && repairs.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No repairs pending"
          description="When a replica falls out of sync or fails a check, a repair job will appear here for review."
        />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-base-border text-xs text-text-secondary">
                  <th className="px-4 py-3 font-medium">Object</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Target</th>
                  <th className="px-4 py-3 font-medium">Progress</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Started</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {repairs.map((r) => (
                  <tr key={r.id} className="border-b border-base-border last:border-0">
                    <td className="px-4 py-3 font-mono text-text-primary">{r.object_name}</td>
                    <td className="px-4 py-3 font-mono text-text-secondary">{r.source_node_name ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-text-secondary">{r.target_node_name ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-text-secondary">{r.progress}%</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={toStatusKind(r.status)} label={r.status} />
                      {r.status === "FAILED" && r.error_message && (
                        <p className="mt-1 max-w-[220px] text-[11px] text-status-failed">{r.error_message}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">
                      {r.started_at ? timeAgo(r.started_at) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.status === "FAILED" && (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={busyId === r.id}
                          onClick={() => handleRetry(r.id)}
                        >
                          {busyId === r.id ? "Retrying…" : "Retry"}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
