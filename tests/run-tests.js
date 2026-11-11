/**
 * Comprehensive Automated Verification Suite for NekoBIN & CC Studio Chibi v4.0
 * Tests: Core Luhn, 6-8 Digit BIN Resolution, Batch API, Sandbox Scenarios,
 * PCI-DSS sk_live_ Guard, Static Assets, Security Headers, and Frontend Syntax.
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { createServer } = require("../scripts/dev-server");
const { validateLuhn, detectNetwork, resolveBinServer } = require("../lib/bin-core");

async function runAllTests() {
  console.log("🐾 Starting NekoBIN & CC Studio v4.0 Automated Test Suite...\n");
  let passed = 0;

  function ok(name) {
    passed++;
    console.log(`  ✅ PASS: ${name}`);
  }

  // 1. Unit Tests: Luhn & Network Detection
  assert.strictEqual(validateLuhn("4242424242424242"), true);
  assert.strictEqual(validateLuhn("4242424242424243"), false);
  assert.strictEqual(validateLuhn("378282246310005"), true); // 15-digit Amex
  assert.strictEqual(detectNetwork("9704361234567895"), "NAPAS");
  assert.strictEqual(detectNetwork("2223003122003222"), "MASTERCARD"); // 2-series MC
  assert.strictEqual(detectNetwork("378282246310005"), "AMEX");
  ok("Core Luhn Mod-10 & Network Prefix Detection (Visa, MC 2-Series, Amex 15, NAPAS)");

  // 2. Unit Tests: 6-digit vs 8-digit Sub-allocation Resolution
  const bin6 = await resolveBinServer("542432");
  const bin8 = await resolveBinServer("54243223");
  assert.strictEqual(bin6.countryCode, "US");
  assert.strictEqual(bin8.countryCode, "NP");
  const vcb = await resolveBinServer("970436");
  assert.strictEqual(vcb.countryCode, "VN");
  assert.strictEqual(vcb.brand, "NAPAS");
  ok("6-Digit vs 8-Digit Sub-Allocation BIN Resolution (542432 US vs 54243223 NP, 970436 VN)");

  // 3. Frontend app.js JavaScript Syntax & DOM ID Integrity Verification
  const appJsCode = fs.readFileSync(path.join(__dirname, "..", "public", "app.js"), "utf8");
  const indexHtml = fs.readFileSync(path.join(__dirname, "..", "public", "index.html"), "utf8");
  new vm.Script(appJsCode, { filename: "app.js" });
  const htmlIds = new Set([...indexHtml.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
  const jsIds = [...new Set([...appJsCode.matchAll(/getElementById\("([^"]+)"\)/g)].map((m) => m[1]))];
  const missingIds = jsIds.filter((id) => !htmlIds.has(id));
  assert.deepStrictEqual(missingIds, [], `Missing DOM IDs in index.html: ${missingIds.join(", ")}`);
  ok(`Frontend app.js syntax & DOM ID integrity (${jsIds.length}/${jsIds.length} IDs matched)`);

  // 4. Integration HTTP Server & Serverless Handler Tests
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;

  try {
    // 4a. Static index.html, styles.css, app.js, favicon.svg, manifest.json
    for (const route of ["/", "/styles.css", "/app.js", "/favicon.svg", "/manifest.json"]) {
      const r = await fetch(`${base}${route}`);
      assert.strictEqual(r.status, 200, `Expected 200 for ${route}`);
      assert.strictEqual(r.headers.get("x-content-type-options"), "nosniff");
    }
    // Ensure server source files are NOT exposed statically
    const forbiddenCheck = await fetch(`${base}/server.js`);
    assert.strictEqual(forbiddenCheck.status, 404);
    ok("Static asset serving + Security headers + Private source file protection (/server.js -> 404)");

    // 4b. /api/health
    const hRes = await fetch(`${base}/api/health`);
    const hJson = await hRes.json();
    assert.strictEqual(hRes.status, 200);
    assert.strictEqual(hJson.ok, true);
    assert.ok(hJson.offlineBinCount >= 55);
    ok(`/api/health endpoint (${hJson.offlineBinCount} verified offline BINs loaded)`);

    // 4c. /api/check-bin single & batch
    const bSingle = await fetch(`${base}/api/check-bin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bin: "516815" }),
    }).then((r) => r.json());
    assert.strictEqual(bSingle.success, true);
    assert.ok(bSingle.bank.includes("Apple Card"));

    const bBatch = await fetch(`${base}/api/check-bin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bins: ["54243223", "970422", "490301"] }),
    }).then((r) => r.json());
    assert.strictEqual(bBatch.success, true);
    assert.strictEqual(bBatch.count, 3);
    assert.strictEqual(bBatch.results["54243223"].countryCode, "NP");
    assert.strictEqual(bBatch.results["970422"].countryCode, "VN");
    assert.strictEqual(bBatch.results["490301"].type, "PREPAID");
    ok("/api/check-bin Single & Parallel Batch Lookup");

    // 4d. /api/check-card-status Sandbox Scenarios & PCI-DSS Guard
    const sLive = await fetch(`${base}/api/check-card-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardNumber: "4242424242424242", mm: "12", yy: "29", cvv: "123" }),
    }).then((r) => r.json());
    assert.strictEqual(sLive.status, "LIVE");

    const sDecline = await fetch(`${base}/api/check-card-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardNumber: "4000000000009995", mm: "12", yy: "29", cvv: "995" }),
    }).then((r) => r.json());
    assert.strictEqual(sDecline.status, "DEAD");
    assert.strictEqual(sDecline.responseCode, "insufficient_funds");

    const pciBlock = await fetch(`${base}/api/check-card-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cardNumber: "4242424242424242",
        mm: "12",
        yy: "29",
        cvv: "123",
        stripeKey: "sk_live_testguard123",
      }),
    });
    assert.strictEqual(pciBlock.status, 403);
    ok("/api/check-card-status Sandbox Scenarios + PCI-DSS sk_live_ Guard (HTTP 403)");
  } finally {
    server.close();
  }

  console.log(`\n🎉 ALL ${passed} TEST SUITES PASSED SUCCESSFULLY!`);
}

runAllTests().catch((err) => {
  console.error("❌ TEST FAILED:", err);
  process.exit(1);
});
