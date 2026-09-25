const fs = require("fs/promises");
const path = require("path");
const { query } = require("../config/database");
const { ApiError } = require("../middleware/errorHandler");
const { checksumFile } = require("../utils/checksum");
const { nodeDir } = require("./nodeService");
const { recordActivity } = require("./activityService");
const { queueRepair } = require("./repairService");

/**
 * Verify every currently-healthy replica of an object against the
 * object's recorded checksum. Marks each replica VERIFIED or CORRUPTED.
 */
async function verifyObjectIntegrity(objectId) {
  const { rows: objRows } = await query("SELECT * FROM objects WHERE id = $1", [objectId]);
  const object = objRows[0];
  if (!object) throw new ApiError(404, "Object not found");

  const { rows: replicas } = await query(
    `SELECT r.*, n.node_name, n.status AS node_status
       FROM replicas r
       JOIN nodes n ON n.id = r.node_id
      WHERE r.object_id = $1
        AND n.status != 'FAILED'`,
    [objectId]
  );

  const results = [];
  let anyCorrupted = false;

  for (const replica of replicas) {
    const filePath = path.join(nodeDir(replica.node_name), object.id);
    let actualChecksum;
    try {
      actualChecksum = await checksumFile(filePath);
    } catch (err) {
      // File missing/unreadable - treat as corrupted/unavailable.
      await query(`UPDATE replicas SET status = 'UNAVAILABLE' WHERE id = $1`, [replica.id]);
      results.push({ node: replica.node_name, status: "UNAVAILABLE" });
      continue;
    }

    if (actualChecksum === object.checksum) {
      await query(`UPDATE replicas SET status = 'VERIFIED' WHERE id = $1`, [replica.id]);
      results.push({ node: replica.node_name, status: "VERIFIED" });
    } else {
      anyCorrupted = true;
      await query(`UPDATE replicas SET status = 'CORRUPTED' WHERE id = $1`, [replica.id]);
      results.push({ node: replica.node_name, status: "CORRUPTED" });

      await recordActivity({
        eventType: "INTEGRITY_MISMATCH",
        message: `Checksum mismatch for ${object.object_name} on ${replica.node_name}`,
        objectId: object.id,
        nodeId: replica.node_id,
      });
    }
  }

  await recordActivity({
    eventType: "INTEGRITY_VERIFIED",
    message: `Integrity check ran for ${object.object_name}: ${
      results.filter((r) => r.status === "VERIFIED").length
    }/${results.length} replicas verified`,
    objectId: object.id,
  });

  if (anyCorrupted) {
    await queueRepair(object.id);
  }

  return {
    object: object.object_name,
    objectId: object.id,
    expectedChecksum: object.checksum,
    replicas: results,
  };
}

/**
 * Demo-only: intentionally corrupt a replica's on-disk bytes so its
 * checksum no longer matches, then trigger verification + repair.
 */
async function corruptReplica(objectId, nodeId) {
  const { rows: objRows } = await query("SELECT * FROM objects WHERE id = $1", [objectId]);
  const object = objRows[0];
  if (!object) throw new ApiError(404, "Object not found");

  const { rows: nodeRows } = await query("SELECT * FROM nodes WHERE id = $1", [nodeId]);
  const node = nodeRows[0];
  if (!node) throw new ApiError(404, "Node not found");

  const { rows: replicaRows } = await query(
    "SELECT * FROM replicas WHERE object_id = $1 AND node_id = $2",
    [objectId, nodeId]
  );
  const replica = replicaRows[0];
  if (!replica) throw new ApiError(404, "No replica of this object exists on that node");

  const filePath = path.join(nodeDir(node.node_name), object.id);

  try {
    // Flip some bytes so the checksum no longer matches.
    const buffer = await fs.readFile(filePath);
    const corrupted = Buffer.from(buffer);
    const flipCount = Math.max(1, Math.floor(corrupted.length * 0.01));
    for (let i = 0; i < flipCount; i++) {
      const idx = Math.floor(Math.random() * corrupted.length);
      corrupted[idx] = corrupted[idx] ^ 0xff;
    }
    await fs.writeFile(filePath, corrupted);
  } catch (err) {
    throw new ApiError(500, `Failed to corrupt replica file: ${err.message}`);
  }

  await query(`UPDATE replicas SET status = 'CORRUPTED' WHERE id = $1`, [replica.id]);

  await recordActivity({
    eventType: "REPLICA_CORRUPTED",
    message: `Replica of ${object.object_name} on ${node.node_name} was intentionally corrupted (simulation)`,
    objectId: object.id,
    nodeId: node.id,
  });

  // Trigger verification (will detect the mismatch) then repair.
  const verification = await verifyObjectIntegrity(object.id);

  return verification;
}

module.exports = { verifyObjectIntegrity, corruptReplica };
