const { asyncHandler } = require("../middleware/errorHandler");
const integrityService = require("../services/integrityService");

const verifyIntegrity = asyncHandler(async (req, res) => {
  const result = await integrityService.verifyObjectIntegrity(req.params.objectId);
  res.json({ success: true, ...result });
});

const corruptReplica = asyncHandler(async (req, res) => {
  const result = await integrityService.corruptReplica(req.params.objectId, req.params.nodeId);
  res.json({ success: true, ...result });
});

module.exports = { verifyIntegrity, corruptReplica };
