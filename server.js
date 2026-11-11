/**
 * NekoBIN & CC Studio Chibi v4.0 — Local Standalone HTTP Server
 * Reuses the exact same Vercel Serverless Function handlers in ./api/*
 */

const http = require("http");
const path = require("path");
const fs = require("fs");

const checkBinHandler = require("./api/check-bin");
const checkCardStatusHandler = require("./api/check-card-status");
const healthHandler = require("./api/health");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

const ALLOWED_STATIC = new Set([
  "/index.html",
  "/styles.css",
  "/app.js",
  "/favicon.svg",
  "/manifest.json",
]);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

function createServer() {
  return http.createServer(async (req, res) => {
    const urlObj = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const pathname = urlObj.pathname;

    if (pathname === "/api/check-bin") {
      return checkBinHandler(req, res);
    }
    if (pathname === "/api/check-card-status") {
      return checkCardStatusHandler(req, res);
    }
    if (pathname === "/api/health") {
      return healthHandler(req, res);
    }

    const filePath = pathname === "/" ? "/index.html" : pathname;
    if (!ALLOWED_STATIC.has(filePath)) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("404 Not Found");
    }

    const resolvedPath = path.join(PUBLIC_DIR, filePath);
    fs.readFile(resolvedPath, (err, content) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        return res.end("404 Not Found");
      }
      const ext = path.extname(resolvedPath).toLowerCase();
      res.writeHead(200, {
        "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
      });
      res.end(content);
    });
  });
}

if (require.main === module) {
  const server = createServer();
  server.listen(PORT, () => {
    console.log("==============================================================");
    console.log("  🐾 NEKOBIN & CC STUDIO CHIBI v4.0 RUNNING AT:");
    console.log(`  👉 http://localhost:${PORT}`);
    console.log("==============================================================");
  });
}

module.exports = { createServer };
