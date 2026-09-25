import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { api, type VaultObjectSummary, type IntegrityResult } from "@/lib/api";
import { toStatusKind } from "@/lib/status";

export function Integrity() {
  const [objects, setObjects] = useState<VaultObjectSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [result, setResult] = useState<IntegrityResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listObjects()
      .then((res) => {
        setObjects(res.objects);
        if (res.objects[0]) setSelectedId(res.objects[0].id);
      })
      .catch((err) => setError(err.message ?? "Failed to load objects"));
  }, []);

  async function runScan() {
    if (!selectedId) return;
    setScanning(true);
    setError(null);
    try {
      const res = await api.verifyIntegrity(selectedId);
      setResult(res);
    } catch (err: any) {
      setError(err.message ?? "Verification failed");
    } finally {
      setScanning(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Integrity"
        description="Verify checksums across stored objects and surface any corruption before it spreads."
        actions={
          objects.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="h-9 rounded-md border border-base-border bg-base-surface2 px-3 text-sm text-text-primary"
              >
                {objects.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
              <Button size="sm" onClick={runScan} disabled={scanning}>
                {scanning ? "Scanning…" : "Run scan"}
              </Button>
            </div>
          )
        }
      />

      {error && (
        <Card padding="md" className="mb-6 border-status-failed/40 bg-status-failedDim">
          <span className="text-sm text-status-failed">{error}</span>
        </Card>
      )}

      {objects.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No integrity scans run yet"
          description="Upload an object first, then run a checksum verification pass against it."
        />
      ) : !result ? (
        <EmptyState
          icon={ShieldCheck}
          title="No integrity scans run yet"
          description="Pick an object above and run a checksum verification pass to confirm every replica matches its recorded hash."
          actionLabel="Run scan"
          onAction={runScan}
        />
      ) : (
        <Card padding="lg">
          <CardTitle>{result.object}</CardTitle>
          <CardDescription className="mt-1 mb-4 font-mono text-xs break-all">
            Expected checksum: {result.expectedChecksum}
          </CardDescription>
          <div className="flex flex-col gap-2.5">
            {result.replicas.map((r) => (
              <div
                key={r.node}
                className="flex items-center justify-between rounded-md border border-base-border bg-base-surface2/40 px-3 py-2.5"
              >
                <span className="font-mono text-sm text-text-primary">{r.node}</span>
                <StatusBadge status={toStatusKind(r.status)} label={r.status} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
