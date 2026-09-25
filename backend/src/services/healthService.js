const { query } = require("../config/database");
const { DEFAULT_REPLICATION_FACTOR } = require("./objectService");

async function getClusterMetrics() {
  const { rows: objectStats } = await query(
    `SELECT COUNT(*)::int AS total_objects,
            COALESCE(SUM(size), 0)::bigint AS total_storage,
            COUNT(*) FILTER (WHERE status = 'AT_RISK')::int AS objects_at_risk
       FROM objects`
  );

  const { rows: nodeStats } = await query(
    `SELECT COUNT(*)::int AS total_nodes,
            COUNT(*) FILTER (WHERE status = 'HEALTHY')::int AS healthy_nodes,
            COALESCE(SUM(storage_capacity), 0)::bigint AS storage_capacity,
            COALESCE(SUM(storage_used), 0)::bigint AS storage_used
       FROM nodes`
  );

  const { rows: replicaStats } = await query(
    `SELECT COUNT(*) FILTER (WHERE r.status IN ('HEALTHY','VERIFIED') AND n.status != 'FAILED')::int AS healthy_replicas,
            COUNT(*)::int AS total_replicas,
            COUNT(*) FILTER (WHERE r.status = 'VERIFIED')::int AS verified_replicas,
            COUNT(*) FILTER (WHERE r.status = 'CORRUPTED')::int AS corrupted_replicas
       FROM replicas r
       JOIN nodes n ON n.id = r.node_id`
  );

  const { rows: repairStats } = await query(
    `SELECT COUNT(*) FILTER (WHERE status IN ('QUEUED','RUNNING'))::int AS active_repairs,
            COUNT(*) FILTER (WHERE status = 'COMPLETED')::int AS completed_repairs
       FROM repairs`
  );

  const totalChecked = replicaStats[0].verified_replicas + replicaStats[0].corrupted_replicas;
  const integrityPercentage =
    totalChecked > 0
      ? Math.round((replicaStats[0].verified_replicas / totalChecked) * 1000) / 10
      : 100;

  return {
    totalObjects: objectStats[0].total_objects,
    totalStorage: Number(objectStats[0].total_storage),
    storageCapacity: Number(nodeStats[0].storage_capacity),
    storageUsed: Number(nodeStats[0].storage_used),
    healthyNodes: nodeStats[0].healthy_nodes,
    totalNodes: nodeStats[0].total_nodes,
    replicationFactor: DEFAULT_REPLICATION_FACTOR,
    healthyReplicas: replicaStats[0].healthy_replicas,
    totalReplicas: replicaStats[0].total_replicas,
    objectsAtRisk: objectStats[0].objects_at_risk,
    activeRepairs: repairStats[0].active_repairs,
    completedRepairs: repairStats[0].completed_repairs,
    integrityPercentage,
  };
}

module.exports = { getClusterMetrics };
