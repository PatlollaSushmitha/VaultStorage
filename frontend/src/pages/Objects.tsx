import { useEffect, useRef, useState } from "react";
import { Boxes, Download } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { api, formatBytes, type VaultObjectSummary } from "@/lib/api";
import { toStatusKind } from "@/lib/status";

export function Objects() {
  const [objects, setObjects] = useState<VaultObjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    try {
      const res = await api.listObjects();
      setObjects(res.objects);
      setError(null);
    } catch (err: any) {
      setError(err.message ?? "Failed to load objects");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await api.uploadObject(file);
      await load();
    } catch (err: any) {
      setError(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div>
      <PageHeader
        title="Objects"
        description="Browse and manage every object stored across the cluster, including versions and replica placement."
        actions={
          <>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChosen}
              disabled={uploading}
            />
            <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? "Uploading…" : "Upload object"}
            </Button>
          </>
        }
      />

      {error && (
        <Card padding="md" className="mb-6 border-status-failed/40 bg-status-failedDim">
          <span className="text-sm text-status-failed">{error}</span>
        </Card>
      )}

      {!loading && objects.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="No objects indexed yet"
          description="Upload a file and it will be replicated across the cluster and appear here."
          actionLabel="Upload object"
          onAction={() => fileInputRef.current?.click()}
        />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-base-border text-xs text-text-secondary">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Size</th>
                  <th className="px-4 py-3 font-medium">Replicas</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {objects.map((o) => (
                  <tr key={o.id} className="border-b border-base-border last:border-0">
                    <td className="px-4 py-3 font-mono text-text-primary">{o.name}</td>
                    <td className="px-4 py-3 font-mono text-text-secondary">{formatBytes(o.size)}</td>
                    <td className="px-4 py-3 font-mono text-text-secondary">
                      {o.healthyReplicaCount}/{o.replicationFactor}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={toStatusKind(o.status)} label={o.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">
                      {new Date(o.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a href={api.downloadUrl(o.id)} download>
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </a>
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
