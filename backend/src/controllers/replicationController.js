const { asyncHandler } = require("../middleware/errorHandler");
const { getReplicationOverview } = require("../services/replicationService");

const getReplication = asyncHandler(async (_req, res) => {
  const overview = await getReplicationOverview();
  res.json({ success: true, ...overview });
});

module.exports = { getReplication };
