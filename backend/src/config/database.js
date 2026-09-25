const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("error", (err) => {
  // eslint-disable-next-line no-console
  console.error("[db] unexpected error on idle client", err);
});

/**
 * Run a query against the pool.
 * @param {string} text
 * @param {any[]} params
 */
function query(text, params) {
  return pool.query(text, params);
}

/**
 * Get a client for a manual transaction. Caller MUST release() it.
 */
async function getClient() {
  return pool.connect();
}

/**
 * Run `fn(client)` inside a BEGIN/COMMIT transaction, rolling back on error.
 */
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, getClient, withTransaction };
