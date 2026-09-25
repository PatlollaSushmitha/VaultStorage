const express = require("express");
const repairController = require("../controllers/repairController");

const router = express.Router();

router.get("/", repairController.listRepairs);
router.post("/trigger/:objectId", repairController.triggerRepair);
router.get("/:id", repairController.getRepair);
router.post("/:id/retry", repairController.retryRepair);

module.exports = router;
