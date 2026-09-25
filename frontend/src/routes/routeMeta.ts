export const ROUTE_META: Record<string, { title: string; breadcrumb: string[] }> = {
  "/dashboard": { title: "Dashboard", breadcrumb: ["Vault"] },
  "/objects": { title: "Objects", breadcrumb: ["Vault", "Storage"] },
  "/nodes": { title: "Nodes", breadcrumb: ["Vault", "Cluster"] },
  "/replication": { title: "Replication", breadcrumb: ["Vault", "Cluster"] },
  "/repairs": { title: "Repairs", breadcrumb: ["Vault", "Cluster"] },
  "/integrity": { title: "Integrity", breadcrumb: ["Vault", "Verification"] },
  "/analytics": { title: "Analytics", breadcrumb: ["Vault", "Insights"] },
  "/failure-lab": { title: "Failure Lab", breadcrumb: ["Vault", "Testing"] },
  "/activity": { title: "Activity", breadcrumb: ["Vault"] },
  "/settings": { title: "Settings", breadcrumb: ["Vault"] },
};
