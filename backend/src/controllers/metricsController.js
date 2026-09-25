const { asyncHandler } = require("../middleware/errorHandler");
const { getClusterMetrics } = require("../services/healthService");

const getMetrics = asyncHandler(async (_req, res) => {
  const metrics = await getClusterMetrics();
  res.json({ success: true, metrics });
});

module.exports = { getMetrics };
