// Thin fetch client for the Vault backend.
// Configure the backend URL via VITE_API_URL (defaults to localhost:3000).

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers:
      options.body instanceof FormData
        ? undefined
        : { "Content-Type": "application/json" },
    ...options,
  });

  let body: any = null;
  try {
    body = await res.json();
  } catch {
    // no body / not JSON (e.g. binary download)
  }

  if (!res.ok) {
    throw new ApiError(res.status, body?.error ?? res.statusText);
  }

  return body as T;
}

// ---------- Types ----------

export interface VaultObjectSummary {
  id: string;
  name: string;
  size: number;
  checksum: string;
  version: number;
  replicationFactor: number;
  healthyReplicaCount: number;
  status: string;
  createdAt: string;
}

export interface VaultReplica {
  id: string;
  node: string;
  nodeId: string;
  nodeStatus: string;
  status: string;
  version: number;
  checksum: string;
  updatedAt: string;
}

export interface VaultObjectDetails {
  id: string;
  name: string;
  size: number;
  checksum: string;
  version: number;
  replicationFactor: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  integrityStatus: string;
  healthyReplicaCount: number;
  replicas: VaultReplica[];
}

export interface VaultNode {
  id: string;
  node_name: string;
  status: "HEALTHY" | "DEGRADED" | "FAILED" | "RECOVERING";
  storage_capacity: number;
  storage_used: number;
  last_heartbeat: string;
  replica_count: number;
}

export interface ReplicationOverview {
  replicationFactor: number;
  totalReplicas: number;
  healthyReplicas: number;
  objectsAtRisk: number;
  replicaDistribution: { node: string; replicaCount: number }[];
  objects: {
    objectId: string;
    name: string;
    desiredReplicas: number;
    healthyReplicas: number;
    missingReplicas: number;
    status: string;
  }[];
}

export interface Repair {
  id: string;
  object_id: string;
  object_name: string;
  source_node_name: string | null;
  target_node_name: string | null;
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
  progress: number;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface ActivityEvent {
  id: string;
  event_type: string;
  message: string;
  object_id: string | null;
  node_id: string | null;
  object_name: string | null;
  node_name: string | null;
  created_at: string;
}

export interface ClusterMetrics {
  totalObjects: number;
  totalStorage: number;
  storageCapacity: number;
  storageUsed: number;
  healthyNodes: number;
  totalNodes: number;
  replicationFactor: number;
  healthyReplicas: number;
  totalReplicas: number;
  objectsAtRisk: number;
  activeRepairs: number;
  completedRepairs: number;
  integrityPercentage: number;
}

export interface IntegrityResult {
  object: string;
  objectId: string;
  expectedChecksum: string;
  replicas: { node: string; status: string }[];
}

// ---------- API calls ----------

export const api = {
  health: () => request<{ status: string; service: string }>("/health"),

  // Objects
  listObjects: () => request<{ objects: VaultObjectSummary[] }>("/objects"),
  getObject: (id: string) => request<{ object: VaultObjectDetails }>(`/objects/${id}`),
  uploadObject: (file: File, replicationFactor?: number) => {
    const form = new FormData();
    form.append("file", file);
    if (replicationFactor) form.append("replicationFactor", String(replicationFactor));
    return request<{ id: string; name: string; size: number; checksum: string; replicationFactor: number; status: string; replicas: string[] }>(
      "/objects/upload",
      { method: "POST", body: form }
    );
  },
  downloadUrl: (id: string) => `${API_URL}/objects/${id}/download`,

  // Nodes
  listNodes: () => request<{ nodes: VaultNode[] }>("/nodes"),
  getNode: (id: string) => request<{ node: VaultNode }>(`/nodes/${id}`),
  failNode: (id: string) =>
    request<{ node: VaultNode; objectsAtRisk: number }>(`/nodes/${id}/fail`, { method: "POST" }),
  recoverNode: (id: string) => request<{ node: VaultNode }>(`/nodes/${id}/recover`, { method: "POST" }),

  // Replication
  getReplication: () => request<ReplicationOverview>("/replication"),

  // Repairs
  listRepairs: () => request<{ repairs: Repair[] }>("/repairs"),
  getRepair: (id: string) => request<{ repair: Repair }>(`/repairs/${id}`),
  retryRepair: (id: string) => request<{ repair: Repair }>(`/repairs/${id}/retry`, { method: "POST" }),
  triggerRepair: (objectId: string) =>
    request<{ repair: Repair }>(`/repairs/trigger/${objectId}`, { method: "POST" }),

  // Integrity
  verifyIntegrity: (objectId: string) =>
    request<IntegrityResult>(`/integrity/verify/${objectId}`, { method: "POST" }),
  corruptReplica: (objectId: string, nodeId: string) =>
    request<IntegrityResult>(`/integrity/corrupt/${objectId}/${nodeId}`, { method: "POST" }),

  // Activity
  listActivity: (limit = 50) => request<{ activity: ActivityEvent[] }>(`/activity?limit=${limit}`),

  // Metrics
  getMetrics: () => request<{ metrics: ClusterMetrics }>("/metrics"),
};

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diffMs / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
