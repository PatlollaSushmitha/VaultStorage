const { asyncHandler } = require("../middleware/errorHandler");
const repairService = require("../services/repairService");

const listRepairs = asyncHandler(async (_req, res) => {
  const repairs = await repairService.listRepairs();
  res.json({ success: true, repairs });
});

// Manual trigger for the Failure Lab UI - queues a repair for a specific
// object on demand (idempotent: no-ops if one is already in flight).
const triggerRepair = asyncHandler(async (req, res) => {
  const repair = await repairService.queueRepair(req.params.objectId);
  res.status(202).json({ success: true, repair });
});

const getRepair = asyncHandler(async (req, res) => {
  const repair = await repairService.getRepair(req.params.id);
  res.json({ success: true, repair });
});

const retryRepair = asyncHandler(async (req, res) => {
  const repair = await repairService.retryRepair(req.params.id);
  res.json({ success: true, repair });
});

module.exports = { listRepairs, getRepair, retryRepair, triggerRepair };
