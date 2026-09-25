const fs = require("fs/promises");
const path = require("path");
const { query, withTransaction } = require("../config/database");
const { ApiError } = require("../middleware/errorHandler");
const { checksumFile } = require("../utils/checksum");
const { nodeDir, adjustStorageUsed } = require("./nodeService");
const { recordActivity } = require("./activityService");

/**
 * Queue a repair for `objectId` if one isn't already active.
 * Returns the existing active repair if there is one (idempotent).
 */
async function queueRepair(objectId) {
  const { rows: active } = await query(
    `SELECT * FROM repairs WHERE object_id = $1 AND status IN ('QUEUED', 'RUNNING')`,
    [objectId]
  );
  if (active[0]) {
    return active[0]; // Already in flight - idempotent no-op.
  }

  const { rows } = await query(
    `INSERT INTO repairs (object_id, status, progress)
     VALUES ($1, 'QUEUED', 0)
     RETURNING *`,
    [objectId]
  );

  await recordActivity({
    eventType: "REPAIR_STARTED",
    message: `Repair queued for object ${objectId}`,
    objectId,
  });

  // Fire and forget - run it right away for the prototype (no real job queue).
  runRepair(rows[0].id).catch(() => {
    /* errors are persisted onto the repair row itself */
  });

  return rows[0];
}

/**
 * Execute a queued repair: find a healthy source replica, pick a healthy
 * target node that doesn't already have the object, copy the bytes,
 * verify checksum, and update everything.
 */
async function runRepair(repairId) {
  const { rows: repairRows } = await query("SELECT * FROM repairs WHERE id = $1", [repairId]);
  const repair = repairRows[0];
  if (!repair) throw new ApiError(404, "Repair not found");

  await query(
    `UPDATE repairs SET status = 'RUNNING', progress = 10, started_at = now() WHERE id = $1`,
    [repairId]
  );

  try {
    const { rows: objRows } = await query("SELECT * FROM objects WHERE id = $1", [repair.object_id]);
    const object = objRows[0];
    if (!object) throw new Error("Object no longer exists");

    // 1. Find a healthy source replica.
    const { rows: sourceCandidates } = await query(
      `SELECT r.*, n.node_name
         FROM replicas r
         JOIN nodes n ON n.id = r.node_id
        WHERE r.object_id = $1
          AND r.status IN ('HEALTHY', 'VERIFIED')
          AND n.status != 'FAILED'
        LIMIT 1`,
      [object.id]
    );
    const source = sourceCandidates[0];
    if (!source) {
      throw new Error("No healthy source replica available to repair from");
    }

    // 2. Select a healthy node that doesn't already have this object.
    const { rows: targetCandidates } = await query(
      `SELECT n.* FROM nodes n
        WHERE n.status = 'HEALTHY'
          AND n.id NOT IN (SELECT node_id FROM replicas WHERE object_id = $1)
        ORDER BY n.storage_used ASC
        LIMIT 1`,
      [object.id]
    );
    const target = targetCandidates[0];
    if (!target) {
      throw new Error("No healthy target node available without an existing replica");
    }

    await query(`UPDATE repairs SET source_node_id = $1, target_node_id = $2, progress = 30 WHERE id = $3`, [
      source.node_id,
      target.id,
      repairId,
    ]);

    // 3. Copy the object bytes from source node dir to target node dir.
    const sourcePath = path.join(nodeDir(source.node_name), object.id);
    const targetPath = path.join(nodeDir(target.node_name), object.id);
    const bytes = await fs.readFile(sourcePath);
    await fs.writeFile(targetPath, bytes);

    await query(`UPDATE repairs SET progress = 70 WHERE id = $1`, [repairId]);

    // 4/5. Checksum the new replica and compare against the object's checksum.
    const newChecksum = await checksumFile(targetPath);

    if (newChecksum !== object.checksum) {
      throw new Error(
        `Checksum mismatch after repair copy: expected ${object.checksum}, got ${newChecksum}`
      );
    }

    await withTransaction(async (client) => {
      // 6/7. Mark the new replica HEALTHY, create/refresh its row.
      await client.query(
        `INSERT INTO replicas (object_id, node_id, version, checksum, status)
         VALUES ($1, $2, $3, $4, 'HEALTHY')
         ON CONFLICT (object_id, node_id)
         DO UPDATE SET status = 'HEALTHY', checksum = EXCLUDED.checksum, version = EXCLUDED.version`,
        [object.id, target.id, object.version, newChecksum]
      );

      await adjustStorageUsed(target.id, bytes.length, client);

      // 8. Mark repair COMPLETED.
      await client.query(
        `UPDATE repairs SET status = 'COMPLETED', progress = 100, completed_at = now() WHERE id = $1`,
        [repairId]
      );

      // 9. Re-evaluate object status back to HEALTHY if replication level restored.
      const { rows: healthyCountRows } = await client.query(
        `SELECT COUNT(*)::int AS c
           FROM replicas r
           JOIN nodes n ON n.id = r.node_id
          WHERE r.object_id = $1 AND r.status IN ('HEALTHY','VERIFIED') AND n.status != 'FAILED'`,
        [object.id]
      );
      if (healthyCountRows[0].c >= object.replication_factor) {
        await client.query(`UPDATE objects SET status = 'HEALTHY' WHERE id = $1`, [object.id]);
      }

      // 10. Record activity event.
      await recordActivity(
        {
          eventType: "REPAIR_COMPLETED",
          message: `Repaired ${object.object_name}: copied from ${source.node_name} to ${target.node_name}`,
          objectId: object.id,
          nodeId: target.id,
        },
        client
      );
    });

    return { status: "COMPLETED" };
  } catch (err) {
    await query(
      `UPDATE repairs SET status = 'FAILED', error_message = $2, completed_at = now() WHERE id = $1`,
      [repairId, err.message]
    );
    await recordActivity({
      eventType: "REPAIR_FAILED",
      message: `Repair ${repairId} failed: ${err.message}`,
      objectId: repair.object_id,
    });
    throw err;
  }
}

async function listRepairs() {
  const { rows } = await query(
    `SELECT r.*, o.object_name,
            sn.node_name AS source_node_name,
            tn.node_name AS target_node_name
       FROM repairs r
       JOIN objects o ON o.id = r.object_id
       LEFT JOIN nodes sn ON sn.id = r.source_node_id
       LEFT JOIN nodes tn ON tn.id = r.target_node_id
      ORDER BY r.created_at DESC`
  );
  return rows;
}

async function getRepair(id) {
  const { rows } = await query(
    `SELECT r.*, o.object_name,
            sn.node_name AS source_node_name,
            tn.node_name AS target_node_name
       FROM repairs r
       JOIN objects o ON o.id = r.object_id
       LEFT JOIN nodes sn ON sn.id = r.source_node_id
       LEFT JOIN nodes tn ON tn.id = r.target_node_id
      WHERE r.id = $1`,
    [id]
  );
  if (!rows[0]) throw new ApiError(404, "Repair not found");
  return rows[0];
}

async function retryRepair(id) {
  const repair = await getRepair(id);
  if (repair.status !== "FAILED") {
    throw new ApiError(409, "Only FAILED repairs can be retried");
  }

  await query(
    `UPDATE repairs SET status = 'QUEUED', progress = 0, error_message = NULL, started_at = NULL, completed_at = NULL WHERE id = $1`,
    [id]
  );

  runRepair(id).catch(() => {});

  return getRepair(id);
}

module.exports = { queueRepair, runRepair, listRepairs, getRepair, retryRepair };
