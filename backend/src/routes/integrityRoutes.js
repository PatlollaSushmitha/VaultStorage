const express = require("express");
const integrityController = require("../controllers/integrityController");

const router = express.Router();

router.post("/verify/:objectId", integrityController.verifyIntegrity);
router.post("/corrupt/:objectId/:nodeId", integrityController.corruptReplica);

module.exports = router;
