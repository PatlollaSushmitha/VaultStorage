const express = require("express");
const cors = require("cors");

const objectRoutes = require("./routes/objectRoutes");
const nodeRoutes = require("./routes/nodeRoutes");
const replicationRoutes = require("./routes/replicationRoutes");
const repairRoutes = require("./routes/repairRoutes");
const integrityRoutes = require("./routes/integrityRoutes");
const activityRoutes = require("./routes/activityRoutes");
const metricsRoutes = require("./routes/metricsRoutes");

const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "vault-backend" });
});

app.use("/api/objects", objectRoutes);
app.use("/api/nodes", nodeRoutes);
app.use("/api/replication", replicationRoutes);
app.use("/api/repairs", repairRoutes);
app.use("/api/integrity", integrityRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/metrics", metricsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
