// ============================================================================
// NEKOBIN & CC STUDIO CHIBI — CLOUD PRO EDITION (v4.0)
// 100% Clean, XSS-Safe, Parallel Batch Engine, CSPRNG Unique Generator
// ============================================================================

const binCache = new Map();
const STORAGE_KEYS = {
  theme: "nekobin_theme_v4",
  sound: "nekobin_sound_v4",
  history: "nekobin_recent_v4",
};

let soundEnabled = true;
let bulkAbortRequested = false;

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function onlyDigits(str) {
  return String(str || "").replace(/\D/g, "");
}

function csprngInt(maxExclusive) {
  if (window.crypto && window.crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    window.crypto.getRandomValues(arr);
    return arr[0] % maxExclusive;
  }
  return Math.floor(Math.random() * maxExclusive);
}

// ============================================================================
// 0. WEB AUDIO SFX, THEME/SOUND PERSISTENCE & CHIBI MASCOT EXPRESSIONS
// ============================================================================
function playChibiSfx(type = "pop") {
  if (!soundEnabled) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!playChibiSfx._ctx) playChibiSfx._ctx = new AudioCtx();
    const ctx = playChibiSfx._ctx;
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "pop") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.start(now);
      osc.stop(now + 0.09);
    } else if (type === "magic") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(783.99, now + 0.06);
      osc.frequency.setValueAtTime(1046.5, now + 0.12);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.start(now);
      osc.stop(now + 0.24);
    } else if (type === "oops") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(210, now + 0.16);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    }
  } catch (_) {}
}

function setChibiReaction(mood, tagText, messageHtml) {
  const moodBadge = document.getElementById("chibiMoodBadge");
  const statusTag = document.getElementById("chibiStatusTag");
  const speechText = document.getElementById("chibiSpeechText");
  const mouth = document.getElementById("chibiMouth");

  if (moodBadge) moodBadge.textContent = mood;
  if (statusTag) statusTag.textContent = tagText;
  if (speechText) speechText.innerHTML = messageHtml;

  if (mouth) {
    if (mood.includes("Yay") || mood.includes("Đúc") || mood.includes("Hoàn") || mood.includes("Happy")) {
      mouth.setAttribute("d", "M60,85 Q70,96 80,85");
    } else if (mood.includes("Ối") || mood.includes("Shock")) {
      mouth.setAttribute("d", "M67,87 A3.2,3.2 0 1,0 73,87 A3.2,3.2 0 1,0 67,87");
    } else if (mood.includes("Cool")) {
      mouth.setAttribute("d", "M62,88 L78,86");
    } else {
      mouth.setAttribute("d", "M63,86 Q66.5,91 70,86 Q73.5,91 77,86");
    }
  }
}

function initPreferences() {
  try {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
    const savedSound = localStorage.getItem(STORAGE_KEYS.sound);
    if (savedTheme === "starry" || savedTheme === "sakura") {
      document.documentElement.setAttribute("data-theme", savedTheme);
      const btn = document.getElementById("btnThemeToggle");
      if (btn) {
        btn.textContent =
          savedTheme === "starry" ? "🌸 Đổi sang Sáng (Sakura)" : "🌙 Đổi sang Tối (Starry)";
      }
    }
    if (savedSound === "off") {
      soundEnabled = false;
      const sBtn = document.getElementById("btnSoundToggle");
      if (sBtn) sBtn.textContent = "🔇 Âm thanh: TẮT";
    }
  } catch (_) {}
}

document.getElementById("btnSoundToggle")?.addEventListener("click", (e) => {
  soundEnabled = !soundEnabled;
  e.currentTarget.textContent = soundEnabled ? "🔊 Âm thanh: BẬT" : "🔇 Âm thanh: TẮT";
  try {
    localStorage.setItem(STORAGE_KEYS.sound, soundEnabled ? "on" : "off");
  } catch (_) {}
  if (soundEnabled) playChibiSfx("pop");
});

document.getElementById("btnThemeToggle")?.addEventListener("click", (e) => {
  playChibiSfx("pop");
  const html = document.documentElement;
  const nextTheme = html.getAttribute("data-theme") === "starry" ? "sakura" : "starry";
  html.setAttribute("data-theme", nextTheme);
  try {
    localStorage.setItem(STORAGE_KEYS.theme, nextTheme);
  } catch (_) {}
  if (nextTheme === "sakura") {
    e.currentTarget.textContent = "🌙 Đổi sang Tối (Starry)";
    setChibiReaction("🌸 Neko Sakura", "Chế độ Sáng Ngọt Ngào", "Oa~ Giao diện <strong>Hồng Đào Sakura</strong> đã được lưu tự động cho cậu luôn nè! 🐾🌸");
  } else {
    e.currentTarget.textContent = "🌸 Đổi sang Sáng (Sakura)";
    setChibiReaction("🌙 Neko Starry", "Chế độ Đêm Sao Lung Linh", "Hihi~ Chuyển sang <strong>Bầu Trời Đêm Starry</strong> dịu mắt cực hợp làm việc đêm khuya nha! ✨🌙");
  }
});

document.querySelectorAll(".mood-mini-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const m = btn.dataset.mood;
    if (m === "happy") {
      playChibiSfx("magic");
      setChibiReaction("😻 Neko Happy", "Tràn đầy năng lượng", "Meowww~ Hôm nay Neko sẽ giúp cậu soi BIN và kiểm thử QA nhanh gấp 6 lần luôn nha! 💖✨");
    } else if (m === "shock") {
      playChibiSfx("oops");
      setChibiReaction("🙀 Neko Shock!", "Phát hiện thú vị", "Á à! Cậu biết không? Cùng đầu <code>542432</code> nhưng thêm 2 số thành <code>54243223</code> lại chuyển từ Citibank Mỹ sang Nabil Bank Nepal đó!");
    } else if (m === "cool") {
      playChibiSfx("pop");
      setChibiReaction("😎 Neko Cool", "Chuyên gia ISO/IEC 7812", "Mọi phép tính Luhn Mod-10 và đúc thẻ CSPRNG đều chạy mượt trên trình duyệt và Vercel Edge! 🐾🔥");
    } else {
      playChibiSfx("pop");
      setChibiReaction("🕵️‍♀️ Thám tử Neko", "Sẵn sàng làm việc", "Nhập bất kỳ mã BIN 6–8 số nào hoặc thử tính năng <strong>🔄 Lật Mặt Sau Thẻ 3D</strong> mới toanh nhé!");
    }
  });
});

const CHIBI_TIPS = [
  "🐾 <strong>Bí kíp số 1:</strong> Mã BIN hiện đại theo chuẩn ISO/IEC 7812:2017 đã mở rộng từ <strong>6 chữ số lên 8 chữ số</strong> (ví dụ <code>54243223</code>) để định danh chính xác ngân hàng nhánh!",
  "🧹 <strong>Bí kíp số 2:</strong> Ở tab <strong>Bulk Check</strong>, cậu có thể dán cả đoạn tin nhắn lộn xộn rồi bấm <strong>🧹 Lọc Văn Bản Hỗn Hợp</strong> để Neko tự nhặt sạch thẻ và mã BIN ra!",
  "🔄 <strong>Bí kíp số 3:</strong> Bấm nút <strong>🔄 Lật Mặt Sau Thẻ</strong> ở Tab 1 để xem dải băng từ, chữ ký, ô CVV và tóm tắt chính sách AVS mặt sau nhé!",
  "🆚 <strong>Bí kíp số 4:</strong> Mở tab <strong>So Sánh BIN &amp; Thẻ Sandbox</strong> để đặt 2 đầu BIN lên bàn cân xem bên nào dính kiểm tra AVS Zip Code hoặc cờ Prepaid!",
];
let tipIdx = 0;
document.getElementById("chibiAvatarBox")?.addEventListener("click", () => {
  playChibiSfx("magic");
  setChibiReaction("🐱 Neko Mách Nhỏ", `Bí kíp #${(tipIdx % CHIBI_TIPS.length) + 1}`, CHIBI_TIPS[tipIdx % CHIBI_TIPS.length]);
  tipIdx++;
});

