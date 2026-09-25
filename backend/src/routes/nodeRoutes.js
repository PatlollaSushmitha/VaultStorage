const express = require("express");
const nodeController = require("../controllers/nodeController");

const router = express.Router();

router.get("/", nodeController.listNodes);
router.get("/:id", nodeController.getNode);
router.post("/:id/fail", nodeController.failNode);
router.post("/:id/recover", nodeController.recoverNode);

module.exports = router;
