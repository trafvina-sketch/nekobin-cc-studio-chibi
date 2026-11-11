const {
  SANDBOX_SCENARIOS,
  validateLuhn,
  resolveBinServer,
  readJsonBody,
  sendJson,
} = require("../lib/bin-core");

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return sendJson(res, 200, { ok: true });
  }
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method Not Allowed" });
  }

  const body = await readJsonBody(req);
  const pan = String(body.cardNumber || "").replace(/\D/g, "");
  const mm = String(body.mm || "").replace(/\D/g, "").padStart(2, "0");
  const yy = String(body.yy || "").replace(/\D/g, "").slice(-2);
  const cvv = String(body.cvv || "").replace(/\D/g, "");
  const stripeKey = String(body.stripeKey || "").trim();

  if (!validateLuhn(pan)) {
    return sendJson(res, 400, { status: "DEAD", error: "Thẻ không vượt qua kiểm tra toán học Luhn (Mod 10)" });
  }

  // PCI-DSS Compliance Guard: Block live secret keys on web endpoints
  if (stripeKey && stripeKey.startsWith("sk_live_")) {
    return sendJson(res, 403, {
      status: "DEAD",
      responseCode: "pci_dss_guard",
      error: "Bảo vệ PCI-DSS: Chỉ cho phép khóa Sandbox thử nghiệm (sk_test_...). Không gửi số thẻ thật qua API trực tiếp.",
      message: "Blocked sk_live_ (Chỉ hỗ trợ Sandbox sk_test_... chuẩn PCI-DSS)",
    });
  }

  const binInfo = await resolveBinServer(pan.slice(0, 8));

  // Optional Stripe Sandbox (sk_test_...) verification for developers
  if (stripeKey && stripeKey.startsWith("sk_test_")) {
    try {
      const pmParams = new URLSearchParams();
      pmParams.append("type", "card");
      pmParams.append("card[number]", pan);
      pmParams.append("card[exp_month]", mm || "12");
      pmParams.append("card[exp_year]", yy ? `20${yy}` : "2028");
      if (cvv) pmParams.append("card[cvc]", cvv);

      const pmRes = await fetch("https://api.stripe.com/v1/payment_methods", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: pmParams.toString(),
        signal: AbortSignal.timeout(6000),
      });
      const pmData = await pmRes.json();

      if (!pmRes.ok || pmData.error) {
        const err = pmData.error || {};
        return sendJson(res, 200, {
          success: true,
          status: "DEAD",
          cardNumber: pan,
          bin: binInfo.bin6,
          bin8: binInfo.bin8,
          bank: binInfo.bank,
          country: binInfo.country,
          countryCode: binInfo.countryCode,
          network: binInfo.brand,
          type: binInfo.type,
          level: binInfo.level,
          responseCode: err.decline_code || err.code || "sandbox_pm_error",
          message: err.message || "Sandbox declined at PaymentMethod creation",
          timestamp: new Date().toISOString(),
        });
      }

      const siParams = new URLSearchParams();
      siParams.append("payment_method", pmData.id);
      siParams.append("confirm", "true");
      siParams.append("usage", "off_session");
      siParams.append("automatic_payment_methods[enabled]", "true");
      siParams.append("automatic_payment_methods[allow_redirects]", "never");

      const intentRes = await fetch("https://api.stripe.com/v1/setup_intents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: siParams.toString(),
        signal: AbortSignal.timeout(6000),
      });
      const intentData = await intentRes.json();
      const cardMeta = pmData.card || {};
      const isLive =
        intentRes.ok &&
        (intentData.status === "succeeded" ||
          intentData.status === "requires_action" ||
          intentData.status === "requires_capture");

      if (isLive) {
        return sendJson(res, 200, {
          success: true,
          status: "LIVE",
          cardNumber: pan,
          bin: binInfo.bin6,
          bin8: binInfo.bin8,
          bank: binInfo.bank,
          country: binInfo.country,
          countryCode: cardMeta.country || binInfo.countryCode,
          network: cardMeta.brand ? cardMeta.brand.toUpperCase() : binInfo.brand,
          type: cardMeta.funding ? cardMeta.funding.toUpperCase() : binInfo.type,
          level: binInfo.level,
          transactionId: intentData.id,
          responseCode: intentData.status,
          message: `Stripe Sandbox Approved (${intentData.status} · CVC: ${cardMeta.checks?.cvc_check || "pass"})`,
          timestamp: new Date().toISOString(),
        });
      }

      const iErr = intentData.error || {};
      return sendJson(res, 200, {
        success: true,
        status: "DEAD",
        cardNumber: pan,
        bin: binInfo.bin6,
        bin8: binInfo.bin8,
        bank: binInfo.bank,
        country: binInfo.country,
        countryCode: cardMeta.country || binInfo.countryCode,
        network: cardMeta.brand ? cardMeta.brand.toUpperCase() : binInfo.brand,
        type: cardMeta.funding ? cardMeta.funding.toUpperCase() : binInfo.type,
        level: binInfo.level,
        transactionId: intentData.id || "N/A",
        responseCode: iErr.decline_code || iErr.code || "declined",
        message: iErr.message || "Sandbox declined by issuer",
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      return sendJson(res, 500, { status: "DEAD", error: `Stripe Sandbox connection error: ${err.message}` });
    }
  }

  // Built-in Official Sandbox Scenario Simulator
  const scenario = SANDBOX_SCENARIOS[pan] || {
    status: "DEAD",
    code: "do_not_honor",
    message: "Declined — Do Not Honor (Sandbox Simulation)",
  };

  return sendJson(res, 200, {
    success: true,
    status: scenario.status,
    cardNumber: pan,
    bin: binInfo.bin6,
    bin8: binInfo.bin8,
    bank: binInfo.bank,
    country: binInfo.country,
    countryCode: binInfo.countryCode,
    network: binInfo.brand,
    type: binInfo.type,
    level: binInfo.level,
    transactionId: "sim_" + Math.random().toString(36).slice(2, 12).toUpperCase(),
    responseCode: scenario.code,
    message: scenario.message,
    timestamp: new Date().toISOString(),
  });
};
