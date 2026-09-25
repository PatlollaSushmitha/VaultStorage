const { asyncHandler } = require("../middleware/errorHandler");
const nodeService = require("../services/nodeService");
const { detectAtRiskObjects } = require("../services/replicationService");
const { queueRepair } = require("../services/repairService");

const listNodes = asyncHandler(async (_req, res) => {
  const nodes = await nodeService.listNodes();
  res.json({ success: true, nodes });
});

const getNode = asyncHandler(async (req, res) => {
  const node = await nodeService.getNode(req.params.id);
  res.json({ success: true, node });
});

const failNode = asyncHandler(async (req, res) => {
  const node = await nodeService.failNode(req.params.id);

  // Re-evaluate replica health cluster-wide and kick off repairs for
  // anything that's now under-replicated.
  const atRisk = await detectAtRiskObjects();
  for (const obj of atRisk) {
    await queueRepair(obj.objectId);
  }

  res.json({ success: true, node, objectsAtRisk: atRisk.length });
});

const recoverNode = asyncHandler(async (req, res) => {
  const node = await nodeService.recoverNode(req.params.id);
  res.json({ success: true, node });
});

module.exports = { listNodes, getNode, failNode, recoverNode };
