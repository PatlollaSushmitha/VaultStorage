const { query } = require("../config/database");

/**
 * Record a cluster event into the activities table.
 * @param {{eventType: string, message: string, objectId?: string|null, nodeId?: string|null}} evt
 */
async function recordActivity({ eventType, message, objectId = null, nodeId = null }, client = null) {
  const runner = client || { query };
  const { rows } = await runner.query(
    `INSERT INTO activities (event_type, message, object_id, node_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [eventType, message, objectId, nodeId]
  );
  return rows[0];
}

async function listActivity({ limit = 100, eventType = null } = {}) {
  if (eventType) {
    const { rows } = await query(
      `SELECT a.*, o.object_name, n.node_name
         FROM activities a
         LEFT JOIN objects o ON o.id = a.object_id
         LEFT JOIN nodes n ON n.id = a.node_id
        WHERE a.event_type = $1
        ORDER BY a.created_at DESC
        LIMIT $2`,
      [eventType, limit]
    );
    return rows;
  }

  const { rows } = await query(
    `SELECT a.*, o.object_name, n.node_name
       FROM activities a
       LEFT JOIN objects o ON o.id = a.object_id
       LEFT JOIN nodes n ON n.id = a.node_id
      ORDER BY a.created_at DESC
      LIMIT $1`,
    [limit]
  );
  return rows;
}

module.exports = { recordActivity, listActivity };
