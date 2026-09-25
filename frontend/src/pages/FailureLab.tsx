import { useEffect, useState } from "react";
import { FlaskConical } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  api,
  timeAgo,
  type VaultNode,
  type VaultObjectSummary,
  type ActivityEvent,
} from "@/lib/api";
import { toStatusKind } from "@/lib/status";

export function FailureLab() {
  const [nodes, setNodes] = useState<VaultNode[]>([]);
  const [objects, setObjects] = useState<VaultObjectSummary[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [log, setLog] = useState<ActivityEvent[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const [n, o, a] = await Promise.all([api.listNodes(), api.listObjects(), api.listActivity(10)]);
    setNodes(n.nodes);
    setObjects(o.objects);
    setLog(a.activity);
    if (!selectedObjectId && o.objects[0]) setSelectedObjectId(o.objects[0].id);
    if (!selectedNodeId && n.nodes[0]) setSelectedNodeId(n.nodes[0].id);
  }

  useEffect(() => {
    refresh().catch((err) => setError(err.message ?? "Failed to load lab data"));
    const interval = setInterval(() => refresh().catch(() => {}), 6000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run(action: string, fn: () => Promise<unknown>) {
    setBusy(action);
    setError(null);
    try {
      await fn();
      await refresh();
    } catch (err: any) {
      setError(err.message ?? `${action} failed`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Failure Lab"
        description="Simulate node outages and corruption to test how the cluster detects and heals itself."
      />

      {error && (
        <Card padding="md" className="mb-6 border-status-failed/40 bg-status-failedDim">
          <span className="text-sm text-status-failed">{error}</span>
        </Card>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card padding="lg">
          <CardTitle>Node failure / recovery</CardTitle>
          <CardDescription className="mt-1 mb-4">
            Fail a node to watch replicas go unavailable and repairs kick off automatically.
          </CardDescription>

          <select
            value={selectedNodeId}
            onChange={(e) => setSelectedNodeId(e.target.value)}
            className="mb-4 h-9 w-full rounded-md border border-base-border bg-base-surface2 px-3 text-sm text-text-primary"
          >
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.node_name} — {n.status}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <Button
              variant="danger"
              size="sm"
              className="flex-1"
              disabled={!selectedNodeId || busy === "fail"}
              onClick={() => run("fail", () => api.failNode(selectedNodeId))}
            >
              {busy === "fail" ? "Failing…" : "Fail node"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              disabled={!selectedNodeId || busy === "recover"}
              onClick={() => run("recover", () => api.recoverNode(selectedNodeId))}
            >
              {busy === "recover" ? "Recovering…" : "Recover node"}
            </Button>
          </div>
        </Card>

        <Card padding="lg">
          <CardTitle>Corruption / integrity / repair</CardTitle>
          <CardDescription className="mt-1 mb-4">
            Corrupt a specific replica, then verify integrity or force a repair for an object.
          </CardDescription>

          <select
            value={selectedObjectId}
            onChange={(e) => setSelectedObjectId(e.target.value)}
            className="mb-3 h-9 w-full rounded-md border border-base-border bg-base-surface2 px-3 text-sm text-text-primary"
          >
            {objects.length === 0 && <option value="">No objects uploaded yet</option>}
            {objects.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="danger"
              size="sm"
              disabled={!selectedObjectId || !selectedNodeId || busy === "corrupt"}
              onClick={() =>
                run("corrupt", () => api.corruptReplica(selectedObjectId, selectedNodeId))
              }
            >
              {busy === "corrupt" ? "Corrupting…" : "Corrupt replica"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!selectedObjectId || busy === "verify"}
              onClick={() => run("verify", () => api.verifyIntegrity(selectedObjectId))}
            >
              {busy === "verify" ? "Verifying…" : "Verify integrity"}
            </Button>
            <Button
              size="sm"
              disabled={!selectedObjectId || busy === "repair"}
              onClick={() => run("repair", () => api.triggerRepair(selectedObjectId))}
            >
              {busy === "repair" ? "Triggering…" : "Trigger repair"}
            </Button>
          </div>
        </Card>
      </div>

      <Card padding="lg">
        <CardTitle>Live event log</CardTitle>
        <CardDescription className="mt-1 mb-4">Most recent cluster events, newest first</CardDescription>
        {log.length === 0 ? (
          <div className="flex min-h-[160px] flex-col items-center justify-center text-center text-sm text-text-muted">
            <FlaskConical className="mb-3 h-6 w-6 text-brand" strokeWidth={1.75} />
            No simulations run yet. Try failing a node or corrupting a replica above.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {log.map((e) => {
              const isBad = e.event_type.includes("FAIL") || e.event_type.includes("MISMATCH") || e.event_type.includes("CORRUPT");
              return (
                <div
                  key={e.id}
                  className="flex items-center justify-between rounded-md border border-base-border bg-base-surface2/40 px-3 py-2.5"
                >
                  <div className="flex flex-col">
                    <span className="text-sm text-text-primary">{e.event_type.replace(/_/g, " ")}</span>
                    <span className="text-xs text-text-secondary">{e.message}</span>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StatusBadge status={toStatusKind(isBad ? "FAILED" : "HEALTHY")} />
                    <span className="font-mono text-[11px] text-text-muted">{timeAgo(e.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
