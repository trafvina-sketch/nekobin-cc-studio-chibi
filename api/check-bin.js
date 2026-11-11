const { resolveBinServer, readJsonBody, sendJson } = require("../lib/bin-core");

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return sendJson(res, 200, { ok: true });
  }
  if (req.method !== "POST" && req.method !== "GET") {
    return sendJson(res, 405, { error: "Method Not Allowed" });
  }

  const body = req.method === "POST" ? await readJsonBody(req) : {};
  const urlObj = new URL(req.url || "/", `http://${req.headers?.host || "localhost"}`);

  // Batch lookup support: { bins: ["54243223", "414720", ...] }
  if (Array.isArray(body.bins) && body.bins.length > 0) {
    const uniqueBins = [
      ...new Set(
        body.bins
          .map((b) => String(b || "").replace(/\D/g, "").slice(0, 8))
          .filter((b) => b.length >= 6)
      ),
    ].slice(0, 100);

    const results = {};
    // Process in parallel chunks of 8
    for (let i = 0; i < uniqueBins.length; i += 8) {
      const chunk = uniqueBins.slice(i, i + 8);
      const resolved = await Promise.all(chunk.map((b) => resolveBinServer(b)));
      chunk.forEach((b, idx) => {
        results[b] = resolved[idx];
      });
    }
    return sendJson(res, 200, { success: true, count: uniqueBins.length, results });
  }

  const rawBin = body.bin || urlObj.searchParams.get("bin") || "";
  const cleanBin = String(rawBin).replace(/\D/g, "").slice(0, 8);
  if (cleanBin.length < 6) {
    return sendJson(res, 400, { error: "BIN phải có ít nhất 6 chữ số" });
  }

  const info = await resolveBinServer(cleanBin);
  return sendJson(res, 200, { success: true, ...info });
};