// ============================================================================
// 1. EXPANDED OFFLINE BIN REGISTRY & SANDBOX SUITE (60+ Verified BINs)
// ============================================================================
const BIN_DATABASE = [
  { bin: "54243223", scheme: "MASTERCARD", type: "DEBIT", tier: "STANDARD", bank: "Nabil Bank / Nepal Sub-Allocation", countryName: "Nepal (Sub-allocated US Range)", countryCode: "NP", numericCode: "524", currency: "NPR" },
  { bin: "45321489", scheme: "VISA", type: "CREDIT", tier: "SIGNATURE", bank: "Bank of America N.A. (8-Digit)", countryName: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  { bin: "542432", scheme: "MASTERCARD", type: "CREDIT", tier: "PLATINUM", bank: "Citibank / Mastercard 5-Series", countryName: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  { bin: "424242", scheme: "VISA", type: "CREDIT", tier: "CLASSIC (SANDBOX)", bank: "JPMorgan Chase (Stripe Test)", countryName: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  { bin: "400000", scheme: "VISA", type: "CREDIT", tier: "TEST SUITE", bank: "Stripe / Visa Sandbox Issuer", countryName: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  { bin: "400005", scheme: "VISA", type: "DEBIT", tier: "STANDARD", bank: "JPMorgan Chase Bank", countryName: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  { bin: "414720", scheme: "VISA", type: "CREDIT", tier: "SIGNATURE", bank: "JPMorgan Chase Bank, N.A.", countryName: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  { bin: "453214", scheme: "VISA", type: "CREDIT", tier: "PLATINUM", bank: "Bank of America, N.A.", countryName: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  { bin: "476632", scheme: "VISA", type: "DEBIT", tier: "CLASSIC", bank: "Wells Fargo Bank, N.A.", countryName: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  { bin: "400016", scheme: "VISA", type: "DEBIT", tier: "CLASSIC", bank: "JPMorgan Chase Bank", countryName: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  { bin: "490301", scheme: "VISA", type: "PREPAID", tier: "PREPAID", bank: "Revolut Ltd", countryName: "United Kingdom", countryCode: "GB", numericCode: "826", currency: "GBP" },
  { bin: "485932", scheme: "VISA", type: "DEBIT", tier: "PLATINUM", bank: "Wise Payments Ltd", countryName: "United Kingdom", countryCode: "GB", numericCode: "826", currency: "GBP" },
  { bin: "438857", scheme: "VISA", type: "DEBIT", tier: "CONNECT", bank: "Barclays Bank UK PLC", countryName: "United Kingdom", countryCode: "GB", numericCode: "826", currency: "GBP" },
  { bin: "450003", scheme: "VISA", type: "CREDIT", tier: "INFINITE", bank: "Royal Bank of Canada (RBC)", countryName: "Canada", countryCode: "CA", numericCode: "124", currency: "CAD" },
  { bin: "456468", scheme: "VISA", type: "DEBIT", tier: "PLATINUM", bank: "Commonwealth Bank of Australia", countryName: "Australia", countryCode: "AU", numericCode: "036", currency: "AUD" },
  { bin: "462239", scheme: "VISA", type: "DEBIT", tier: "PLATINUM", bank: "DBS Bank Ltd", countryName: "Singapore", countryCode: "SG", numericCode: "702", currency: "SGD" },
  { bin: "555555", scheme: "MASTERCARD", type: "CREDIT", tier: "GOLD (SANDBOX)", bank: "Mastercard Sandbox Registry", countryName: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  { bin: "510510", scheme: "MASTERCARD", type: "CREDIT", tier: "STANDARD", bank: "Citibank N.A.", countryName: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  { bin: "515676", scheme: "MASTERCARD", type: "CREDIT", tier: "WORLD ELITE", bank: "Citibank N.A.", countryName: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  { bin: "518138", scheme: "MASTERCARD", type: "CREDIT", tier: "PLATINUM", bank: "Capital One Bank (USA), N.A.", countryName: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  { bin: "520082", scheme: "MASTERCARD", type: "DEBIT", tier: "STANDARD", bank: "TD Bank N.A.", countryName: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  { bin: "520473", scheme: "MASTERCARD", type: "PREPAID", tier: "PREPAID", bank: "N26 Bank GmbH", countryName: "Germany", countryCode: "DE", numericCode: "276", currency: "EUR" },
  { bin: "535316", scheme: "MASTERCARD", type: "PREPAID", tier: "CORPORATE PREPAID", bank: "Payoneer Europe Ltd", countryName: "Ireland", countryCode: "IE", numericCode: "372", currency: "EUR" },
  { bin: "535522", scheme: "MASTERCARD", type: "DEBIT", tier: "WORLD", bank: "Monzo Bank Ltd", countryName: "United Kingdom", countryCode: "GB", numericCode: "826", currency: "GBP" },
  { bin: "516815", scheme: "MASTERCARD", type: "CREDIT", tier: "WORLD ELITE", bank: "Goldman Sachs Bank USA (Apple Card)", countryName: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  { bin: "552266", scheme: "MASTERCARD", type: "CREDIT", tier: "QUICKSILVER", bank: "Capital One Bank", countryName: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  { bin: "222300", scheme: "MASTERCARD", type: "CREDIT", tier: "WORLD (2-SERIES)", bank: "Mastercard 2-Series Sandbox", countryName: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  { bin: "378282", scheme: "AMEX", type: "CREDIT", tier: "PLATINUM", bank: "American Express Company", countryName: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  { bin: "371449", scheme: "AMEX", type: "CREDIT", tier: "GOLD", bank: "American Express Company", countryName: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  { bin: "340005", scheme: "AMEX", type: "CREDIT", tier: "CENTURION", bank: "American Express Company", countryName: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  { bin: "601111", scheme: "DISCOVER", type: "CREDIT", tier: "IT CASH BACK", bank: "Discover Bank", countryName: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  { bin: "601100", scheme: "DISCOVER", type: "CREDIT", tier: "STANDARD", bank: "Discover Financial Services", countryName: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  { bin: "356600", scheme: "JCB", type: "CREDIT", tier: "GOLD", bank: "JCB International", countryName: "Japan", countryCode: "JP", numericCode: "392", currency: "JPY" },
  { bin: "352800", scheme: "JCB", type: "CREDIT", tier: "STANDARD", bank: "MUFG Bank, Ltd.", countryName: "Japan", countryCode: "JP", numericCode: "392", currency: "JPY" },
  { bin: "305693", scheme: "DINERS", type: "CHARGE", tier: "CORPORATE", bank: "Diners Club International", countryName: "United States", countryCode: "US", numericCode: "840", currency: "USD" },
  { bin: "620000", scheme: "UNIONPAY", type: "CREDIT", tier: "DIAMOND", bank: "UnionPay International", countryName: "China", countryCode: "CN", numericCode: "156", currency: "CNY" },
  { bin: "621234", scheme: "UNIONPAY", type: "DEBIT", tier: "CLASSIC", bank: "Bank of China", countryName: "China", countryCode: "CN", numericCode: "156", currency: "CNY" },
  // Vietnam Banks
  { bin: "970436", scheme: "NAPAS", type: "DEBIT", tier: "DOMESTIC", bank: "Vietcombank (VCB)", countryName: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  { bin: "970407", scheme: "NAPAS", type: "DEBIT", tier: "DOMESTIC", bank: "Techcombank (TCB)", countryName: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  { bin: "970422", scheme: "NAPAS", type: "DEBIT", tier: "DOMESTIC", bank: "MB Bank (Quân Đội)", countryName: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  { bin: "970415", scheme: "NAPAS", type: "DEBIT", tier: "DOMESTIC", bank: "VietinBank (CTG)", countryName: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  { bin: "970418", scheme: "NAPAS", type: "DEBIT", tier: "DOMESTIC", bank: "BIDV", countryName: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  { bin: "970405", scheme: "NAPAS", type: "DEBIT", tier: "DOMESTIC", bank: "Agribank (VBARD)", countryName: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  { bin: "970416", scheme: "NAPAS", type: "DEBIT", tier: "DOMESTIC", bank: "ACB (Á Châu)", countryName: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  { bin: "970432", scheme: "NAPAS", type: "DEBIT", tier: "DOMESTIC", bank: "VPBank", countryName: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  { bin: "970423", scheme: "NAPAS", type: "DEBIT", tier: "DOMESTIC", bank: "TPBank (Tiên Phong)", countryName: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  { bin: "970403", scheme: "NAPAS", type: "DEBIT", tier: "DOMESTIC", bank: "Sacombank (STB)", countryName: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  { bin: "970441", scheme: "NAPAS", type: "DEBIT", tier: "DOMESTIC", bank: "VIB (Quốc Tế)", countryName: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  { bin: "970437", scheme: "NAPAS", type: "DEBIT", tier: "DOMESTIC", bank: "HDBank", countryName: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  { bin: "970443", scheme: "NAPAS", type: "DEBIT", tier: "DOMESTIC", bank: "SHB (Sài Gòn - Hà Nội)", countryName: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  { bin: "970426", scheme: "NAPAS", type: "DEBIT", tier: "DOMESTIC", bank: "MSB (Hàng Hải)", countryName: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  { bin: "970448", scheme: "NAPAS", type: "DEBIT", tier: "DOMESTIC", bank: "OCB (Phương Đông)", countryName: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  { bin: "970440", scheme: "NAPAS", type: "DEBIT", tier: "DOMESTIC", bank: "SeABank", countryName: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  { bin: "970431", scheme: "NAPAS", type: "DEBIT", tier: "DOMESTIC", bank: "Eximbank", countryName: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  { bin: "970449", scheme: "NAPAS", type: "DEBIT", tier: "DOMESTIC", bank: "LPBank (Lộc Phát)", countryName: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  { bin: "970454", scheme: "NAPAS", type: "DEBIT", tier: "DIGITAL", bank: "Timo Digital Bank (BVBank)", countryName: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  { bin: "428310", scheme: "VISA", type: "DEBIT", tier: "PLATINUM", bank: "Vietcombank (VCB)", countryName: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  { bin: "422075", scheme: "VISA", type: "CREDIT", tier: "SIGNATURE", bank: "Techcombank (TCB)", countryName: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  { bin: "484803", scheme: "VISA", type: "CREDIT", tier: "PRIORITY", bank: "MB Bank", countryName: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  { bin: "520399", scheme: "MASTERCARD", type: "CREDIT", tier: "PLATINUM", bank: "VPBank", countryName: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
  { bin: "546034", scheme: "MASTERCARD", type: "DEBIT", tier: "DIGITAL", bank: "CAKE by VPBank", countryName: "Vietnam", countryCode: "VN", numericCode: "704", currency: "VND" },
];

const SANDBOX_TEST_SUITE = [
  { pan: "4242424242424242", mm: "12", yy: "29", cvv: "123", scheme: "VISA", status: "LIVE", code: "approved", desc: "Thanh toán thành công chuẩn (Approved 200 OK)" },
  { pan: "5555555555554444", mm: "08", yy: "29", cvv: "456", scheme: "MASTERCARD", status: "LIVE", code: "approved", desc: "Mastercard Credit thành công (Approved)" },
  { pan: "2223003122003222", mm: "10", yy: "30", cvv: "789", scheme: "MASTERCARD", status: "LIVE", code: "approved_2series", desc: "Mastercard dải đầu 2-Series thành công" },
  { pan: "378282246310005", mm: "11", yy: "29", cvv: "8421", scheme: "AMEX", status: "LIVE", code: "approved", desc: "Amex 15 số + CID 4 số thành công" },
  { pan: "4000002500003155", mm: "06", yy: "29", cvv: "315", scheme: "VISA", status: "LIVE", code: "requires_action_3ds", desc: "Yêu cầu xác thực 3D Secure 2 (OTP / Biometric)" },
  { pan: "4000000000009995", mm: "05", yy: "29", cvv: "995", scheme: "VISA", status: "DEAD", code: "insufficient_funds", desc: "Từ chối: Không đủ số dư (Insufficient Funds)" },
  { pan: "4000000000000127", mm: "09", yy: "29", cvv: "000", scheme: "VISA", status: "DEAD", code: "incorrect_cvc", desc: "Từ chối: Sai mã bảo mật CVC/CVV" },
  { pan: "4000000000000051", mm: "01", yy: "28", cvv: "051", scheme: "VISA", status: "DEAD", code: "expired_card", desc: "Từ chối: Kịch bản thẻ hết hạn phát hành" },
  { pan: "4000000000000069", mm: "04", yy: "29", cvv: "069", scheme: "VISA", status: "DEAD", code: "lost_card", desc: "Từ chối: Thẻ báo mất (Lost Card)" },
  { pan: "4000000000000002", mm: "12", yy: "29", cvv: "102", scheme: "VISA", status: "DEAD", code: "card_declined", desc: "Từ chối chung từ ngân hàng phát hành (Generic Decline)" },
];

const SANDBOX_MAP = new Map(SANDBOX_TEST_SUITE.map((item) => [item.pan, item]));

// ============================================================================
// 2. CORE ALGORITHMS
// ============================================================================
function getMiiDescription(firstDigit) {
  const map = {
    "0": "0 - ISO/IEC 7810 Standard",
    "1": "1 - Hàng không (Airlines)",
    "2": "2 - Hàng không & Tài chính (Mastercard 2-Series)",
    "3": "3 - Du lịch & Giải trí (Amex / JCB / Diners)",
    "4": "4 - Ngân hàng & Tài chính (Visa)",
    "5": "5 - Ngân hàng & Tài chính (Mastercard 5-Series)",
    "6": "6 - Thương mại & Ngân hàng (Discover / UnionPay)",
    "7": "7 - Dầu khí & Nhiên liệu",
    "8": "8 - Viễn thông & Y tế",
    "9": "9 - Cơ quan tiêu chuẩn quốc gia (NAPAS VN...)",
  };
  return map[String(firstDigit)] || "Không xác định";
}

function detectCardNetwork(digits) {
  const d = onlyDigits(digits);
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

function getNetworkLengthSpec(scheme) {
  const s = String(scheme || "").toUpperCase();
  if (s === "AMEX") return { panLen: "15 chữ số (4-6-5)", cvvLen: "4 số (CID)", defaultLen: 15 };
  if (s === "NAPAS") return { panLen: "16 hoặc 19 chữ số", cvvLen: "3 số / OTP", defaultLen: 16 };
  if (s === "DINERS") return { panLen: "14–16 chữ số", cvvLen: "3 số", defaultLen: 16 };
  return { panLen: "16 chữ số (4-4-4-4)", cvvLen: "3 số (CVV2/CVC2)", defaultLen: 16 };
}

function formatCardNumberDisplay(cleanDigits, scheme) {
  const s = String(scheme || detectCardNetwork(cleanDigits)).toUpperCase();
  if (s === "AMEX") {
    const padded = (cleanDigits + "•".repeat(Math.max(0, 15 - cleanDigits.length))).slice(0, 15);
    return `${padded.slice(0, 4)} ${padded.slice(4, 10)} ${padded.slice(10, 15)}`;
  }
  const target = cleanDigits.length > 16 ? 19 : 16;
  const padded = (cleanDigits + "•".repeat(Math.max(0, target - cleanDigits.length))).slice(0, target);
  return padded.replace(/(.{4})(?=.)/g, "$1 ");
}

function computeExpectedCheckDigit(prefixWithoutLast) {
  const clean = onlyDigits(prefixWithoutLast);
  if (!clean.length) return null;
  let sum = 0;
  let shouldDouble = true;
  for (let i = clean.length - 1; i >= 0; i--) {
    let d = parseInt(clean.charAt(i), 10);
    if (shouldDouble) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    shouldDouble = !shouldDouble;
  }
  return (10 - (sum % 10)) % 10;
}

function checkLuhnDetailed(numberStr) {
  const clean = onlyDigits(numberStr);
  const steps = [];
  let sum = 0;
  let shouldDouble = false;

  for (let i = clean.length - 1; i >= 0; i--) {
    const orig = parseInt(clean.charAt(i), 10);
    let transformed = orig;
    if (shouldDouble) {
      transformed = orig * 2;
      if (transformed > 9) transformed -= 9;
    }
    sum += transformed;
    steps.unshift({ pos: i + 1, orig, doubled: shouldDouble, transformed });
    shouldDouble = !shouldDouble;
  }

  if (clean.length < 13 || clean.length > 19) {
    return {
      valid: false,
      sum,
      steps,
      expectedLast: clean.length >= 12 ? computeExpectedCheckDigit(clean.slice(0, -1)) : null,
      reason: `Đang nhập ${clean.length} số (Thẻ đầy đủ cần 13–19 số)`,
    };
  }

  const valid = sum % 10 === 0;
  const expectedLast = computeExpectedCheckDigit(clean.slice(0, -1));
  return {
    valid,
    sum,
    steps,
    expectedLast,
    reason: valid
      ? `Chuẩn Luhn 100% (Tổng Mod 10 = ${sum})`
      : `Sai số cuối! (Tổng = ${sum}, số cuối đúng phải là ${expectedLast})`,
  };
}

function checkExpiryOffline(mm, yy) {
  if (!mm || !yy) return { ok: true, label: "--" };
  const month = parseInt(mm, 10);
  let year = parseInt(yy, 10);
  if (isNaN(month) || month < 1 || month > 12) {
    return { ok: false, label: `Sai tháng (${escapeHtml(mm)})` };
  }
  if (year < 100) year += 2000;
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;
  if (year < curYear || (year === curYear && month < curMonth)) {
    return { ok: false, label: `Hết hạn (${String(month).padStart(2, "0")}/${year})` };
  }
  return { ok: true, label: `Còn hạn (${String(month).padStart(2, "0")}/${year})` };
}

function buildRegionalAdvice(meta) {
  const cc = (meta.countryCode || "").toUpperCase();
  const type = (meta.type || "").toUpperCase();
  const tier = (meta.tier || "").toUpperCase();
  const isPrepaid = type.includes("PREPAID") || tier.includes("PREPAID") || tier.includes("GIFT");
  const safeCountry = escapeHtml(meta.countryName || "Quốc tế");
  const safeCc = escapeHtml(cc || "--");

  let avsShort = "Không bắt buộc AVS Mỹ";
  let detail = "";

  if (["US", "CA", "GB"].includes(cc)) {
    avsShort = `⚠️ Bắt buộc AVS Zip Code (${cc})`;
    detail = `🐾 <strong>Phân tích Vùng của Neko:</strong> Đầu BIN đăng ký tại <strong>${safeCountry} (${safeCc})</strong> nên cổng thanh toán Mỹ/Anh/Canada sẽ kích hoạt kiểm tra <strong>AVS (Postal/Zip Code)</strong>. Nếu là dải BIN 8 số chia lại cho ngân hàng Châu Á (VD: <code>54243223</code>), hãy chuyển vùng thanh toán về Châu Á / Quốc tế để tránh lệch AVS!`;
  } else if (["VN", "SG", "TH", "MY", "PH", "NP", "JP", "KR"].includes(cc)) {
    avsShort = `✅ Cụm APAC (${cc}) - Không AVS`;
    detail = `🐾 <strong>Phân tích Vùng của Neko:</strong> Đầu BIN thuộc khu vực Châu Á - Thái Bình Dương (<strong>${safeCountry} - ${safeCc}</strong>): Không áp dụng kiểm tra AVS Zip Code kiểu Mỹ (thường ưu tiên 3DS2 OTP).`;
  } else {
    avsShort = `Vùng ${cc || "Quốc tế"}`;
    detail = `🐾 <strong>Phân tích Vùng của Neko:</strong> Đầu BIN thuộc <strong>${safeCountry} (${safeCc})</strong>. Hãy đối chiếu đúng Country/Currency khi cấu hình cổng thanh toán.`;
  }

  if (isPrepaid) {
    avsShort += " · ⚠️ Thẻ Prepaid";
    detail += `<br/>🍬 <strong>Chú ý:</strong> Đầu BIN mang cờ <code>PREPAID</code> (thẻ trả trước), các gói đăng ký gia hạn định kỳ (Recurring Subscription Trial) có thể chặn.`;
  }

  return { avsShort, detail, isPrepaid, requiresAvs: ["US", "CA", "GB"].includes(cc) };
}

function normalizeMetaFromServer(d, bin6, bin8) {
  return {
    bin6,
    bin8,
    scheme: d.brand || detectCardNetwork(bin8 || bin6),
    type: d.type || "UNKNOWN",
    tier: d.level || "--",
    bank: d.bank || "Chưa rõ ngân hàng",
    countryCode: d.countryCode || "--",
    countryName: d.country || "Chưa rõ",
    numericCode: d.numericCode || "--",
    currency: d.currency || "USD",
    source: d.source || "Cloud Live Registry",
  };
}

async function prefetchBinsBatch(rawNumbers) {
  if (!window.location.protocol.startsWith("http")) return;
  const missingKeys = [];
  for (const num of rawNumbers) {
    const clean = onlyDigits(num);
    if (clean.length < 6) continue;
    const key = clean.length >= 8 ? clean.slice(0, 8) : clean.slice(0, 6);
    if (!binCache.has(key)) missingKeys.push(key);
  }
  const uniqueMissing = [...new Set(missingKeys)];
  if (!uniqueMissing.length) return;

  for (let i = 0; i < uniqueMissing.length; i += 80) {
    const chunk = uniqueMissing.slice(i, i + 80);
    try {
      const res = await fetch("/api/check-bin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bins: chunk }),
      });
      if (res.ok) {
        const payload = await res.json();
        if (payload.results) {
          for (const [k, info] of Object.entries(payload.results)) {
            binCache.set(k, normalizeMetaFromServer(info, k.slice(0, 6), k.slice(0, 8)));
          }
        }
      }
    } catch (_) {}
  }
}

async function lookupPublicBin(rawNumber) {
  const clean = onlyDigits(rawNumber);
  const bin6 = clean.slice(0, 6);
  const bin8 = clean.slice(0, 8);
  if (bin6.length < 6) {
    throw new Error("Cần nhập tối thiểu 6 chữ số đầu để tra cứu BIN.");
  }

  const cacheKey = bin8.length === 8 ? bin8 : bin6;
  if (binCache.has(cacheKey)) {
    return binCache.get(cacheKey);
  }

  const localMatch = BIN_DATABASE.find((b) => b.bin === bin8) || BIN_DATABASE.find((b) => b.bin === bin6);
  let meta = {
    bin6,
    bin8,
    scheme: localMatch?.scheme || detectCardNetwork(clean),
    type: localMatch?.type || "UNKNOWN",
    tier: localMatch?.tier || "--",
    bank: localMatch?.bank || "Chưa rõ ngân hàng",
    countryCode: localMatch?.countryCode || "--",
    countryName: localMatch?.countryName || "Chưa rõ",
    numericCode: localMatch?.numericCode || "--",
    currency: localMatch?.currency || "USD",
    source: localMatch ? "Offline Built-in Registry" : "ISO Prefix Inference",
  };

  if (localMatch) {
    binCache.set(cacheKey, meta);
    return meta;
  }

  if (window.location.protocol.startsWith("http")) {
    try {
      const res = await fetch("/api/check-bin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bin: cacheKey }),
      });
      if (res.ok) {
        const d = await res.json();
        meta = normalizeMetaFromServer(d, bin6, bin8);
        binCache.set(cacheKey, meta);
        return meta;
      }
    } catch (_) {}
  }

  binCache.set(cacheKey, meta);
  return meta;
}

function parseLineInput(line) {
  const parts = String(line || "")
    .trim()
    .split(/[|,:;\s]+/)
    .filter(Boolean);
  const num = onlyDigits(parts[0] || "");
  let mm = "";
  let yy = "";
  let cvv = "";
  if (parts.length >= 4) {
    mm = onlyDigits(parts[1]).padStart(2, "0");
    yy = onlyDigits(parts[2]).slice(-2);
    cvv = onlyDigits(parts[3]);
  } else if (parts.length >= 3) {
    if (parts[1].includes("/")) {
      const [m, y] = parts[1].split("/");
      mm = onlyDigits(m).padStart(2, "0");
      yy = onlyDigits(y).slice(-2);
      cvv = onlyDigits(parts[2]);
    } else {
      mm = onlyDigits(parts[1]).padStart(2, "0");
      yy = onlyDigits(parts[2]).slice(-2);
    }
  } else if (parts.length === 2 && parts[1].includes("/")) {
    const [m, y] = parts[1].split("/");
    mm = onlyDigits(m).padStart(2, "0");
    yy = onlyDigits(y).slice(-2);
  }
  return { rawLine: String(line || "").trim(), num, mm, yy, cvv };
}

// Smart Extractor: extracts PAN|MM|YY|CVV or 6-8 digit BINs from unstructured messy text
function extractCardsAndBinsFromMessyText(rawText) {
  const results = [];
  const text = String(rawText || "");
  // 1. Match full cards with optional MM/YY/CVV nearby
  const cardRegex = /\b(\d{13,19})(?:[\s|/,:-]+(\d{1,2})[\s|/,:-]+(\d{2,4})(?:[\s|/,:-]+(\d{3,4}))?)?\b/g;
  let match;
  const matchedSpans = [];
  while ((match = cardRegex.exec(text)) !== null) {
    const pan = match[1];
    const mm = match[2] ? match[2].padStart(2, "0") : "";
    const yy = match[3] ? match[3].slice(-2) : "";
    const cvv = match[4] || "";
    if (mm && yy) {
      results.push(`${pan}|${mm}|${yy}${cvv ? "|" + cvv : ""}`);
    } else {
      results.push(pan);
    }
    matchedSpans.push([match.index, match.index + match[0].length]);
  }

  // 2. Match standalone 6-8 digit BINs not inside matched spans
  const binRegex = /\b(\d{6,8})\b/g;
  while ((match = binRegex.exec(text)) !== null) {
    const idx = match.index;
    const insideCard = matchedSpans.some(([s, e]) => idx >= s && idx < e);
    if (!insideCard) {
      results.push(match[1]);
    }
  }
  return [...new Set(results)];
}

function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = `🐾 ${msg}`;
  t.classList.remove("hidden");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => t.classList.add("hidden"), 2300);
}

// ============================================================================
// 3. TAB NAVIGATION
// ============================================================================
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    playChibiSfx("pop");
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab)?.classList.add("active");
  });
});

// ============================================================================
// 4. TAB 1: BINCODES & 3D HOLOGRAPHIC CARD INSPECTOR + HISTORY
// ============================================================================
function loadRecentHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.history) || "[]");
  } catch {
    return [];
  }
}

function pushRecentHistory(val) {
  const clean = onlyDigits(val).slice(0, 8);
  if (clean.length < 6) return;
  const list = [clean, ...loadRecentHistory().filter((x) => x !== clean)].slice(0, 7);
  try {
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(list));
  } catch (_) {}
  renderRecentHistory();
}

function renderRecentHistory() {
  const list = loadRecentHistory();
  const bar = document.getElementById("recentHistoryBar");
  const wrap = document.getElementById("recentHistoryChips");
  if (!bar || !wrap) return;
  if (!list.length) {
    bar.classList.add("hidden");
    return;
  }
  bar.classList.remove("hidden");
  wrap.innerHTML = list
    .map((b) => `<button type="button" class="chip hist-chip" data-hval="${escapeHtml(b)}">${escapeHtml(b)}</button>`)
    .join("");
  wrap.querySelectorAll(".hist-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.getElementById("singleBinInput").value = btn.dataset.hval;
      inspectSingle();
    });
  });
}

document.getElementById("btnClearHistory")?.addEventListener("click", () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.history);
  } catch (_) {}
  renderRecentHistory();
  showToast("Đã xóa lịch sử soi BIN!");
});

// 3D Card Flip & Subtle Tilt
const flipperEl = document.getElementById("visualCardFlipper");
const sceneEl = document.getElementById("visualCardScene");

document.getElementById("btnFlipCard")?.addEventListener("click", () => {
  playChibiSfx("pop");
  flipperEl.classList.toggle("is-flipped");
});

flipperEl?.addEventListener("click", () => {
  playChibiSfx("pop");
  flipperEl.classList.toggle("is-flipped");
});

sceneEl?.addEventListener("mousemove", (e) => {
  if (flipperEl.classList.contains("is-flipped")) return;
  const rect = sceneEl.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width - 0.5;
  const y = (e.clientY - rect.top) / rect.height - 0.5;
  flipperEl.style.transform = `rotateY(${x * 12}deg) rotateX(${-y * 10}deg)`;
});

sceneEl?.addEventListener("mouseleave", () => {
  flipperEl.style.transform = flipperEl.classList.contains("is-flipped") ? "rotateY(180deg)" : "";
});

function renderAnatomyAndSteps(cleanDigits, luhnObj) {
  const first = cleanDigits.charAt(0) || "-";
  const iin = cleanDigits.slice(0, Math.min(8, cleanDigits.length)) || "------";
  const acc =
    cleanDigits.length > 9
      ? cleanDigits.slice(8, cleanDigits.length - 1)
      : "-- (Chưa đủ dãy thẻ) --";
  const last = cleanDigits.length >= 13 ? cleanDigits.slice(-1) : "-";

  document.getElementById("anatMii").textContent = first;
  document.getElementById("anatIin").textContent = iin;
  document.getElementById("anatAcc").textContent = acc;
  document.getElementById("anatCheck").textContent = last;

  const expEl = document.getElementById("expectedCheckDigitText");
  if (cleanDigits.length >= 13 && luhnObj.expectedLast !== null) {
    expEl.textContent = `Tổng Luhn = ${luhnObj.sum} · Số cuối chuẩn = ${luhnObj.expectedLast}`;
  } else {
    expEl.textContent = `Đang soi ${cleanDigits.length} chữ số đầu (Mã BIN)`;
  }

  const box = document.getElementById("luhnStepsBox");
  box.innerHTML = "";
  luhnObj.steps.forEach((st) => {
    const div = document.createElement("div");
    div.className = "luhn-cell" + (st.doubled ? " doubled" : "");
    div.innerHTML = `
      <div class="luhn-orig">#${st.pos} (${st.orig}${st.doubled ? "×2" : ""})</div>
      <div class="luhn-res">${st.transformed}</div>
    `;
    box.appendChild(div);
  });
}

function updateVisualCard(parsed, meta, advice) {
  const { num, mm, yy, cvv } = parsed;
  const vc = document.getElementById("visualCard");
  const scheme = (meta?.scheme || detectCardNetwork(num)).toUpperCase();
  const lenSpec = getNetworkLengthSpec(scheme);

  vc.className = "visual-card visual-card-front";
  if (scheme.includes("VISA")) vc.classList.add("brand-visa");
  else if (scheme.includes("MASTER")) vc.classList.add("brand-mastercard");
  else if (scheme.includes("AMEX")) vc.classList.add("brand-amex");
  else if (scheme.includes("NAPAS")) vc.classList.add("brand-napas");
  else if (scheme.includes("JCB") || scheme.includes("DISCOVER")) vc.classList.add("brand-jcb");

  document.getElementById("vcScheme").textContent = scheme;
  document.getElementById("vcPan").textContent = formatCardNumberDisplay(num, scheme);
  document.getElementById("vcExp").textContent = mm && yy ? `${mm}/${yy}` : "12/29";
  document.getElementById("vcLen").textContent = `${num.length >= 13 ? num.length : lenSpec.defaultLen} SỐ`;
  document.getElementById("vcBank").textContent = meta?.bank || "Đang tra cứu...";
  document.getElementById("vcCountry").textContent = meta
    ? `${meta.countryName} (${meta.countryCode}) · ${meta.tier}`
    : "--";

  // Back face details
  document.getElementById("vcCvvBack").textContent = cvv || (scheme === "AMEX" ? "8888" : "888");
  document.getElementById("vcBackMii").textContent = getMiiDescription(num.charAt(0));
  document.getElementById("vcBackAvs").textContent = advice?.avsShort || "--";
  document.getElementById("vcBackCurr").textContent = meta ? `${meta.currency} (ISO ${meta.numericCode})` : "--";
}

async function inspectSingle(silent = false) {
  const raw = document.getElementById("singleBinInput").value.trim();
  const parsed = parseLineInput(raw);
  const { num } = parsed;
  if (num.length < 6) {
    if (!silent) {
      playChibiSfx("oops");
      showToast("Nhập ít nhất 6 chữ số đầu của BIN nha!");
    }
    return;
  }

  const badge = document.getElementById("binStatusBadge");
  badge.textContent = "⏳ Neko đang soi...";
  badge.className = "tag tag-amber";

  const luhn = checkLuhnDetailed(num);
  renderAnatomyAndSteps(num, luhn);
  updateVisualCard(parsed, null, null);

  try {
    const meta = await lookupPublicBin(num);
    const advice = buildRegionalAdvice(meta);
    const lenSpec = getNetworkLengthSpec(meta.scheme);
    updateVisualCard(parsed, meta, advice);
    pushRecentHistory(num);

    document.getElementById("valBinPrefix").textContent =
      meta.bin8.length === 8 ? `${meta.bin6} (8-số: ${meta.bin8})` : meta.bin6;
    document.getElementById("valMii").textContent = getMiiDescription(num.charAt(0));
    document.getElementById("valScheme").textContent = meta.scheme;
    document.getElementById("valType").innerHTML = `<span class="tag ${
      meta.type.includes("PREPAID") ? "tag-amber" : "tag-green"
    }">${escapeHtml(meta.type)}</span>`;
    document.getElementById("valTier").textContent = meta.tier;
    document.getElementById("valBank").textContent = meta.bank;
    document.getElementById("valCountry").textContent = `${meta.countryName} (${meta.countryCode})`;
    document.getElementById("valCurrency").textContent = `${meta.currency} (ISO: ${meta.numericCode})`;
    document.getElementById("valLengthSpec").textContent = `${lenSpec.panLen} · ${lenSpec.cvvLen}`;
    document.getElementById("valLuhn").innerHTML =
      num.length >= 13
        ? `<span class="tag ${luhn.valid ? "tag-green" : "tag-red"}">${escapeHtml(luhn.reason)}</span>`
        : `<span style="opacity:0.8">${escapeHtml(luhn.reason)}</span>`;
    document.getElementById("valAvsPolicy").textContent = advice.avsShort;
    document.getElementById("valSource").textContent = meta.source || "Combined Registry";
    document.getElementById("regionAdviceBox").innerHTML = advice.detail;

    badge.textContent = "💖 Đã soi xong!";
    badge.className = "tag tag-green";

    if (!silent) {
      if (num.length >= 13 && !luhn.valid) {
        playChibiSfx("oops");
        setChibiReaction(
          "🙀 Ối Sai Luhn!",
          "Cần sửa số cuối",
          `Dãy thẻ này đang sai số cuối (tổng Mod 10 = <strong>${luhn.sum}</strong>). Chữ số cuối đúng phải là <code>${luhn.expectedLast}</code>! Bấm nút <strong>🪄 Tự Điền / Sửa Số Cuối Luhn</strong> để Neko sửa ngay nhé!`
        );
      } else if (num.length >= 13 && luhn.valid) {
        playChibiSfx("magic");
        setChibiReaction(
          "😻 Yay! Chuẩn Luhn!",
          `${meta.scheme} · ${meta.countryCode}`,
          `Tuyệt vời! Thẻ <strong>${escapeHtml(meta.scheme)}</strong> của <strong>${escapeHtml(meta.bank)} (${escapeHtml(meta.countryName)})</strong> vượt qua bài toán Luhn 100%! ✨💖`
        );
      } else {
        playChibiSfx("pop");
        setChibiReaction(
          "🕵️‍♀️ Thám tử Neko",
          `Đã nhận diện BIN ${meta.bin8 || meta.bin6}`,
          `Đầu BIN <code>${escapeHtml(meta.bin8 || meta.bin6)}</code> thuộc <strong>${escapeHtml(meta.bank)} (${escapeHtml(meta.countryName)})</strong>, loại thẻ <strong>${escapeHtml(meta.type)} (${escapeHtml(meta.tier)})</strong> nha! 🐾`
        );
      }
    }
  } catch (_) {
    badge.textContent = "💥 Lỗi tra cứu";
    badge.className = "tag tag-red";
  }
}

document.getElementById("btnInspectSingle")?.addEventListener("click", () => inspectSingle(false));
document.getElementById("singleBinInput")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") inspectSingle(false);
});

// Live debounced preview when typing >= 6 digits
let liveInspectTimer = null;
document.getElementById("singleBinInput")?.addEventListener("input", (e) => {
  clearTimeout(liveInspectTimer);
  const d = onlyDigits(e.target.value);
  if (d.length >= 6) {
    liveInspectTimer = setTimeout(() => inspectSingle(true), 320);
  }
});

document.querySelectorAll(".inspector-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.getElementById("singleBinInput").value = chip.dataset.val;
    inspectSingle(false);
  });
});

document.getElementById("btnFixLuhnSingle")?.addEventListener("click", () => {
  const input = document.getElementById("singleBinInput");
  const parsed = parseLineInput(input.value);
  let digits = parsed.num;
  if (digits.length < 6) return showToast("Nhập ít nhất 6 chữ số BIN trước nha!");

  const network = detectCardNetwork(digits);
  const targetLen = network === "AMEX" ? 15 : 16;

  if (digits.length < targetLen) {
    while (digits.length < targetLen - 1) {
      digits += String(csprngInt(10));
    }
    digits += String(computeExpectedCheckDigit(digits));
  } else {
    const prefix = digits.slice(0, -1);
    digits = prefix + String(computeExpectedCheckDigit(prefix));
  }
  input.value = parsed.mm && parsed.yy ? `${digits}|${parsed.mm}|${parsed.yy}${parsed.cvv ? "|" + parsed.cvv : ""}` : digits;
  inspectSingle(false);
  showToast(`Đã điền/sửa chuẩn Luhn! Số cuối: ${digits.slice(-1)} ✨`);
});

document.getElementById("btnGenFromThisBin")?.addEventListener("click", () => {
  const digits = onlyDigits(document.getElementById("singleBinInput").value);
  const prefix = digits.slice(0, Math.min(8, digits.length)) || "54243223";
  const network = detectCardNetwork(prefix);
  const len = network === "AMEX" ? 15 : 16;
  document.getElementById("gen-bin").value = prefix + "x".repeat(Math.max(0, len - prefix.length));
  document.querySelector('.tab-btn[data-tab="tab-generator"]').click();
  document.getElementById("btn-generate").click();
});

document.getElementById("btnSendToCompare")?.addEventListener("click", () => {
  const digits = onlyDigits(document.getElementById("singleBinInput").value).slice(0, 8);
  if (digits.length >= 6) {
    document.getElementById("cmpBinB").value = digits;
  }
  document.querySelector('.tab-btn[data-tab="tab-compare"]').click();
  runBinComparison();
});

document.getElementById("btnCopyBinReport")?.addEventListener("click", () => {
  playChibiSfx("pop");
  const report = [
    `BIN Prefix : ${document.getElementById("valBinPrefix").textContent}`,
    `MII        : ${document.getElementById("valMii").textContent}`,
    `Scheme     : ${document.getElementById("valScheme").textContent}`,
    `Type/Tier  : ${document.getElementById("valType").textContent} / ${document.getElementById("valTier").textContent}`,
    `Bank       : ${document.getElementById("valBank").textContent}`,
    `Country    : ${document.getElementById("valCountry").textContent}`,
    `Currency   : ${document.getElementById("valCurrency").textContent}`,
    `Length/CVV : ${document.getElementById("valLengthSpec").textContent}`,
    `Luhn Check : ${document.getElementById("valLuhn").textContent}`,
    `AVS Policy : ${document.getElementById("valAvsPolicy").textContent}`,
  ].join("\n");
  navigator.clipboard.writeText(report);
  showToast("Đã copy Hồ sơ BIN vào bộ nhớ tạm!");
});

// ============================================================================
// 5. TAB 2: CONCURRENT 6X BULK CHECKER + SMART EXTRACTOR + PROGRESS BAR
// ============================================================================
let bulkResults = [];
let currentFilter = "ALL";
let bulkSearchQuery = "";

const bulkInputEl = document.getElementById("bulk-input");
const bulkLineCountEl = document.getElementById("bulk-line-count");
const checkModeEl = document.getElementById("check-mode");
const customApiWrapEl = document.getElementById("custom-api-wrap");
const stripeKeyWrapEl = document.getElementById("stripe-key-wrap");

function updateBulkLineCount() {
  const lines = bulkInputEl.value
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  bulkLineCountEl.textContent = lines.length;
}

bulkInputEl?.addEventListener("input", updateBulkLineCount);

checkModeEl?.addEventListener("change", () => {
  customApiWrapEl.classList.toggle("hidden", checkModeEl.value !== "custom_api");
  stripeKeyWrapEl.classList.toggle("hidden", checkModeEl.value !== "stripe_key");
});

document.getElementById("file-upload")?.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    bulkInputEl.value = reader.result;
    updateBulkLineCount();
    playChibiSfx("magic");
    showToast(`Đã nạp file ${file.name}`);
  };
  reader.readAsText(file);
});

document.getElementById("btn-sample-bulk")?.addEventListener("click", () => {
  playChibiSfx("pop");
  bulkInputEl.value = [
    "54243223",
    "414720",
    "4242424242424242|12|29|123",
    "5555555555554444|09|29|888",
    "4000002500003155|06|29|315",
    "4000000000009995|05|29|995",
    "4903011234567893|05|28|412",
    "9704361234567895|04|30|999",
  ].join("\n");
  updateBulkLineCount();
  showToast("Đã đổ bộ dữ liệu mẫu vào giỏ!");
});

document.getElementById("btn-smart-extract")?.addEventListener("click", () => {
  const extracted = extractCardsAndBinsFromMessyText(bulkInputEl.value);
  if (!extracted.length) {
    playChibiSfx("oops");
    return showToast("Không tìm thấy số thẻ hay mã BIN 6–8 số nào trong văn bản!");
  }
  playChibiSfx("magic");
  bulkInputEl.value = extracted.join("\n");
  updateBulkLineCount();
  showToast(`Đã bóc tách sạch sẽ ${extracted.length} dòng thẻ / BIN!`);
});

document.getElementById("btn-fix-bulk-luhn")?.addEventListener("click", () => {
  playChibiSfx("magic");
  const lines = bulkInputEl.value.split(/\r?\n/);
  let fixedCount = 0;
  const updated = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return "";
    const parsed = parseLineInput(trimmed);
    if (parsed.num.length >= 13 && parsed.num.length <= 19) {
      const prefix = parsed.num.slice(0, -1);
      const correctLast = computeExpectedCheckDigit(prefix);
      const fixedPan = prefix + String(correctLast);
      if (fixedPan !== parsed.num) fixedCount++;
      if (parsed.mm && parsed.yy) {
        return `${fixedPan}|${parsed.mm}|${parsed.yy}${parsed.cvv ? "|" + parsed.cvv : ""}`;
      }
      return fixedPan;
    }
    return trimmed;
  });
  bulkInputEl.value = updated.filter(Boolean).join("\n");
  updateBulkLineCount();
  showToast(`Phép thuật đã sửa đúng Luhn cho ${fixedCount} thẻ!`);
});

document.getElementById("btn-clear-bulk")?.addEventListener("click", () => {
  playChibiSfx("pop");
  bulkAbortRequested = true;
  bulkInputEl.value = "";
  bulkResults = [];
  updateBulkLineCount();
  document.getElementById("bulkProgressWrap")?.classList.add("hidden");
  renderBulkResults();
});

document.getElementById("btn-stop-bulk")?.addEventListener("click", () => {
  bulkAbortRequested = true;
  showToast("Đã dừng tiến trình kiểm tra!");
});

document.getElementById("bulkSearchInput")?.addEventListener("input", (e) => {
  bulkSearchQuery = e.target.value.trim().toLowerCase();
  renderBulkResults();
});

function maskPan(pan) {
  const d = onlyDigits(pan);
  if (d.length < 10) return d;
  return d.slice(0, 6) + "*".repeat(d.length - 10) + d.slice(-4);
}

async function analyzeSingleBulkLine(parsed, mode, checkExp, customUrl, stripeKey) {
  const { num, mm, yy, cvv } = parsed;
  const meta = await lookupPublicBin(num);
  const luhn = checkLuhnDetailed(num);
  const exp = checkExpiryOffline(mm, yy);
  const advice = buildRegionalAdvice(meta);

  if (num.length < 13) {
    return { category: "BIN", parsed, meta, luhn, exp, advice, note: advice.avsShort };
  }

  if (!luhn.valid) {
    return {
      category: "DEAD",
      parsed,
      meta,
      luhn,
      exp,
      advice,
      note: `Sai Luhn (Số cuối đúng: ${luhn.expectedLast}) · ${advice.avsShort}`,
    };
  }

  if (checkExp && !exp.ok) {
    return {
      category: "DEAD",
      parsed,
      meta,
      luhn,
      exp,
      advice,
      note: `${exp.label} · ${advice.avsShort}`,
    };
  }

  if (mode === "stripe_key" && stripeKey && window.location.protocol.startsWith("http")) {
    try {
      const res = await fetch("/api/check-card-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardNumber: num, mm, yy, cvv, stripeKey }),
      });
      const data = await res.json();
      return {
        category: data.status === "LIVE" ? "LIVE" : "DEAD",
        parsed,
        meta,
        luhn,
        exp,
        advice,
        note: `${data.message || data.error || data.responseCode} · ${advice.avsShort}`,
      };
    } catch (e) {
      return { category: "DEAD", parsed, meta, luhn, exp, advice, note: `Lỗi kết nối: ${e.message}` };
    }
  }

  if (mode === "stripe_sim") {
    const sc = SANDBOX_MAP.get(num);
    if (sc) {
      return {
        category: sc.status,
        parsed,
        meta,
        luhn,
        exp,
        advice,
        note: `${sc.desc} (${sc.code}) · ${advice.avsShort}`,
      };
    }
    return {
      category: "DEAD",
      parsed,
      meta,
      luhn,
      exp,
      advice,
      note: `Declined (Do Not Honor - Không nằm trong tập thẻ Sandbox Approved) · ${advice.avsShort}`,
    };
  }

  if (mode === "custom_api" && customUrl) {
    try {
      const res = await fetch(customUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardNumber: num, mm, yy, cvv }),
      });
      const data = await res.json();
      const ok = data.status === "LIVE" || data.live === true || data.valid === true;
      return {
        category: ok ? "LIVE" : "DEAD",
        parsed,
        meta,
        luhn,
        exp,
        advice,
        note: `${data.message || (ok ? "API LIVE" : "API DEAD")} · ${advice.avsShort}`,
      };
    } catch (e) {
      return { category: "DEAD", parsed, meta, luhn, exp, advice, note: `Lỗi Webhook: ${e.message}` };
    }
  }

  return { category: "LIVE", parsed, meta, luhn, exp, advice, note: advice.avsShort };
}

document.getElementById("btn-start-bulk")?.addEventListener("click", async () => {
  let rawLines = bulkInputEl.value
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (!rawLines.length) {
    playChibiSfx("oops");
    showToast("Giỏ đang trống trơn, nhập ít nhất 1 dòng nha!");
    return;
  }

  if (document.getElementById("opt-dedup").checked) {
    rawLines = [...new Set(rawLines)];
  }

  const parsedItems = rawLines.map(parseLineInput).filter((p) => p.num.length >= 6);
  if (!parsedItems.length) {
    playChibiSfx("oops");
    return showToast("Không có dòng nào đủ 6 chữ số hợp lệ!");
  }

  const checkExp = document.getElementById("opt-check-exp").checked;
  const mode = checkModeEl.value;
  const customUrl = document.getElementById("custom-api-url").value.trim();
  const stripeKey = document.getElementById("stripe-secret-key").value.trim();

  bulkAbortRequested = false;
  bulkResults = new Array(parsedItems.length);

  const progWrap = document.getElementById("bulkProgressWrap");
  const progBar = document.getElementById("bulkProgressBar");
  const progPct = document.getElementById("bulkProgressPct");
  const progLabel = document.getElementById("bulkProgressLabel");
  const stopBtn = document.getElementById("btn-stop-bulk");
  const startBtn = document.getElementById("btn-start-bulk");

  progWrap.classList.remove("hidden");
  stopBtn.classList.remove("hidden");
  startBtn.disabled = true;
  progBar.style.width = "5%";
  progPct.textContent = "5%";
  progLabel.textContent = "☁️ Đang gom nhóm & tải trước dữ liệu BIN siêu tốc...";

  const t0 = performance.now();
  // Step 1: Batch prefetch all unique BINs in 1 cloud call
  await prefetchBinsBatch(parsedItems.map((p) => p.num));

  // Step 2: 6x Concurrent Worker Pool with throttled UI updates
  let cursor = 0;
  let completed = 0;
  let lastRenderTime = 0;
  const CONCURRENCY = 6;

  async function worker() {
    while (!bulkAbortRequested) {
      const idx = cursor++;
      if (idx >= parsedItems.length) break;
      const item = await analyzeSingleBulkLine(parsedItems[idx], mode, checkExp, customUrl, stripeKey);
      bulkResults[idx] = item;
      completed++;

      const now = performance.now();
      if (now - lastRenderTime > 90 || completed === parsedItems.length) {
        lastRenderTime = now;
        const pct = Math.round((completed / parsedItems.length) * 100);
        progBar.style.width = `${pct}%`;
        progPct.textContent = `${pct}%`;
        progLabel.textContent = `⚡ Đã phân tích ${completed}/${parsedItems.length} dòng...`;
        renderBulkResults();
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, parsedItems.length) }, () => worker()));

  bulkResults = bulkResults.filter(Boolean);
  renderBulkResults();
  stopBtn.classList.add("hidden");
  startBtn.disabled = false;

  const elapsedSec = ((performance.now() - t0) / 1000).toFixed(2);
  progLabel.textContent = bulkAbortRequested
    ? `⏹️ Đã dừng ở ${bulkResults.length} dòng (${elapsedSec}s)`
    : `✅ Hoàn tất ${bulkResults.length} dòng trong ${elapsedSec}s!`;

  playChibiSfx("magic");
  const liveCount = bulkResults.filter((r) => r.category === "LIVE").length;
  setChibiReaction(
    "😻 Hoàn Tất Siêu Tốc!",
    `${bulkResults.length} dòng · ${elapsedSec}s`,
    `Báo cáo! Neko đã xử lý <strong>${bulkResults.length} dòng</strong> chỉ trong <strong>${elapsedSec}s</strong>, phát hiện <strong>${liveCount} thẻ Hợp lệ / LIVE</strong>! 🐾✨`
  );
  showToast(`Đã phân tích xong ${bulkResults.length} dòng (${elapsedSec}s)!`);
});

document.getElementById("opt-mask-pan")?.addEventListener("change", renderBulkResults);

document.querySelectorAll(".filter-pill[data-filter]").forEach((pill) => {
  pill.addEventListener("click", () => {
    playChibiSfx("pop");
    document.querySelectorAll(".filter-pill[data-filter]").forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");
    currentFilter = pill.dataset.filter;
    renderBulkResults();
  });
});

function formatPipeRow(parsed, masked) {
  const numStr = masked ? maskPan(parsed.num) : parsed.num;
  if (!parsed.mm && !parsed.yy) return numStr;
  return `${numStr}|${parsed.mm}|${parsed.yy}${parsed.cvv ? "|" + parsed.cvv : ""}`;
}

function renderBulkResults() {
  const tbody = document.getElementById("bulk-results-body");
  const maskEnabled = document.getElementById("opt-mask-pan").checked;
  const validList = bulkResults.filter(Boolean);

  const total = validList.length;
  const liveCount = validList.filter((r) => r.category === "LIVE").length;
  const binOnlyCount = validList.filter((r) => r.category === "BIN").length;
  const deadCount = validList.filter((r) => r.category === "DEAD").length;

  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-live").textContent = liveCount;
  document.getElementById("stat-binonly").textContent = binOnlyCount;
  document.getElementById("stat-dead").textContent = deadCount;
  document.getElementById("bulkSummaryText").textContent =
    `Tổng: ${total} dòng (💖 Hợp lệ: ${liveCount} · 🏷️ BIN: ${binOnlyCount} · 💥 Lỗi: ${deadCount})`;

  const filtered = validList.filter((r) => {
    if (currentFilter !== "ALL" && r.category !== currentFilter) return false;
    if (bulkSearchQuery) {
      const hay = `${r.parsed.num} ${r.meta.scheme} ${r.meta.type} ${r.meta.tier} ${r.meta.bank} ${r.meta.countryName} ${r.meta.countryCode} ${r.note}`.toLowerCase();
      if (!hay.includes(bulkSearchQuery)) return false;
    }
    return true;
  });

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="11" class="empty-cell">🐾 Không có dòng nào khớp bộ lọc hiện tại nha!</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered
    .map((r, i) => {
      const { parsed, meta, luhn, exp } = r;
      const luhnClass = parsed.num.length < 13 ? "tag-amber" : luhn.valid ? "tag-green" : "tag-red";
      const luhnLabel =
        parsed.num.length < 13
          ? "🏷️ Đầu BIN"
          : luhn.valid
          ? `💖 Hợp lệ (Σ=${luhn.sum})`
          : `💥 Sai (Đúng: ${luhn.expectedLast})`;
      const fullPipe = formatPipeRow(parsed, false);

      return `
        <tr data-inspect="${escapeHtml(fullPipe)}" title="Bấm để mở Giải phẫu chi tiết ISO/IEC 7812">
          <td class="mono">${i + 1}</td>
          <td><code>${escapeHtml(meta.bin8.length === 8 ? meta.bin8 : meta.bin6)}</code></td>
          <td class="mono"><strong>${escapeHtml(formatPipeRow(parsed, maskEnabled))}</strong></td>
          <td><strong>${escapeHtml(meta.scheme)}</strong></td>
          <td>${escapeHtml(meta.type)} · <span style="opacity:0.75">${escapeHtml(meta.tier)}</span></td>
          <td>${escapeHtml(meta.bank)}</td>
          <td>${escapeHtml(meta.countryName)} (<strong>${escapeHtml(meta.countryCode)}</strong>)</td>
          <td><span class="tag ${luhnClass}">${escapeHtml(luhnLabel)}</span></td>
          <td><span class="tag ${exp.ok ? "tag-green" : "tag-red"}">${exp.label}</span></td>
          <td>${escapeHtml(r.note)}</td>
          <td><button type="button" class="btn btn-sm btn-outline row-copy-btn" data-copy="${escapeHtml(fullPipe)}">📋</button></td>
        </tr>
      `;
    })
    .join("");

  tbody.querySelectorAll(".row-copy-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      playChibiSfx("pop");
      navigator.clipboard.writeText(btn.dataset.copy);
      showToast("Đã copy dòng thẻ!");
    });
  });

  tbody.querySelectorAll("tr[data-inspect]").forEach((tr) => {
    tr.addEventListener("click", () => {
      playChibiSfx("pop");
      document.getElementById("singleBinInput").value = tr.dataset.inspect;
      document.querySelector('.tab-btn[data-tab="tab-inspector"]').click();
      inspectSingle(false);
    });
  });
}

function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

document.getElementById("btn-copy-live")?.addEventListener("click", () => {
  const list = bulkResults
    .filter((r) => r && (r.category === "LIVE" || r.category === "BIN"))
    .map((r) => formatPipeRow(r.parsed, false));
  if (!list.length) return showToast("Chưa có dòng Hợp lệ / LIVE nào để copy!");
  playChibiSfx("magic");
  navigator.clipboard.writeText(list.join("\n"));
  showToast(`Đã copy ${list.length} dòng Hợp lệ!`);
});

document.getElementById("btn-export-txt")?.addEventListener("click", () => {
  const valid = bulkResults.filter(Boolean);
  if (!valid.length) return showToast("Chưa có dữ liệu để xuất!");
  const lines = valid.map(
    (r) =>
      `[${r.category}] ${formatPipeRow(r.parsed, false)} | BIN:${r.meta.bin8 || r.meta.bin6} | ${r.meta.scheme} | ${r.meta.type}/${r.meta.tier} | ${r.meta.bank} | ${r.meta.countryCode} | ${r.note}`
  );
  downloadFile(lines.join("\n"), `nekobin_bulk_${Date.now()}.txt`, "text/plain;charset=utf-8");
});

document.getElementById("btn-export-csv")?.addEventListener("click", () => {
  const valid = bulkResults.filter(Boolean);
  if (!valid.length) return showToast("Chưa có dữ liệu để xuất!");
  const header = ["Category", "Input", "BIN6", "BIN8", "Scheme", "Type", "Tier", "Bank", "Country", "CountryCode", "LuhnValid", "Expiry", "AVS_Note"];
  const rows = valid.map((r) => [
    r.category,
    formatPipeRow(r.parsed, false),
    r.meta.bin6,
    r.meta.bin8,
    r.meta.scheme,
    r.meta.type,
    r.meta.tier,
    r.meta.bank,
    r.meta.countryName,
    r.meta.countryCode,
    r.luhn.valid ? "PASS" : "FAIL",
    r.exp.label,
    r.note,
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  downloadFile(csv, `nekobin_bulk_${Date.now()}.csv`, "text/csv;charset=utf-8");
});

document.getElementById("btn-export-json")?.addEventListener("click", () => {
  const valid = bulkResults.filter(Boolean);
  if (!valid.length) return showToast("Chưa có dữ liệu để xuất!");
  downloadFile(JSON.stringify(valid, null, 2), `nekobin_bulk_${Date.now()}.json`, "application/json");
});

// ============================================================================
// 6. TAB 3: CSPRNG UNIQUE CARD GENERATOR PRO
// ============================================================================
document.querySelectorAll(".chip[data-bin]").forEach((chip) => {
  chip.addEventListener("click", () => {
    playChibiSfx("pop");
    document.getElementById("gen-bin").value = chip.dataset.bin;
  });
});

function generateSingleFromPattern(patternRaw, monthOpt, yearOpt, cvvOpt, lengthOpt = "auto") {
  let cleanPattern = String(patternRaw || "").trim().replace(/\s+/g, "");
  if (!cleanPattern) cleanPattern = "54243223xxxxxxxx";

  const digitsPrefix = onlyDigits(cleanPattern);
  const scheme = detectCardNetwork(digitsPrefix || "4");
  const targetLen =
    lengthOpt === "auto"
      ? scheme === "AMEX"
        ? 15
        : 16
      : parseInt(lengthOpt, 10) || 16;

  // Always pad short patterns (whether digits only or digits + x) to targetLen
  if (cleanPattern.length < targetLen) {
    cleanPattern = cleanPattern + "x".repeat(targetLen - cleanPattern.length);
  } else if (cleanPattern.length > targetLen && lengthOpt !== "auto") {
    cleanPattern = cleanPattern.slice(0, targetLen);
  }

  let body = "";
  for (let i = 0; i < cleanPattern.length - 1; i++) {
    const c = cleanPattern[i];
    body += /\d/.test(c) ? c : String(csprngInt(10));
  }
  const checkDigit = computeExpectedCheckDigit(body);
  const pan = body + String(checkDigit);

  const mm = monthOpt === "rnd" ? String(csprngInt(12) + 1).padStart(2, "0") : monthOpt;
  const yy = yearOpt === "rnd" ? String(csprngInt(6) + 27) : yearOpt;
  const cvvLen = scheme === "AMEX" ? 4 : 3;
  const cvv =
    cvvOpt && onlyDigits(cvvOpt)
      ? onlyDigits(cvvOpt)
      : Array.from({ length: cvvLen }, () => csprngInt(10)).join("");

  return { pan, mm, yy, cvv, scheme };
}

document.getElementById("btn-generate")?.addEventListener("click", () => {
  playChibiSfx("magic");
  const pattern = document.getElementById("gen-bin").value;
  const monthOpt = document.getElementById("gen-month").value;
  const yearOpt = document.getElementById("gen-year").value;
  const cvvOpt = document.getElementById("gen-cvv").value;
  const lengthOpt = document.getElementById("gen-length").value;
  const format = document.getElementById("gen-format").value;
  let qty = parseInt(document.getElementById("gen-qty").value, 10);
  if (isNaN(qty) || qty < 1) qty = 10;
  if (qty > 1000) qty = 1000;

  const list = [];
  const seenPans = new Set();
  let attempts = 0;
  while (list.length < qty && attempts < qty * 8) {
    attempts++;
    const card = generateSingleFromPattern(pattern, monthOpt, yearOpt, cvvOpt, lengthOpt);
    if (!seenPans.has(card.pan)) {
      seenPans.add(card.pan);
      list.push(card);
    }
  }

  let outputText = "";
  if (format === "pipe") {
    outputText = list.map((c) => `${c.pan}|${c.mm}|${c.yy}|${c.cvv}`).join("\n");
  } else if (format === "slash") {
    outputText = list.map((c) => `${c.pan}|${c.mm}/${c.yy}|${c.cvv}`).join("\n");
  } else if (format === "csv") {
    outputText = ["PAN,MM,YY,CVV,Scheme", ...list.map((c) => `${c.pan},${c.mm},${c.yy},${c.cvv},${c.scheme}`)].join("\n");
  } else if (format === "pan_only") {
    outputText = list.map((c) => c.pan).join("\n");
  } else if (format === "sql") {
    outputText =
      "INSERT INTO qa_test_cards (pan, exp_month, exp_year, cvv, scheme) VALUES\n" +
      list.map((c) => `  ('${c.pan}', '${c.mm}', '20${c.yy}', '${c.cvv}', '${c.scheme}')`).join(",\n") +
      ";";
  } else {
    outputText = JSON.stringify(list, null, 2);
  }

  document.getElementById("gen-output").value = outputText;
  document.getElementById("gen-count-badge").textContent = list.length;
  setChibiReaction(
    "🪄 Đúc Thành Công!",
    `Ra lò ${list.length} thẻ CSPRNG`,
    `Úm ba la! Neko vừa đúc xong <strong>${list.length} thẻ chuẩn Luhn 100% không trùng lặp</strong> từ khuôn <code>${escapeHtml(pattern)}</code>! ✨`
  );
  showToast(`Đã đúc ${list.length} thẻ độc nhất chuẩn Luhn!`);
});

document.getElementById("btn-copy-gen")?.addEventListener("click", () => {
  const val = document.getElementById("gen-output").value;
  if (!val) return showToast("Chưa có thẻ nào để copy!");
  playChibiSfx("pop");
  navigator.clipboard.writeText(val);
  showToast("Đã copy toàn bộ mẻ thẻ!");
});

document.getElementById("btn-send-to-bulk")?.addEventListener("click", () => {
  const val = document.getElementById("gen-output").value;
  if (!val) return showToast("Hãy bấm Đúc Thẻ trước nha!");
  bulkInputEl.value = val;
  updateBulkLineCount();
  document.querySelector('.tab-btn[data-tab="tab-bulk"]').click();
  document.getElementById("btn-start-bulk").click();
});

document.getElementById("btn-dl-gen")?.addEventListener("click", () => {
  const val = document.getElementById("gen-output").value;
  if (!val) return showToast("Chưa có dữ liệu để lưu!");
  const fmt = document.getElementById("gen-format").value;
  const ext = fmt === "json" ? "json" : fmt === "csv" ? "csv" : fmt === "sql" ? "sql" : "txt";
  downloadFile(val, `nekobin_cards_${Date.now()}.${ext}`, "text/plain;charset=utf-8");
});

// ============================================================================
// 7. TAB 4: BIN COMPARATOR & OFFICIAL SANDBOX QA SUITE
// ============================================================================
async function runBinComparison() {
  const rawA = onlyDigits(document.getElementById("cmpBinA").value).slice(0, 8);
  const rawB = onlyDigits(document.getElementById("cmpBinB").value).slice(0, 8);
  if (rawA.length < 6 || rawB.length < 6) {
    playChibiSfx("oops");
    return showToast("Cả 2 ô BIN đều cần ít nhất 6 chữ số nha!");
  }

  const [metaA, metaB] = await Promise.all([lookupPublicBin(rawA), lookupPublicBin(rawB)]);
  const advA = buildRegionalAdvice(metaA);
  const advB = buildRegionalAdvice(metaB);

  document.getElementById("cmpHeadA").textContent = `🅰️ BIN ${rawA}`;
  document.getElementById("cmpHeadB").textContent = `🅱️ BIN ${rawB}`;

  const rows = [
    {
      label: "🏷️ Định danh 6 / 8 số",
      a: metaA.bin8 || metaA.bin6,
      b: metaB.bin8 || metaB.bin6,
      note: rawA.slice(0, 6) === rawB.slice(0, 6) ? "⚡ Cùng gốc 6 số nhưng tách nhánh Sub-allocation 8 số!" : "Khác dải IIN gốc",
    },
    {
      label: "💳 Tổ chức thẻ (Scheme)",
      a: metaA.scheme,
      b: metaB.scheme,
      note: metaA.scheme === metaB.scheme ? "Cùng mạng lưới thẻ" : "Khác mạng lưới thanh toán",
    },
    {
      label: "🏦 Ngân hàng phát hành",
      a: metaA.bank,
      b: metaB.bank,
      note: metaA.bank === metaB.bank ? "Cùng tổ chức phát hành" : "Khác ngân hàng phát hành",
    },
    {
      label: "🌍 Quốc gia đăng ký",
      a: `${metaA.countryName} (${metaA.countryCode})`,
      b: `${metaB.countryName} (${metaB.countryCode})`,
      note:
        metaA.countryCode === metaB.countryCode
          ? "Cùng quốc gia phát hành"
          : `⚠️ Lệch vùng quốc gia (${metaA.countryCode} vs ${metaB.countryCode})`,
    },
    {
      label: "💰 Loại & Hạng thẻ",
      a: `${metaA.type} · ${metaA.tier}`,
      b: `${metaB.type} · ${metaB.tier}`,
      note: advA.isPrepaid || advB.isPrepaid ? "⚠️ Có đầu BIN mang cờ PREPAID" : "✅ Đều là thẻ tiêu chuẩn Credit/Debit",
    },
    {
      label: "🪙 Tiền tệ gốc",
      a: `${metaA.currency} (ISO ${metaA.numericCode})`,
      b: `${metaB.currency} (ISO ${metaB.numericCode})`,
      note: metaA.currency === metaB.currency ? "Cùng đơn vị tiền tệ" : "Khác tiền tệ thanh toán nội địa",
    },
    {
      label: "🛡️ Chính sách Vùng / AVS",
      a: advA.avsShort,
      b: advB.avsShort,
      note:
        advA.requiresAvs !== advB.requiresAvs
          ? "🎯 Một bên bắt buộc AVS Zip Code, bên còn lại không cần AVS!"
          : "Tương đồng chính sách kiểm tra vùng AVS",
    },
  ];

  document.getElementById("cmpResultBody").innerHTML = rows
    .map(
      (r) => `
      <tr>
        <td><strong>${escapeHtml(r.label)}</strong></td>
        <td>${escapeHtml(r.a)}</td>
        <td>${escapeHtml(r.b)}</td>
        <td>${escapeHtml(r.note)}</td>
      </tr>
    `
    )
    .join("");
}

document.getElementById("btnRunCompare")?.addEventListener("click", () => {
  playChibiSfx("magic");
  runBinComparison();
});

document.querySelectorAll(".cmp-pair-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    playChibiSfx("pop");
    document.getElementById("cmpBinA").value = chip.dataset.a;
    document.getElementById("cmpBinB").value = chip.dataset.b;
    runBinComparison();
  });
});

function renderSandboxSuite() {
  const tbody = document.getElementById("sandboxSuiteBody");
  if (!tbody) return;
  tbody.innerHTML = SANDBOX_TEST_SUITE.map((item) => {
    const pipe = `${item.pan}|${item.mm}|${item.yy}|${item.cvv}`;
    const tagCls = item.status === "LIVE" ? "tag-green" : "tag-red";
    return `
      <tr data-sbx="${escapeHtml(pipe)}">
        <td class="mono"><strong>${escapeHtml(pipe)}</strong></td>
        <td><strong>${escapeHtml(item.scheme)}</strong></td>
        <td><span class="tag ${tagCls}">${escapeHtml(item.status)}</span> ${escapeHtml(item.desc)}</td>
        <td><code>${escapeHtml(item.code)}</code></td>
        <td>
          <button type="button" class="btn btn-sm btn-outline sbx-copy" data-val="${escapeHtml(pipe)}">📋 Copy</button>
        </td>
      </tr>
    `;
  }).join("");

  tbody.querySelectorAll(".sbx-copy").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      playChibiSfx("pop");
      navigator.clipboard.writeText(btn.dataset.val);
      showToast("Đã copy thẻ Sandbox!");
    });
  });

  tbody.querySelectorAll("tr[data-sbx]").forEach((tr) => {
    tr.addEventListener("click", () => {
      playChibiSfx("pop");
      document.getElementById("singleBinInput").value = tr.dataset.sbx;
      document.querySelector('.tab-btn[data-tab="tab-inspector"]').click();
      inspectSingle(false);
    });
  });
}

document.getElementById("btnLoadAllSandboxToBulk")?.addEventListener("click", () => {
  playChibiSfx("magic");
  bulkInputEl.value = SANDBOX_TEST_SUITE.map((s) => `${s.pan}|${s.mm}|${s.yy}|${s.cvv}`).join("\n");
  updateBulkLineCount();
  checkModeEl.value = "stripe_sim";
  checkModeEl.dispatchEvent(new Event("change"));
  document.querySelector('.tab-btn[data-tab="tab-bulk"]').click();
  document.getElementById("btn-start-bulk").click();
});

// ============================================================================
// 8. TAB 5: EXPANDED OFFLINE BIN DATABASE TABLE
// ============================================================================
let dbRegionFilter = "ALL";

function renderBinDatabaseTable() {
  const q = (document.getElementById("bin-filter-input")?.value || "").trim().toLowerCase();
  const tbody = document.getElementById("bin-db-body");
  const badge = document.getElementById("binDbTotalBadge");
  if (badge) badge.textContent = BIN_DATABASE.length;

  const rows = BIN_DATABASE.filter((b) => {
    if (dbRegionFilter === "VN" && b.countryCode !== "VN") return false;
    if (dbRegionFilter === "US" && b.countryCode !== "US") return false;
    if (dbRegionFilter === "PREPAID" && !b.type.includes("PREPAID")) return false;
    if (!q) return true;
    return (
      b.bin.includes(q) ||
      b.bank.toLowerCase().includes(q) ||
      b.scheme.toLowerCase().includes(q) ||
      b.countryName.toLowerCase().includes(q) ||
      b.countryCode.toLowerCase().includes(q)
    );
  });

  tbody.innerHTML = rows
    .map((b) => {
      const advice = buildRegionalAdvice(b);
      return `
        <tr data-bin-row="${escapeHtml(b.bin)}">
          <td><code>${escapeHtml(b.bin)}</code></td>
          <td><strong>${escapeHtml(b.scheme)}</strong></td>
          <td><span class="tag ${b.type.includes("PREPAID") ? "tag-amber" : "tag-green"}">${escapeHtml(b.type)}</span></td>
          <td>${escapeHtml(b.tier)}</td>
          <td><strong>${escapeHtml(b.bank)}</strong></td>
          <td>${escapeHtml(b.countryName)} (<strong>${escapeHtml(b.countryCode)}</strong>) · ${escapeHtml(b.currency)}</td>
          <td>${escapeHtml(advice.avsShort)}</td>
          <td><button type="button" class="btn btn-sm btn-outline">🔍 Soi ngay</button></td>
        </tr>
      `;
    })
    .join("");

  tbody.querySelectorAll("tr[data-bin-row]").forEach((tr) => {
    tr.addEventListener("click", () => {
      playChibiSfx("pop");
      document.getElementById("singleBinInput").value = tr.dataset.binRow;
      document.querySelector('.tab-btn[data-tab="tab-inspector"]').click();
      inspectSingle(false);
    });
  });
}

document.getElementById("bin-filter-input")?.addEventListener("input", renderBinDatabaseTable);

document.querySelectorAll(".db-region-pill").forEach((pill) => {
  pill.addEventListener("click", () => {
    playChibiSfx("pop");
    document.querySelectorAll(".db-region-pill").forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");
    dbRegionFilter = pill.dataset.region;
    renderBinDatabaseTable();
  });
});

// ============================================================================
// 9. INITIALIZATION ON LOAD
// ============================================================================
initPreferences();
renderRecentHistory();
renderBinDatabaseTable();
renderSandboxSuite();
runBinComparison();
inspectSingle(true);
document.getElementById("btn-generate")?.click();
