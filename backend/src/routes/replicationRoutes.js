const express = require("express");
const replicationController = require("../controllers/replicationController");

const router = express.Router();

router.get("/", replicationController.getReplication);

module.exports = router;
