/**
 * NekoBIN & CC Studio Chibi v4.0 — Shared Core Engine
 * - 100% Clean, Zero Third-Party Dependencies
 * - Parallel 6–8 Digit BIN/IIN Resolution (Offline DB + HandyAPI + Binlist)
 * - Bounded LRU Cache for Serverless & Local Performance
 * - Official Sandbox Test Card Simulator (PCI-DSS Safe)
 */

const MAX_CACHE_SIZE = 1000;
const serverBinCache = new Map();

// Expanded Offline BIN Registry (6-digit & 8-digit, International & Vietnam)
const BIN_DB = {
  // 8-Digit Extended Sub-Allocations
  "54243223": { bank: "Nabil Bank / Nepal Sub-Allocation", brand: "MASTERCARD", type: "DEBIT", level: "STANDARD", country: "Nepal (Sub-allocated US Range)", countryCode: "NP", numericCode: "524", currency: "NPR" },
  "45321489": { bank: "Bank of America N.A. (Consumer Preferred)", brand: "VISA", type: "CREDIT", level: "SIGNATURE", country: "United States", countryCode: "US", numericCode: "840", currency: "USD" },

  // Major International Visa / Mastercard / Amex / JCB / Discover / UnionPay
  "542432": { bank: "Citibank N.A. / Mastercard 5-Series", brand: "MASTERCARD", type: "CREDIT", level: "PLATINUM", country: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  "424242": { bank: "JPMorgan Chase (Stripe Sandbox)", brand: "VISA", type: "CREDIT", level: "CLASSIC", country: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  "400000": { bank: "Stripe / Visa Sandbox Test Issuer", brand: "VISA", type: "CREDIT", level: "TEST SUITE", country: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  "400005": { bank: "JPMorgan Chase Bank", brand: "VISA", type: "DEBIT", level: "STANDARD", country: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  "411111": { bank: "Visa Official Sandbox Registry", brand: "VISA", type: "CREDIT", level: "CLASSIC", country: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  "414720": { bank: "JPMorgan Chase Bank, N.A.", brand: "VISA", type: "CREDIT", level: "SIGNATURE", country: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  "453214": { bank: "Bank of America, N.A.", brand: "VISA", type: "CREDIT", level: "PLATINUM", country: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  "476632": { bank: "Wells Fargo Bank, N.A.", brand: "VISA", type: "DEBIT", level: "CLASSIC", country: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  "400016": { bank: "JPMorgan Chase Bank", brand: "VISA", type: "DEBIT", level: "CLASSIC", country: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  "490301": { bank: "Revolut Ltd", brand: "VISA", type: "PREPAID", level: "PREPAID", country: "United Kingdom", countryCode: "GB", numericCode: "826", currency: "GBP" },
  "485932": { bank: "Wise Payments Ltd", brand: "VISA", type: "DEBIT", level: "PLATINUM", country: "United Kingdom", countryCode: "GB", numericCode: "826", currency: "GBP" },
  "438857": { bank: "Barclays Bank UK PLC", brand: "VISA", type: "DEBIT", level: "CONNECT", country: "United Kingdom", countryCode: "GB", numericCode: "826", currency: "GBP" },
  "450003": { bank: "Royal Bank of Canada (RBC)", brand: "VISA", type: "CREDIT", level: "INFINITE", country: "Canada", countryCode: "CA", numericCode: "124", currency: "CAD" },
  "456468": { bank: "Commonwealth Bank of Australia", brand: "VISA", type: "DEBIT", level: "PLATINUM", country: "Australia", countryCode: "AU", numericCode: "036", currency: "AUD" },
  "462239": { bank: "DBS Bank Ltd", brand: "VISA", type: "DEBIT", level: "PLATINUM", country: "Singapore", countryCode: "SG", numericCode: "702", currency: "SGD" },

  "555555": { bank: "Mastercard Sandbox Registry", brand: "MASTERCARD", type: "CREDIT", level: "GOLD", country: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  "510510": { bank: "Citibank N.A.", brand: "MASTERCARD", type: "CREDIT", level: "STANDARD", country: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  "515676": { bank: "Citibank N.A.", brand: "MASTERCARD", type: "CREDIT", level: "WORLD ELITE", country: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  "518138": { bank: "Capital One Bank (USA), N.A.", brand: "MASTERCARD", type: "CREDIT", level: "PLATINUM", country: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  "520082": { bank: "TD Bank N.A.", brand: "MASTERCARD", type: "DEBIT", level: "STANDARD", country: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  "520473": { bank: "N26 Bank GmbH", brand: "MASTERCARD", type: "PREPAID", level: "PREPAID", country: "Germany", countryCode: "DE", numericCode: "276", currency: "EUR" },
  "535316": { bank: "Payoneer Europe Ltd", brand: "MASTERCARD", type: "PREPAID", level: "CORPORATE PREPAID", country: "Ireland", countryCode: "IE", numericCode: "372", currency: "EUR" },
  "535522": { bank: "Monzo Bank Ltd", brand: "MASTERCARD", type: "DEBIT", level: "WORLD", country: "United Kingdom", countryCode: "GB", numericCode: "826", currency: "GBP" },
  "516815": { bank: "Goldman Sachs Bank USA (Apple Card)", brand: "MASTERCARD", type: "CREDIT", level: "WORLD ELITE", country: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  "552266": { bank: "Capital One Bank", brand: "MASTERCARD", type: "CREDIT", level: "QUICKSILVER", country: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  "222300": { bank: "Mastercard 2-Series Sandbox", brand: "MASTERCARD", type: "CREDIT", level: "WORLD", country: "United States", countryCode: "US", numericCode: "840", currency: "USD" },

  "378282": { bank: "American Express Company", brand: "AMEX", type: "CREDIT", level: "PLATINUM", country: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  "371449": { bank: "American Express Company", brand: "AMEX", type: "CREDIT", level: "GOLD", country: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  "340005": { bank: "American Express Company", brand: "AMEX", type: "CREDIT", level: "CENTURION", country: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  "601111": { bank: "Discover Bank", brand: "DISCOVER", type: "CREDIT", level: "IT CASH BACK", country: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  "601100": { bank: "Discover Financial Services", brand: "DISCOVER", type: "CREDIT", level: "STANDARD", country: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  "356600": { bank: "JCB International Co., Ltd.", brand: "JCB", type: "CREDIT", level: "GOLD", country: "Japan", countryCode: "JP", numericCode: "392", currency: "JPY" },
  "352800": { bank: "MUFG Bank, Ltd.", brand: "JCB", type: "CREDIT", level: "STANDARD", country: "Japan", countryCode: "JP", numericCode: "392", currency: "JPY" },
  "305693": { bank: "Diners Club International", brand: "DINERS", type: "CHARGE", level: "CORPORATE", country: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  "620000": { bank: "UnionPay International", brand: "UNIONPAY", type: "CREDIT", level: "DIAMOND", country: "China", countryCode: "CN", numericCode: "156", currency: "CNY" },
  "621234": { bank: "Bank of China", brand: "UNIONPAY", type: "DEBIT", level: "CLASSIC", country: "China", countryCode: "CN", numericCode: "156", currency: "CNY" },

  // Vietnam Banks (NAPAS 9704xx & International Visa/Mastercard/JCB)
  "970436": { bank: "Vietcombank (VCB)", brand: "NAPAS", type: "DEBIT", level: "DOMESTIC", country: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  "970407": { bank: "Techcombank (TCB)", brand: "NAPAS", type: "DEBIT", level: "DOMESTIC", country: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  "970422": { bank: "MB Bank (Quân Đội)", brand: "NAPAS", type: "DEBIT", level: "DOMESTIC", country: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  "970415": { bank: "VietinBank (CTG)", brand: "NAPAS", type: "DEBIT", level: "DOMESTIC", country: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  "970418": { bank: "BIDV", brand: "NAPAS", type: "DEBIT", level: "DOMESTIC", country: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  "970405": { bank: "Agribank (VBARD)", brand: "NAPAS", type: "DEBIT", level: "DOMESTIC", country: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  "970416": { bank: "ACB (Á Châu)", brand: "NAPAS", type: "DEBIT", level: "DOMESTIC", country: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  "970432": { bank: "VPBank", brand: "NAPAS", type: "DEBIT", level: "DOMESTIC", country: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  "970423": { bank: "TPBank (Tiên Phong)", brand: "NAPAS", type: "DEBIT", level: "DOMESTIC", country: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  "970403": { bank: "Sacombank (STB)", brand: "NAPAS", type: "DEBIT", level: "DOMESTIC", country: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  "970441": { bank: "VIB (Quốc Tế)", brand: "NAPAS", type: "DEBIT", level: "DOMESTIC", country: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  "970437": { bank: "HDBank", brand: "NAPAS", type: "DEBIT", level: "DOMESTIC", country: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  "970443": { bank: "SHB (Sài Gòn - Hà Nội)", brand: "NAPAS", type: "DEBIT", level: "DOMESTIC", country: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  "970426": { bank: "MSB (Hàng Hải)", brand: "NAPAS", type: "DEBIT", level: "DOMESTIC", country: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  "970448": { bank: "OCB (Phương Đông)", brand: "NAPAS", type: "DEBIT", level: "DOMESTIC", country: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  "970440": { bank: "SeABank", brand: "NAPAS", type: "DEBIT", level: "DOMESTIC", country: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  "970431": { bank: "Eximbank", brand: "NAPAS", type: "DEBIT", level: "DOMESTIC", country: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  "970449": { bank: "LPBank (Lộc Phát)", brand: "NAPAS", type: "DEBIT", level: "DOMESTIC", country: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  "970454": { bank: "Timo Digital Bank (BVBank)", brand: "NAPAS", type: "DEBIT", level: "DIGITAL", country: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  "428310": { bank: "Vietcombank (VCB)", brand: "VISA", type: "DEBIT", level: "PLATINUM", country: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  "422075": { bank: "Techcombank (TCB)", brand: "VISA", type: "CREDIT", level: "SIGNATURE", country: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  "484803": { bank: "MB Bank", brand: "VISA", type: "CREDIT", level: "PRIORITY", country: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  "520399": { bank: "VPBank", brand: "MASTERCARD", type: "CREDIT", level: "PLATINUM", country: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  "546034": { bank: "CAKE by VPBank", brand: "MASTERCARD", type: "DEBIT", level: "DIGITAL", country: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
};

// Official Payment Gateway Sandbox Test Cards & Expected Responses
const SANDBOX_SCENARIOS = {
  "4242424242424242": { status: "LIVE", code: "approved", message: "Approved — Official Sandbox Test Card (200 OK)" },
  "4000056655665556": { status: "LIVE", code: "approved_debit", message: "Approved — Visa Debit Sandbox Card" },
  "5555555555554444": { status: "LIVE", code: "approved", message: "Approved — Mastercard Sandbox Card" },
  "2223003122003222": { status: "LIVE", code: "approved_2series", message: "Approved — Mastercard 2-Series Sandbox" },
  "5200828282828210": { status: "LIVE", code: "approved", message: "Approved — Mastercard Debit Sandbox" },
  "5105105105105100": { status: "LIVE", code: "approved", message: "Approved — Mastercard Standard Sandbox" },
  "378282246310005": { status: "LIVE", code: "approved", message: "Approved — Amex 15-Digit Sandbox" },
  "371449635398431": { status: "LIVE", code: "approved", message: "Approved — Amex Gold Sandbox" },
  "6011111111111117": { status: "LIVE", code: "approved", message: "Approved — Discover Sandbox" },
  "6011000990139424": { status: "LIVE", code: "approved", message: "Approved — Discover Standard Sandbox" },
  "3056930009020004": { status: "LIVE", code: "approved", message: "Approved — Diners Club Sandbox" },
  "3566002020360505": { status: "LIVE", code: "approved", message: "Approved — JCB Sandbox" },
  "6200000000000005": { status: "LIVE", code: "approved", message: "Approved — UnionPay Sandbox" },
  "4000002500003155": { status: "LIVE", code: "requires_action_3ds", message: "3DS2 Challenge Required — Card Active (Sandbox)" },
  "4000000000009995": { status: "DEAD", code: "insufficient_funds", message: "Declined — Insufficient Funds (Sandbox Test)" },
  "4000000000000069": { status: "DEAD", code: "lost_card", message: "Declined — Lost Card Pickup (Sandbox Test)" },
  "4000000000000044": { status: "DEAD", code: "stolen_card", message: "Declined — Stolen Card (Sandbox Test)" },
  "4000000000000051": { status: "DEAD", code: "expired_card", message: "Declined — Expired Card (Sandbox Test)" },
  "4000000000000127": { status: "DEAD", code: "incorrect_cvc", message: "Declined — Incorrect CVC Security Code (Sandbox Test)" },
  "4000000000000002": { status: "DEAD", code: "card_declined", message: "Declined — Generic Issuer Decline (Sandbox Test)" },
};

function cacheSet(key, value) {
  if (serverBinCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = serverBinCache.keys().next().value;
    serverBinCache.delete(oldestKey);
  }
  serverBinCache.set(key, value);
}

function validateLuhn(number) {
  const d = String(number || "").replace(/\D/g, "");
  if (d.length < 13 || d.length > 19) return false;
  let sum = 0;
  let even = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = Number(d[i]);
    if (even) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    even = !even;
  }
  return sum % 10 === 0;
}

function detectNetwork(pan) {
  const d = String(pan || "").replace(/\D/g, "");
  if (d.startsWith("9704")) return "NAPAS";
  if (/^4/.test(d)) return "VISA";
  if (/^(5[1-5]|222[1-9]|22[3-9]\d|2[3-6]\d{2}|27[01]\d|2720)/.test(d)) return "MASTERCARD";
  if (/^3[47]/.test(d)) return "AMEX";
  if (/^(6011|65|64[4-9])/.test(d)) return "DISCOVER";
  if (/^35(2[89]|[3-8]\d)/.test(d)) return "JCB";
  if (/^(30|36|38)/.test(d)) return "DINERS";
  if (/^62/.test(d)) return "UNIONPAY";
  return "UNKNOWN";
}

async function resolveBinServer(rawDigits) {
  const clean = String(rawDigits || "").replace(/\D/g, "");
  const bin6 = clean.slice(0, 6);
  const bin8 = clean.slice(0, 8);
  const cacheKey = bin8.length === 8 ? bin8 : bin6;

  if (serverBinCache.has(cacheKey)) {
    return serverBinCache.get(cacheKey);
  }

  const localMatch = BIN_DB[bin8] || BIN_DB[bin6];
  let meta = {
    bin: bin6,
    bin6,
    bin8,
    brand: localMatch?.brand || detectNetwork(clean),
    type: localMatch?.type || "UNKNOWN",
    level: localMatch?.level || "--",
    bank: localMatch?.bank || "Chưa rõ ngân hàng",
    country: localMatch?.country || "Chưa rõ",
    countryCode: localMatch?.countryCode || "--",
    numericCode: localMatch?.numericCode || "--",
    currency: localMatch?.currency || "USD",
    source: localMatch ? "Offline Built-in Registry" : "ISO Prefix Inference",
  };

  // Fast path: if exact 8-digit or 6-digit match is already in verified Offline DB, return immediately (<1ms)
  if (localMatch) {
    cacheSet(cacheKey, meta);
    return meta;
  }

  // Parallel lookup across HandyAPI (6-digit) + Binlist (8-digit/6-digit)
  const queryBin = bin8.length === 8 ? bin8 : bin6;
  const [handyRes, binlistRes] = await Promise.allSettled([
    fetch(`https://data.handyapi.com/bin/${bin6}`, {
      signal: AbortSignal.timeout(2500),
    }).then((r) => (r.ok ? r.json() : null)),
    fetch(`https://lookup.binlist.net/${queryBin}`, {
      headers: { "Accept-Version": "3", "User-Agent": "NekoBIN-Studio-Chibi/4.0" },
      signal: AbortSignal.timeout(2500),
    }).then((r) => (r.ok ? r.json() : null)),
  ]);

  let usedHandy = false;
  if (handyRes.status === "fulfilled" && handyRes.value?.Status === "SUCCESS") {
    const j1 = handyRes.value;
    meta.brand = j1.Scheme || meta.brand;
    meta.type = j1.Type || meta.type;
    meta.level = j1.CardTier || meta.level;
    meta.bank = j1.Issuer || meta.bank;
    meta.countryCode = j1.Country?.A2 || meta.countryCode;
    meta.country = j1.Country?.Name || meta.country;
    meta.numericCode = j1.Country?.N3 || meta.numericCode;
    meta.source = "HandyAPI Registry";
    usedHandy = true;
  }

  if (binlistRes.status === "fulfilled" && binlistRes.value) {
    const j2 = binlistRes.value;
    if (j2.scheme) meta.brand = j2.scheme.toUpperCase();
    if (j2.type) meta.type = j2.type.toUpperCase();
    if (j2.brand) meta.level = j2.brand.toUpperCase();
    if (j2.bank?.name) meta.bank = j2.bank.name;
    if (j2.country?.alpha2) meta.countryCode = j2.country.alpha2;
    if (j2.country?.name) meta.country = j2.country.name;
    if (j2.country?.numeric) meta.numericCode = j2.country.numeric;
    if (j2.country?.currency) meta.currency = j2.country.currency;
    meta.source = usedHandy ? "HandyAPI + Binlist (8-Digit)" : "Binlist Live Registry";
  }

  if (BIN_DB[bin8]) {
    meta = { ...meta, ...BIN_DB[bin8], bin6, bin8, source: `${meta.source} + 8-Digit Override` };
  }

  cacheSet(cacheKey, meta);
  return meta;
}

function readJsonBody(req) {
  if (req.body && typeof req.body === "object") {
    return Promise.resolve(req.body);
  }
  if (typeof req.body === "string") {
    try {
      return Promise.resolve(JSON.parse(req.body || "{}"));
    } catch {
      return Promise.resolve({});
    }
  }
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1e6) req.destroy();
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        resolve({});
      }
    });
  });
}

function sendJson(res, status, payload) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.statusCode = status;
  res.end(JSON.stringify(payload));
}

module.exports = {
  BIN_DB,
  SANDBOX_SCENARIOS,
  validateLuhn,
  detectNetwork,
  resolveBinServer,
  readJsonBody,
  sendJson,
};
