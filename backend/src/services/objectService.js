const fs = require("fs/promises");
const path = require("path");
const { query, withTransaction } = require("../config/database");
const { ApiError } = require("../middleware/errorHandler");
const { checksumBuffer, checksumFile } = require("../utils/checksum");
const { nodeDir, getHealthyNodes, adjustStorageUsed } = require("./nodeService");
const { recordActivity } = require("./activityService");

const DEFAULT_REPLICATION_FACTOR = parseInt(process.env.DEFAULT_REPLICATION_FACTOR || "3", 10);

/**
 * Upload a new object: hash it, persist metadata, pick N healthy nodes,
 * physically write the bytes into each node directory, and create replica
 * rows for each.
 */
async function uploadObject({ buffer, originalName, replicationFactor }) {
  if (!buffer || buffer.length === 0) {
    throw new ApiError(400, "Uploaded file is empty or missing");
  }

  const desiredReplicas = replicationFactor
    ? parseInt(replicationFactor, 10)
    : DEFAULT_REPLICATION_FACTOR;

  const checksum = checksumBuffer(buffer);
  const healthyNodes = await getHealthyNodes();

  if (healthyNodes.length === 0) {
    throw new ApiError(409, "No healthy nodes available to store the object");
  }

  const targetNodes = healthyNodes.slice(0, Math.min(desiredReplicas, healthyNodes.length));

  const result = await withTransaction(async (client) => {
    const objectInsert = await client.query(
      `INSERT INTO objects (object_name, size, checksum, version, replication_factor, status)
       VALUES ($1, $2, $3, 1, $4, 'HEALTHY')
       RETURNING *`,
      [originalName, buffer.length, checksum, desiredReplicas]
    );
    const object = objectInsert.rows[0];

    const replicas = [];
    for (const node of targetNodes) {
      // Physically write the file into this node's directory.
      const destPath = path.join(nodeDir(node.node_name), object.id);
      await fs.writeFile(destPath, buffer);

      const replicaInsert = await client.query(
        `INSERT INTO replicas (object_id, node_id, version, checksum, status)
         VALUES ($1, $2, 1, $3, 'HEALTHY')
         RETURNING *`,
        [object.id, node.id, checksum]
      );
      replicas.push({ ...replicaInsert.rows[0], node_name: node.node_name });

      await adjustStorageUsed(node.id, buffer.length, client);
    }

    if (targetNodes.length < desiredReplicas) {
      await client.query(`UPDATE objects SET status = 'AT_RISK' WHERE id = $1`, [object.id]);
      object.status = "AT_RISK";
    }

    await recordActivity(
      {
        eventType: "OBJECT_UPLOADED",
        message: `${originalName} uploaded (${buffer.length} bytes), ${replicas.length}/${desiredReplicas} replicas placed`,
        objectId: object.id,
      },
      client
    );

    for (const r of replicas) {
      await recordActivity(
        {
          eventType: "REPLICA_CREATED",
          message: `Replica of ${originalName} created on ${r.node_name}`,
          objectId: object.id,
          nodeId: r.node_id,
        },
        client
      );
    }

    return { object, replicas };
  });

  return {
    id: result.object.id,
    name: result.object.object_name,
    size: Number(result.object.size),
    checksum: result.object.checksum,
    version: result.object.version,
    replicationFactor: result.object.replication_factor,
    status: result.object.status,
    replicas: result.replicas.map((r) => r.node_name),
  };
}

async function listObjects() {
  const { rows } = await query(
    `SELECT o.*,
            COUNT(r.*) FILTER (WHERE r.status IN ('HEALTHY', 'VERIFIED'))::int AS healthy_replica_count
       FROM objects o
       LEFT JOIN replicas r ON r.object_id = o.id
      GROUP BY o.id
      ORDER BY o.created_at DESC`
  );

  return rows.map((o) => ({
    id: o.id,
    name: o.object_name,
    size: Number(o.size),
    checksum: o.checksum,
    version: o.version,
    replicationFactor: o.replication_factor,
    healthyReplicaCount: o.healthy_replica_count,
    status: o.status,
    createdAt: o.created_at,
  }));
}

async function getObjectRecord(id) {
  const { rows } = await query("SELECT * FROM objects WHERE id = $1", [id]);
  if (!rows[0]) throw new ApiError(404, "Object not found");
  return rows[0];
}

async function getObjectDetails(id) {
  const object = await getObjectRecord(id);

  const { rows: replicas } = await query(
    `SELECT r.*, n.node_name, n.status AS node_status
       FROM replicas r
       JOIN nodes n ON n.id = r.node_id
      WHERE r.object_id = $1
      ORDER BY n.node_name ASC`,
    [id]
  );

  const healthyCount = replicas.filter(
    (r) => (r.status === "HEALTHY" || r.status === "VERIFIED") && r.node_status !== "FAILED"
  ).length;

  return {
    id: object.id,
    name: object.object_name,
    size: Number(object.size),
    checksum: object.checksum,
    version: object.version,
    replicationFactor: object.replication_factor,
    status: object.status,
    createdAt: object.created_at,
    updatedAt: object.updated_at,
    integrityStatus: replicas.some((r) => r.status === "CORRUPTED") ? "CORRUPTED" : "OK",
    healthyReplicaCount: healthyCount,
    replicas: replicas.map((r) => ({
      id: r.id,
      node: r.node_name,
      nodeId: r.node_id,
      nodeStatus: r.node_status,
      status: r.status,
      version: r.version,
      checksum: r.checksum,
      updatedAt: r.updated_at,
    })),
  };
}

/**
 * Find a healthy replica for the object and return its bytes + name.
 * Automatically tries other replicas if the first choice is unavailable
 * on disk (e.g. node marked failed, file missing, etc).
 */
async function downloadObject(id) {
  const object = await getObjectRecord(id);

  const { rows: replicas } = await query(
    `SELECT r.*, n.node_name, n.status AS node_status
       FROM replicas r
       JOIN nodes n ON n.id = r.node_id
      WHERE r.object_id = $1
        AND r.status IN ('HEALTHY', 'VERIFIED')
        AND n.status != 'FAILED'
      ORDER BY r.updated_at DESC`,
    [id]
  );

  if (replicas.length === 0) {
    throw new ApiError(409, "No healthy replica is currently available for this object");
  }

  for (const replica of replicas) {
    try {
      const filePath = path.join(nodeDir(replica.node_name), object.id);
      const buffer = await fs.readFile(filePath);
      return { buffer, name: object.object_name, nodeUsed: replica.node_name };
    } catch (err) {
      // Try the next replica.
      continue;
    }
  }

  throw new ApiError(500, "All healthy replicas failed to read from disk");
}

module.exports = {
  DEFAULT_REPLICATION_FACTOR,
  uploadObject,
  listObjects,
  getObjectRecord,
  getObjectDetails,
  downloadObject,
};
