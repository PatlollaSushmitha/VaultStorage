const { asyncHandler, ApiError } = require("../middleware/errorHandler");
const objectService = require("../services/objectService");

const uploadObject = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "No file uploaded. Send multipart/form-data with field name 'file'.");
  }

  const result = await objectService.uploadObject({
    buffer: req.file.buffer,
    originalName: req.file.originalname,
    replicationFactor: req.body.replicationFactor,
  });

  res.status(201).json({ success: true, ...result });
});

const listObjects = asyncHandler(async (_req, res) => {
  const objects = await objectService.listObjects();
  res.json({ success: true, objects });
});

const getObjectDetails = asyncHandler(async (req, res) => {
  const object = await objectService.getObjectDetails(req.params.id);
  res.json({ success: true, object });
});

const downloadObject = asyncHandler(async (req, res) => {
  const { buffer, name } = await objectService.downloadObject(req.params.id);
  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(name)}"`);
  res.setHeader("Content-Type", "application/octet-stream");
  res.send(buffer);
});

module.exports = { uploadObject, listObjects, getObjectDetails, downloadObject };
