const multer = require("multer");

// Buffer uploads in memory: objects are then written out to N node
// directories by objectService. Fine for a hackathon prototype; for large
// files you'd stream to disk instead.
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500 MB safety cap
  },
});

module.exports = { upload };
