const fs = require("fs/promises");
const path = require("path");
const { query } = require("../config/database");
const { ApiError } = require("../middleware/errorHandler");
const { recordActivity } = require("./activityService");

const STORAGE_ROOT = process.env.STORAGE_ROOT || "storage";

function nodeDir(nodeName) {
  return path.join(process.cwd(), STORAGE_ROOT, nodeName);
}

/** Make sure storage/node-1..node-4 exist on disk. */
async function ensureNodeDirectories(names = ["node-1", "node-2", "node-3", "node-4"]) {
  for (const name of names) {
    await fs.mkdir(nodeDir(name), { recursive: true });
  }
}

async function listNodes() {
  const { rows } = await query(
    `SELECT n.*,
            COALESCE(r.replica_count, 0)::int AS replica_count
       FROM nodes n
       LEFT JOIN (
         SELECT node_id, COUNT(*) AS replica_count
           FROM replicas
          WHERE status IN ('HEALTHY', 'VERIFIED')
          GROUP BY node_id
       ) r ON r.node_id = n.id
      ORDER BY n.node_name ASC`
  );
  return rows;
}

async function getNode(id) {
  const { rows } = await query("SELECT * FROM nodes WHERE id = $1", [id]);
  if (!rows[0]) throw new ApiError(404, "Node not found");
  return rows[0];
}

async function getHealthyNodes() {
  const { rows } = await query("SELECT * FROM nodes WHERE status = 'HEALTHY' ORDER BY storage_used ASC");
  return rows;
}

async function failNode(id) {
  const node = await getNode(id);
  if (node.status === "FAILED") {
    throw new ApiError(409, "Node is already marked as FAILED");
  }

  const { rows } = await query(
    `UPDATE nodes SET status = 'FAILED' WHERE id = $1 RETURNING *`,
    [id]
  );

  // Any replica physically living on this node is no longer healthy.
  await query(
    `UPDATE replicas SET status = 'UNAVAILABLE' WHERE node_id = $1 AND status IN ('HEALTHY', 'VERIFIED')`,
    [id]
  );

  await recordActivity({
    eventType: "NODE_FAILED",
    message: `${node.node_name} was marked FAILED (simulated failure)`,
    nodeId: id,
  });

  return rows[0];
}

async function recoverNode(id) {
  const node = await getNode(id);
  if (node.status !== "FAILED" && node.status !== "DEGRADED") {
    throw new ApiError(409, "Node is not in a failed/degraded state");
  }

  const { rows } = await query(
    `UPDATE nodes SET status = 'RECOVERING', last_heartbeat = now() WHERE id = $1 RETURNING *`,
    [id]
  );

  // Replicas on this node go back to being considered, but as REPAIRING /
  // unverified until integrity checks confirm they're intact - they do NOT
  // automatically become HEALTHY.
  await query(
    `UPDATE replicas SET status = 'REPAIRING' WHERE node_id = $1 AND status = 'UNAVAILABLE'`,
    [id]
  );

  await recordActivity({
    eventType: "NODE_RECOVERED",
    message: `${node.node_name} marked RECOVERING - replicas pending integrity re-verification`,
    nodeId: id,
  });

  // Flip to HEALTHY once marked recovering (simple prototype: recovery is
  // immediate at the node level, replica-level trust must still be
  // re-earned via integrity verification).
  const final = await query(
    `UPDATE nodes SET status = 'HEALTHY' WHERE id = $1 RETURNING *`,
    [id]
  );

  return final.rows[0];
}

async function touchHeartbeat(id) {
  await query(`UPDATE nodes SET last_heartbeat = now() WHERE id = $1`, [id]);
}

async function adjustStorageUsed(nodeId, deltaBytes, client = null) {
  const runner = client || { query };
  await runner.query(
    `UPDATE nodes SET storage_used = GREATEST(storage_used + $2, 0) WHERE id = $1`,
    [nodeId, deltaBytes]
  );
}

module.exports = {
  STORAGE_ROOT,
  nodeDir,
  ensureNodeDirectories,
  listNodes,
  getNode,
  getHealthyNodes,
  failNode,
  recoverNode,
  touchHeartbeat,
  adjustStorageUsed,
};
