const { query } = require("../config/database");
const { DEFAULT_REPLICATION_FACTOR } = require("./objectService");

/**
 * For every object, compute desired vs healthy vs missing replicas.
 * A replica counts as healthy only if its own status is HEALTHY/VERIFIED
 * AND the node it lives on is not FAILED.
 */
async function getReplicationOverview() {
  const { rows: objects } = await query(
    `SELECT o.id, o.object_name, o.replication_factor, o.status,
            COUNT(r.*) FILTER (
              WHERE r.status IN ('HEALTHY', 'VERIFIED') AND n.status != 'FAILED'
            )::int AS healthy_replicas,
            COUNT(r.*)::int AS total_replicas
       FROM objects o
       LEFT JOIN replicas r ON r.object_id = o.id
       LEFT JOIN nodes n ON n.id = r.node_id
      GROUP BY o.id
      ORDER BY o.created_at DESC`
  );

  const perObject = objects.map((o) => ({
    objectId: o.id,
    name: o.object_name,
    desiredReplicas: o.replication_factor,
    healthyReplicas: o.healthy_replicas,
    missingReplicas: Math.max(o.replication_factor - o.healthy_replicas, 0),
    status: o.status,
  }));

  const { rows: replicaCounts } = await query(
    `SELECT
        COUNT(*)::int AS total_replicas,
        COUNT(*) FILTER (WHERE r.status IN ('HEALTHY', 'VERIFIED') AND n.status != 'FAILED')::int AS healthy_replicas
       FROM replicas r
       JOIN nodes n ON n.id = r.node_id`
  );

  const { rows: distributionRows } = await query(
    `SELECT n.node_name,
            COUNT(r.*)::int AS replica_count
       FROM nodes n
       LEFT JOIN replicas r ON r.node_id = n.id AND r.status IN ('HEALTHY', 'VERIFIED')
      GROUP BY n.node_name
      ORDER BY n.node_name ASC`
  );

  const objectsAtRisk = perObject.filter((o) => o.missingReplicas > 0).length;

  return {
    replicationFactor: DEFAULT_REPLICATION_FACTOR,
    totalReplicas: replicaCounts[0].total_replicas,
    healthyReplicas: replicaCounts[0].healthy_replicas,
    objectsAtRisk,
    replicaDistribution: distributionRows.map((d) => ({
      node: d.node_name,
      replicaCount: d.replica_count,
    })),
    objects: perObject,
  };
}

/**
 * Scan all objects, mark AT_RISK ones, and return the list of object IDs
 * that need a repair triggered.
 */
async function detectAtRiskObjects() {
  const overview = await getReplicationOverview();
  const atRisk = overview.objects.filter((o) => o.missingReplicas > 0);

  for (const o of atRisk) {
    await query(`UPDATE objects SET status = 'AT_RISK' WHERE id = $1 AND status != 'AT_RISK'`, [
      o.objectId,
    ]);
  }

  const healthyAgain = overview.objects.filter((o) => o.missingReplicas === 0);
  for (const o of healthyAgain) {
    await query(
      `UPDATE objects SET status = 'HEALTHY' WHERE id = $1 AND status = 'AT_RISK'`,
      [o.objectId]
    );
  }

  return atRisk;
}

module.exports = { getReplicationOverview, detectAtRiskObjects };
