const { asyncHandler } = require("../middleware/errorHandler");
const { listActivity } = require("../services/activityService");

const getActivity = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 100;
  const eventType = req.query.eventType || null;
  const activity = await listActivity({ limit, eventType });
  res.json({ success: true, activity });
});

module.exports = { getActivity };
