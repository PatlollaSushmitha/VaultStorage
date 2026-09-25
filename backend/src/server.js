

require("dotenv").config();

const app = require("./app");
const logger = require("./utils/logger");
const { ensureNodeDirectories } = require("./services/nodeService");
const { pool } = require("./config/database");

const PORT = process.env.PORT || 3000;

async function start() {
  // Make sure storage/node-1..node-4 exist even if db:init was never run.
  await ensureNodeDirectories();

  // Fail fast with a clear message if the DB isn't reachable.
  try {
    await pool.query("SELECT 1");
  } catch (err) {
    logger.error(
      "Could not connect to PostgreSQL. Check DATABASE_URL in .env and that the schema has been applied (npm run db:init)."
    );
    logger.error(err.message);
    process.exit(1);
  }

  app.listen(PORT, "0.0.0.0", () => {
  logger.info(`Vault backend listening on port ${PORT}`);
});
}

start();
