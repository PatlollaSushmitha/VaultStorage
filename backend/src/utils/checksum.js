const crypto = require("crypto");
const fs = require("fs");

/**
 * Compute the SHA-256 checksum of a Buffer.
 * @param {Buffer} buffer
 * @returns {string} hex digest
 */
function checksumBuffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Compute the SHA-256 checksum of a file on disk, streaming it so large
 * files don't need to be loaded fully into memory.
 * @param {string} filePath
 * @returns {Promise<string>} hex digest
 */
function checksumFile(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

module.exports = { checksumBuffer, checksumFile };
