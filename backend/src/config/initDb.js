/**
 * One-time setup script:
 *  1. Applies database/schema.sql to the configured PostgreSQL database.
 *  2. Seeds the initial 4-node cluster if it doesn't already exist.
 *  3. Ensures the storage/node-* directories exist on disk.
 *
 * Usage: npm run db:init
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { pool } = require("./database");
const { ensureNodeDirectories } = require("../services/nodeService");

async function applySchema() {
  const schemaPath = path.join(__dirname, "..", "..", "database", "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf-8");
  await pool.query(sql);
  console.log("[init] schema applied");
}

async function seedNodes() {
  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM nodes");
  if (rows[0].count > 0) {
    console.log("[init] nodes already seeded, skipping");
    return;
  }

  const names = ["node-1", "node-2", "node-3", "node-4"];
  for (const name of names) {
    await pool.query(
      `INSERT INTO nodes (node_name, status, storage_capacity, storage_used)
       VALUES ($1, 'HEALTHY', 10737418240, 0)
       ON CONFLICT (node_name) DO NOTHING`,
      [name]
    );
  }
  console.log("[init] seeded 4 nodes: node-1..node-4");
}

async function main() {
  await applySchema();
  await ensureNodeDirectories();
  await seedNodes();
  console.log("[init] done");
  await pool.end();
}

main().catch((err) => {
  console.error("[init] failed:", err);
  process.exit(1);
});
