const { BIN_DB, sendJson } = require("../lib/bin-core");

module.exports = async function handler(_req, res) {
  return sendJson(res, 200, {
    ok: true,
    service: "NekoBIN & CC Studio Chibi Pro",
    version: "4.0.0",
    offlineBinCount: Object.keys(BIN_DB).length,
    timestamp: new Date().toISOString(),
  });
};
