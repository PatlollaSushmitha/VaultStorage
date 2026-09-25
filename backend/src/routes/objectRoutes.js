const express = require("express");
const { upload } = require("../middleware/uploadMiddleware");
const objectController = require("../controllers/objectController");

const router = express.Router();

router.post("/upload", upload.single("file"), objectController.uploadObject);
router.get("/", objectController.listObjects);
router.get("/:id", objectController.getObjectDetails);
router.get("/:id/download", objectController.downloadObject);

module.exports = router;
