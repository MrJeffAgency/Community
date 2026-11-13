/* Community Chat — web app */
const VERSION = "1.1.17";
const STORE_KEY = "community.chat.web.v1";
const APP_TAG = "acode-community";
const ENVELOPE_VERSION = 1;
const DEFAULT_ROOM = "general";
const DEFAULT_RELAY = "https://community-relay.hdo-box.workers.dev";
const LEGACY_RELAYS = ["https://ntfy.sh", "https://ntfy.envs.net"];
const TOPIC_PREFIX = "acode-community-v1-";
const VERIFIED_TOPIC = TOPIC_PREFIX + "verified";
const GAMES_TOPIC = TOPIC_PREFIX + "games";
const GAME_LIFETIME_MS = 24 * 60 * 60 * 1000;
const GAME_TYPES = ["dice", "coin", "guess", "quiz", "rps", "wheel", "higher"];
const GAME_TYPE_LABELS = {
  dice: "Dice roll",
  coin: "Coin flip",
  guess: "Number guess",
  quiz: "Quiz question",
  rps: "Rock paper scissors",
  wheel: "Lucky wheel",
  higher: "Higher or lower"
};
const POINTS_PER_HDO = 10;
const CASHOUT_POINTS = 1000;
const CASHOUT_HDO = 100;
const PLAY_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const DAILY_BONUS_POINTS = 20;
const DAILY_BONUS_MS = 24 * 60 * 60 * 1000;
const QUIZ_BANK = [
  { q: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Mercury"], answer: 1 },
  { q: "What does HTML stand for?", options: ["Hyper Text Markup Language", "High Tech Modern Link", "Home Tool Markup Language", "Hyperlink Text Machine Language"], answer: 0 },
  { q: "How many sides does a hexagon have?", options: ["5", "6", "7", "8"], answer: 1 },
  { q: "Which language runs in a web browser?", options: ["Python", "Java", "JavaScript", "C++"], answer: 2 },
  { q: "What is the capital of France?", options: ["Lagos", "Paris", "London", "Berlin"], answer: 1 },
  { q: "What is 9 x 8?", options: ["64", "72", "81", "68"], answer: 1 },
  { q: "Which gas do plants absorb from the air?", options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], answer: 2 },
  { q: "Who wrote Romeo and Juliet?", options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"], answer: 1 },
  { q: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], answer: 3 },
  { q: "In which year did World War II end?", options: ["1943", "1944", "1945", "1946"], answer: 2 },
  { q: "What does CSS stand for?", options: ["Cascading Style Sheets", "Computer Style System", "Creative Style Source", "Coded Styling Sheets"], answer: 0 },
  { q: "Which is the smallest prime number?", options: ["0", "1", "2", "3"], answer: 2 }
];
const TRANSLATE_LANGS = [
  { code: "en", name: "English" },
  { code: "fr", name: "French" },
  { code: "es", name: "Spanish" },
  { code: "pt", name: "Portuguese" },
  { code: "ar", name: "Arabic" },
  { code: "sw", name: "Swahili" },
  { code: "hi", name: "Hindi" },
  { code: "zh-CN", name: "Chinese" },
  { code: "ru", name: "Russian" },
  { code: "de", name: "German" }
];
const AI_ENDPOINT = "https://luckyai-blush.vercel.app/api/chat?message=";
const AI_ID = "CM-AI00-0000";
const AI_NAME = "Lucky AI";
const DEV_ID = "CM-6S29-CA2X";
const BOTFATHER_ID = "CM-B0TF-0000";
const DEV_UNLOCK_CODE = "COMMUNITY-ADMIN";
const VERIFIED_IDS = [DEV_ID];
const ENC_VERSION = "aes-gcm-v1";
const ENC_AAD_ROOM = "acode-community-room-v1";
const ENC_AAD_DM = "acode-community-dm-v1";
const ROOM_KDF_ITERATIONS = 120000;
const POLL_FAST_MS = 5000;
const POLL_SLOW_MS = 25000;
const PRESENCE_MS = 15 * 60 * 1000;
const ONLINE_MS = 20 * 60 * 1000;
const MAX_TEXT = 1200;
const MAX_IMAGE_CHARS = 220000;
const MAX_PROFILE_CHARS = 120000;
const MAX_MESSAGES = 250;
const WALLET_REFRESH_MS = 30000;

const GDOLLAR_CELO = "0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A";
const USDT_CELO = "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e";
const USDC_CELO = "0xcebA9300f2b948710d2653dD7B07f33A8B32118C";
const BTC_CELO = "0x8aC2901Dd8A1F17a1A4768A6bA4C3751e3995B2D";
const HDO_TOKEN_DEFAULT = "0x0b7e844Dd950558295eB5Ee7d5f57d18c1BEeb02";
const USDT_BSC = "0x55d398326f99059fF775485246999027B3197955";
const USDC_BSC = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";
const BTC_BSC = "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c";
const ETH_BSC = "0x2170Ed0880ac9A755fd29B2688956BD959F933F8";

const WALLET_CHAINS = [
  {
    key: "celo",
    name: "Celo",
    chainId: 42220,
    native: { symbol: "CELO", decimals: 18 },
    rpcs: ["https://forno.celo.org", "https://celo-rpc.publicnode.com"],
    explorer: "https://celoscan.io/tx/",
    tokens: [
      { symbol: "G$", address: GDOLLAR_CELO, decimals: 18 },
      { symbol: "USDT", address: USDT_CELO, decimals: 6 },
      { symbol: "USDC", address: USDC_CELO, decimals: 6 },
      { symbol: "HDO", address: HDO_TOKEN_DEFAULT, decimals: 18, custom: "hdo" },
      { symbol: "BTC", address: BTC_CELO, decimals: 8 }
    ]
  },
  {
    key: "bsc",
    name: "BSC",
    chainId: 56,
    native: { symbol: "BNB", decimals: 18 },
    rpcs: ["https://bsc-dataseed.binance.org", "https://bsc-dataseed1.defibit.io", "https://bsc-dataseed1.ninicoin.io"],
    explorer: "https://bscscan.com/tx/",
    tokens: [
      { symbol: "USDT", address: USDT_BSC, decimals: 18 },
      { symbol: "USDC", address: USDC_BSC, decimals: 18 },
      { symbol: "BTC", address: BTC_BSC, decimals: 18 },
      { symbol: "ETH", address: ETH_BSC, decimals: 18 }
    ]
  }
];

const PUBLIC_ROOM_TOKEN = "HDO";
const PRIVATE_CHAT_TOKENS = ["USDT", "USDC", "HDO", "BTC"];
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];
const NFT_ABI = ["function tokenURI(uint256 tokenId) view returns (string)"];

const DEFAULT_PROFILE_IMAGE = "data:image/svg+xml;utf8," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">' +
  '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5b4bdb"/><stop offset="1" stop-color="#a855f7"/></linearGradient></defs>' +
  '<rect width="96" height="96" rx="48" fill="url(#g)"/>' +
  '<text x="48" y="62" font-size="46" text-anchor="middle" fill="white">👤</text></svg>'
);

const ROOMS = [
  { slug: "general", name: "General", emoji: "💬", desc: "Say hello to everyone" },
  { slug: "ai", name: "AI Room", emoji: "🤖", desc: "Chat with Lucky AI" },
  { slug: "games", name: "Game Room", emoji: "🎮", desc: "Games, tips and fun" },
  { slug: "dev", name: "Dev Room", emoji: "💻", desc: "Code and projects" },
  { slug: "help", name: "Help Room", emoji: "🛟", desc: "Ask for help" }
];

let state = null;
let ui = { tab: "chats", mode: "tabs", peer: null, status: "connecting", lastSync: 0, searchOpen: false, wallet: { data: null, loading: false, error: "", at: 0 }, gameId: null, gameResult: null, gameRoll: 0, gameNumber: 0, gameCoin: "", gameGuess: 0, gameWheel: -1, gameQuiz: null };
let running = true;
let pollTimer = null;
let pollInFlight = false;
let presenceInFlight = false;
let lastPresenceAt = 0;
let $root = null;
const roomKeyPromises = {};
const dmKeyPromises = {};
const peerKeyFetches = {};

/* ---------- utils ---------- */
function uid() { return "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); }
function normalizeId(v) { var s = String(v == null ? "" : v).trim().toUpperCase().replace(/\s+/g, ""); if (/^CM-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(s)) return s; return ""; }
function cleanName(v) { return String(v == null ? "" : v).trim().slice(0, 40); }
function safeEmoji(v) { var s = String(v == null ? "" : v).trim(); return s ? s.slice(0, 4) : "🙂"; }
function slugFor(v) { var s = String(v == null ? "" : v).trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40); return s || "general"; }
function roomSlug() { return slugFor(state ? state.settings.room : DEFAULT_ROOM); }
function roomInfo(v) { var s = slugFor(v); for (var i = 0; i < ROOMS.length; i++) if (ROOMS[i].slug === s) return ROOMS[i]; return { slug: s, name: s, emoji: "💬", desc: "Custom room" }; }
function isPresetRoom(v) { var s = slugFor(v); return ROOMS.some(function (r) { return r.slug === s; }); }
function isAiRoom() { return roomSlug() === "ai"; }
function topicFor(slug) { return TOPIC_PREFIX + slug; }
function dmTopicFor(id) { return TOPIC_PREFIX + "dm-" + String(id || "").toLowerCase(); }
function cleanRelay(v) { var s = String(v == null ? "" : v).trim(); if (!s) return ""; try { var u = new URL(s); if (u.protocol !== "https:" && u.protocol !== "http:") return ""; return (u.origin + u.pathname).replace(/\/+$/, ""); } catch (e) { return ""; } }
function relayBase() { return cleanRelay(state && state.settings.relay) || DEFAULT_RELAY; }
function sinceValue(c) { if (c && c.id) return c.id; if (c && c.ts) return String(c.ts); return "all"; }
function escapeHTML(v) { return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function colorFor(id) { var h = 0; var s = String(id || ""); for (var i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0; return "hsl(" + (Math.abs(h) % 360) + ",60%,55%)"; }
function isVerifiedId(id) { var n = normalizeId(id); return !!n && (VERIFIED_IDS.indexOf(n) !== -1 || (state && Array.isArray(state.verifiedIds) && state.verifiedIds.indexOf(n) !== -1)); }
function isAdmin() { return !!state && (state.user.id === DEV_ID || (state.settings && state.settings.devMode === true)); }
function verifiedBadge(id) { return isVerifiedId(id) ? '<span class="cm-verified" title="Verified">✓</span>' : ""; }
function toast(msg, dur) { var t = document.createElement("div"); t.className = "cm-toast"; t.textContent = msg; document.body.appendChild(t); setTimeout(function () { t.remove(); }, dur || 3000); }
function readFileAsDataURL(file) { return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.onerror = rej; r.readAsDataURL(file); }); }
function compressImage(dataUrl) { return new Promise(function (res) { var img = new Image(); img.onload = function () { var max = 1280; var w = img.width, h = img.height; if (w > max || h > max) { if (w > h) { h = Math.round(h * max / w); w = max; } else { w = Math.round(w * max / h); h = max; } } var c = document.createElement("canvas"); c.width = w; c.height = h; c.getContext("2d").drawImage(img, 0, 0, w, h); var out = c.toDataURL("image/jpeg", 0.82); if (out.length > MAX_IMAGE_CHARS) out = c.toDataURL("image/jpeg", 0.6); res(out); }; img.onerror = function () { res(dataUrl); }; img.src = dataUrl; }); }
function compressProfileImage(dataUrl) { return new Promise(function (res) { var img = new Image(); img.onload = function () { var max = 256; var w = img.width, h = img.height; if (w > max || h > max) { if (w > h) { h = Math.round(h * max / w); w = max; } else { w = Math.round(w * max / h); h = max; } } var c = document.createElement("canvas"); c.width = w; c.height = h; c.getContext("2d").drawImage(img, 0, 0, w, h); var out = c.toDataURL("image/jpeg", 0.8); if (out.length > MAX_PROFILE_CHARS) out = c.toDataURL("image/jpeg", 0.55); res(out); }; img.onerror = function () { res(dataUrl); }; img.src = dataUrl; }); }
function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return false; });
  return Promise.resolve(false);
}
function openExternal(url) {
  if (!url) return;
  try { window.open(url, "_system"); return; } catch (e) { /* ignore */ }
  try { window.open(url, "_blank"); } catch (e) { /* ignore */ }
}
function formatAmount(raw, decimals) {
  try {
    var s = window.ethers.utils.formatUnits(raw, decimals);
    var parts = s.split(".");
    if (parts[1]) {
      parts[1] = parts[1].slice(0, 6).replace(/0+$/, "");
      return parts[1] ? parts[0] + "." + parts[1] : parts[0];
    }
    return parts[0];
  } catch (e) { return "—"; }
}
function walletSupported() { return !!(window.ethers && window.ethers.Wallet && window.ethers.providers && window.crypto && window.crypto.getRandomValues); }
function walletChainByKey(key) { for (var i = 0; i < WALLET_CHAINS.length; i += 1) if (WALLET_CHAINS[i].key === key) return WALLET_CHAINS[i]; return null; }
function chainTokens(chain) {
  if (!chain) return [];
  return chain.tokens.map(function (token) {
    if (token.custom === "hdo") {
      var custom = state && state.settings && state.settings.hdoToken;
      if (custom) return { symbol: token.symbol, address: custom, decimals: token.decimals, custom: token.custom };
    }
    return token;
  });
}
function isAddress(v) { try { return !!(window.ethers && window.ethers.utils.isAddress(String(v || ""))); } catch (e) { return false; } }
function isHexKey(v) { return /^[0-9a-f]{64}$/i.test(String(v || "").replace(/^0x/i, "")); }
function parseUnits(v, decimals) { return window.ethers.utils.parseUnits(String(v).replace(/,/g, ""), decimals); }

/* ---------- crypto ---------- */
function cryptoAvailable() { return !!(window.crypto && window.crypto.subtle); }
function bytesToBase64(b) { var s = ""; for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return btoa(s); }
function base64ToBytes(s) { var bin = atob(s); var out = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; }
function utf8Bytes(s) { return new TextEncoder().encode(s); }
function utf8Text(b) { return new TextDecoder().decode(b); }
function randomBytes(n) { var b = new Uint8Array(n); crypto.getRandomValues(b); return b; }
function cleanPublicKey(v) { var k = String(v == null ? "" : v).trim(); if (k.length < 60 || k.length > 300) return ""; if (!/^[A-Za-z0-9+/=]+$/.test(k)) return ""; return k; }

async function ensureIdentityKeys() {
  if (!state) return false;
  if (state.crypto && state.crypto.publicKey && state.crypto.privateJwk) return true;
  if (!cryptoAvailable()) return false;
  try {
    var pair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveKey"]);
    var raw = await crypto.subtle.exportKey("raw", pair.publicKey);
    var jwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
    state.crypto = { publicKey: bytesToBase64(new Uint8Array(raw)), privateJwk: JSON.stringify(jwk), createdAt: Date.now(), publishedAt: 0 };
    saveState();
    return true;
  } catch (e) { return false; }
}

function deriveRoomKey(room) {
  var slug = String(room || roomSlug());
  if (roomKeyPromises[slug]) return roomKeyPromises[slug];
  if (!cryptoAvailable()) return Promise.reject(new Error("Encryption is not available on this device"));
  var promise = crypto.subtle.importKey("raw", utf8Bytes("acode-community-passphrase-v1:" + slug), "PBKDF2", false, ["deriveKey"])
    .then(function (baseKey) {
      return crypto.subtle.deriveKey({ name: "PBKDF2", salt: utf8Bytes("acode-community-room-salt-v1"), iterations: ROOM_KDF_ITERATIONS, hash: "SHA-256" }, baseKey, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    });
  roomKeyPromises[slug] = promise;
  promise.catch(function () { if (roomKeyPromises[slug] === promise) delete roomKeyPromises[slug]; });
  return promise;
}

function deriveDmKey(peerPublicKey, myPrivateJwk) {
  return Promise.resolve().then(function () {
    if (!cryptoAvailable()) throw new Error("Encryption is not available on this device");
    return crypto.subtle.importKey("raw", base64ToBytes(peerPublicKey), { name: "ECDH", namedCurve: "P-256" }, false, []);
  }).then(function (peerKey) {
    var jwk = JSON.parse(myPrivateJwk);
    return crypto.subtle.importKey("jwk", jwk, { name: "ECDH", namedCurve: "P-256" }, false, ["deriveKey"]).then(function (privateKey) {
      return crypto.subtle.deriveKey({ name: "ECDH", public: peerKey }, privateKey, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    });
  });
}

/* ---------- state ---------- */
function makeUserId() {
  var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  var parts = [];
  for (var p = 0; p < 2; p++) {
    var seg = "";
    for (var i = 0; i < 4; i++) seg += chars[Math.floor(Math.random() * chars.length)];
    parts.push(seg);
  }
  return "CM-" + parts.join("-");
}
function defaultName(id) { return "User " + String(id || "").slice(-4); }
function cleanWallet(input) {
  if (!input || typeof input !== "object") return null;
  var key = String(input.privateKey || "").replace(/^0x/i, "").toLowerCase();
  if (!isHexKey(key) || !walletSupported()) return null;
  try {
    var w = new window.ethers.Wallet("0x" + key);
    return { address: w.address, privateKey: key, createdAt: Number(input.createdAt) || Date.now() };
  } catch (e) { return null; }
}
function makeWallet() {
  if (!walletSupported()) return null;
  try {
    var w = window.ethers.Wallet.createRandom();
    return { address: w.address, privateKey: w.privateKey.replace(/^0x/i, "").toLowerCase(), createdAt: Date.now() };
  } catch (e) { return null; }
}
function sanitizeImage(value) {
  if (typeof value !== "string") return "";
  if (value.length > MAX_IMAGE_CHARS) return "";
  if (!/^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(value)) return "";
  return value;
}
function sanitizeProfileImage(value) {
  if (typeof value !== "string") return "";
  if (!value) return "";
  if (value.length > MAX_PROFILE_CHARS) return "";
  if (/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(value)) return value;
  if (/^https?:\/\//i.test(value)) return value;
  return "";
}
function sanitizeToken(value) {
  if (!value || typeof value !== "object") return null;
  var chain = walletChainByKey(String(value.chain || ""));
  if (!chain) return null;
  var symbol = String(value.symbol == null ? "" : value.symbol).slice(0, 12);
  if (!/^[A-Za-z0-9$._-]{1,12}$/.test(symbol)) symbol = chain.native.symbol;
  var amount = String(value.amount == null ? "" : value.amount).replace(/,/g, "").slice(0, 32);
  if (!/^\d+(\.\d+)?$/.test(amount)) return null;
  var to = String(value.to || "");
  if (!isAddress(to)) return null;
  var tx = /^0x[0-9a-f]{64}$/i.test(String(value.tx || "")) ? String(value.tx).toLowerCase() : "";
  if (!tx) return null;
  return { chain: chain.key, symbol: symbol, amount: amount, to: to, tx: tx };
}
function sanitizeAirdrop(value) {
  if (!value || typeof value !== "object") return null;
  var chain = walletChainByKey(String(value.chain || ""));
  if (!chain) return null;
  var claimKey = String(value.claimKey == null ? "" : value.claimKey).replace(/^0x/i, "").toLowerCase();
  if (!isHexKey(claimKey)) return null;
  var amount = String(value.amount == null ? "" : value.amount).replace(/,/g, "").slice(0, 32);
  if (!/^\d+(\.\d+)?$/.test(amount) || /^[0.]+$/.test(amount)) return null;
  var rawToken = String(value.tokenAddress == null ? "" : value.tokenAddress).trim();
  if (rawToken && !isAddress(rawToken)) return null;
  var decimals = Number(value.decimals);
  if (!(decimals >= 0 && decimals <= 36)) decimals = chain.native.decimals;
  var symbol = String(value.symbol == null ? "" : value.symbol).slice(0, 12);
  if (!/^[A-Za-z0-9$._-]{1,12}$/.test(symbol)) symbol = rawToken ? "TOKEN" : chain.native.symbol;
  var fundingTx = /^0x[0-9a-f]{64}$/i.test(String(value.fundingTx || "")) ? String(value.fundingTx).toLowerCase() : "";
  var claimedTx = /^0x[0-9a-f]{64}$/i.test(String(value.claimedTx || "")) ? String(value.claimedTx).toLowerCase() : "";
  var maxClaims = isFinite(Number(value.maxClaims)) && Number(value.maxClaims) > 0 ? Math.floor(Number(value.maxClaims)) : 1;
  var usedClaims = isFinite(Number(value.claimsUsed)) && Number(value.claimsUsed) > 0 ? Math.floor(Number(value.claimsUsed)) : 0;
  return {
    chain: chain.key,
    claimKey: claimKey,
    amount: amount,
    decimals: decimals,
    symbol: symbol,
    tokenAddress: rawToken ? rawToken.toLowerCase() : "",
    fundingTx: fundingTx,
    claimed: !!value.claimed || !!claimedTx,
    claimedTx: claimedTx,
    maxClaims: maxClaims,
    claimsUsed: usedClaims
  };
}
function cleanCashoutRecord(value) {
  if (!value || typeof value !== "object") return null;
  var user = normalizeId(value.user);
  if (!user) return null;
  var address = isAddress(value.address) ? value.address : "";
  if (!address) return null;
  var status = ["pending", "paid", "rejected"].indexOf(value.status) === -1 ? "pending" : value.status;
  return {
    id: String(value.id || uid()).slice(0, 80),
    user: user,
    points: Math.max(0, Math.round(Number(value.points) || CASHOUT_POINTS)),
    hdo: Math.max(0, Number(value.hdo) || CASHOUT_HDO),
    address: address,
    status: status,
    createdAt: Number(value.createdAt) || Date.now(),
    paidAt: Number(value.paidAt) || 0,
    tx: /^0x[0-9a-f]{64}$/i.test(String(value.tx || "")) ? String(value.tx).toLowerCase() : ""
  };
}
function cleanGameRecord(value) {
  if (!value || typeof value !== "object") return null;
  var name = String(value.name || "").replace(/[\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 40);
  if (!name) return null;
  var type = GAME_TYPES.indexOf(value.type) === -1 ? "dice" : value.type;
  var stake = String(value.stake == null ? "1" : value.stake).replace(/[^0-9.]/g, "").slice(0, 20) || "1";
  var created = Number(value.createdAt) || Date.now();
  var expires = Number(value.expiresAt) || (created + GAME_LIFETIME_MS);
  var status = ["open", "finished", "returned"].indexOf(value.status) === -1 ? "open" : value.status;
  var players = Array.isArray(value.players) ? value.players.map(normalizeId).filter(Boolean).slice(0, 100) : [];
  var prizePool = Number(value.prizePool);
  if (!isFinite(prizePool) || prizePool < 0) prizePool = Math.max(0, parseFloat(stake) || 0);
  return {
    id: String(value.id || uid()).slice(0, 80),
    name: name,
    type: type,
    stake: stake,
    creator: normalizeId(value.creator) || "",
    createdAt: created,
    expiresAt: expires,
    plays: Math.max(0, Number(value.plays) || 0),
    prizePool: Math.round(prizePool * 1000) / 1000,
    paid: Math.max(0, Number(value.paid) || 0),
    players: players,
    lastWinner: normalizeId(value.lastWinner) || "",
    status: status
  };
}
function translateLangCode(value) {
  var code = String(value || "").trim();
  for (var i = 0; i < TRANSLATE_LANGS.length; i += 1) if (TRANSLATE_LANGS[i].code === code) return code;
  return "en";
}
function translateLangName(code) {
  var target = translateLangCode(code);
  for (var i = 0; i < TRANSLATE_LANGS.length; i += 1) if (TRANSLATE_LANGS[i].code === target) return TRANSLATE_LANGS[i].name;
  return "English";
}
function translateTarget() { return translateLangCode(state && state.settings ? state.settings.translateTo : "en"); }
function detectLanguageCode(value) {
  var text = String(value || "");
  if (/[\u0600-\u06FF]/.test(text)) return "ar";
  if (/[\u0400-\u04FF]/.test(text)) return "ru";
  if (/[\u4E00-\u9FFF]/.test(text)) return "zh-CN";
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  return "en";
}
function decodeTranslation(value) {
  return String(value || "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}
function translateWithGoogle(value, lang) {
  var url = "https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=auto&tl=" + encodeURIComponent(lang) + "&q=" + encodeURIComponent(value);
  return fetchWithTimeout(url, { cache: "no-store" }, 20000).then(function (r) {
    if (!r.ok) throw new Error("Translate HTTP " + r.status);
    return r.json();
  }).then(function (data) {
    var parts = data && Array.isArray(data[0]) ? data[0] : [];
    var out = "";
    for (var i = 0; i < parts.length; i += 1) if (parts[i] && typeof parts[i][0] === "string") out += parts[i][0];
    out = out.trim();
    if (!out) throw new Error("No translation returned");
    return { text: out, source: String(data[2] || "") };
  });
}
function translateText(text, target) {
  var lang = translateLangCode(target);
  var value = String(text || "").slice(0, MAX_TEXT);
  if (!value.trim()) return Promise.reject(new Error("There is no text to translate"));
  var source = detectLanguageCode(value);
  var url = "https://api.mymemory.translated.net/get?q=" + encodeURIComponent(value) + "&langpair=" + encodeURIComponent("autodetect|" + lang);
  return fetchWithTimeout(url, { cache: "no-store" }, 20000).then(function (r) {
    if (!r.ok) throw new Error("Translate HTTP " + r.status);
    return r.json();
  }).then(function (data) {
    if (data && data.quotaFinished) throw new Error("Translation limit reached");
    var out = data && data.responseData ? decodeTranslation(data.responseData.translatedText) : "";
    out = out.trim();
    if (!out || /INVALID SOURCE LANGUAGE/i.test(out)) throw new Error("No translation returned");
    var detected = data && data.responseData && data.responseData.detectedLanguage;
    return { text: out, source: String(detected || source) };
  }).catch(function () {
    return translateWithGoogle(value, lang);
  });
}
function translateMessage(id) {
  var message = findMessage(id);
  if (!message || !message.text || message.token || message.airdrop) return;
  var target = translateTarget();
  if (message.tr && message.trLang === target) {
    message.showTr = !message.showTr;
    saveState();
    render();
    return;
  }
  if (message.translating) return;
  message.translating = true;
  render();
  translateText(message.text, target).then(function (result) {
    message.tr = result.text;
    message.trLang = target;
    message.trSrc = result.source;
    message.showTr = true;
    message.translating = false;
    saveState();
    render();
  }).catch(function (error) {
    message.translating = false;
    render();
    toast("Could not translate: " + (error && error.message ? error.message : String(error)), 5000);
  });
}
function saveTranslateLang() {
  if (!state) return;
  var select = document.getElementById("translateLang");
  if (!state.settings) state.settings = {};
  state.settings.translateTo = translateLangCode(select ? select.value : "en");
  saveState();
  toast("Translation language set to " + translateLangName(state.settings.translateTo));
}
function normalizeState(data) {
  var input = data && typeof data === "object" ? data : {};
  var userId = normalizeId(input.user && input.user.id) || makeUserId();
  var user = { id: userId, name: cleanName(input.user && input.user.name) || defaultName(userId), emoji: safeEmoji(input.user && input.user.emoji) || "🙂", createdAt: Number(input.user && input.user.createdAt) || Date.now() };
  var settingsInput = input.settings && typeof input.settings === "object" ? input.settings : {};
  var room = slugFor(settingsInput.room || DEFAULT_ROOM);
  var relay = cleanRelay(settingsInput.relay);
  if (!relay || LEGACY_RELAYS.indexOf(relay) !== -1) relay = DEFAULT_RELAY;

  var contacts = {};
  var ci = input.contacts && typeof input.contacts === "object" ? input.contacts : {};
  Object.keys(ci).forEach(function (k) {
    var cid = normalizeId(k);
    if (!cid || cid === userId) return;
    var c = ci[k] || {};
    var publicKey = cleanPublicKey(c.publicKey);
    if (publicKey.length > 100) publicKey = ""; /* old SPKI key from web v1.0 */
    contacts[cid] = {
      id: cid,
      name: cleanName(c.name) || defaultName(cid),
      emoji: safeEmoji(c.emoji) || "🙂",
      publicKey: publicKey,
      wallet: isAddress(c.wallet) ? c.wallet : "",
      lastSeen: Number(c.lastSeen) || 0,
      bot: !!c.bot,
      username: String(c.username || "").slice(0, 40),
      followers: Array.isArray(c.followers) ? c.followers.map(normalizeId).filter(Boolean).slice(0, 200) : [],
      following: Array.isArray(c.following) ? c.following.map(normalizeId).filter(Boolean).slice(0, 200) : []
    };
  });

  var threads = {};
  var ti = input.threads && typeof input.threads === "object" ? input.threads : {};
  Object.keys(ti).forEach(function (k) {
    var t = ti[k] || {};
    var msgs = Array.isArray(t.messages) ? t.messages.slice(-MAX_MESSAGES).map(function (m) {
      if (!m || typeof m !== "object") return null;
      var out = {
        id: String(m.id || "").slice(0, 80),
        from: normalizeId(m.from) || String(m.from || ""),
        name: cleanName(m.name),
        text: String(m.text || "").slice(0, MAX_TEXT),
        image: sanitizeImage(m.image),
        ts: Number(m.ts) || 0,
        mine: !!m.mine,
        status: String(m.status || ""),
        token: sanitizeToken(m.token),
        airdrop: sanitizeAirdrop(m.airdrop)
      };
      return out.id ? out : null;
    }).filter(Boolean) : [];
    threads[k] = { peer: t.peer || "community", room: t.room || "", messages: msgs, unread: Math.max(0, Number(t.unread) || 0), lastTs: Number(t.lastTs) || 0 };
  });

  var cursors = input.cursors && typeof input.cursors === "object" ? input.cursors : {};
  var dmCursor = input.dmCursor && typeof input.dmCursor === "object" ? input.dmCursor : null;
  var verifiedIds = Array.isArray(input.verifiedIds) ? input.verifiedIds.map(normalizeId).filter(Boolean) : [];
  var verifiedCursor = input.verifiedCursor && typeof input.verifiedCursor === "object" ? input.verifiedCursor : null;

  var cryptoInput = input.crypto && typeof input.crypto === "object" ? input.crypto : {};
  var publicKey = cleanPublicKey(cryptoInput.publicKey);
  var privateJwk = typeof cryptoInput.privateJwk === "string" ? cryptoInput.privateJwk : "";
  /* web v1.0 used SPKI keys; regenerate so we match the plugin's raw keys. */
  if (publicKey.length > 100 || privateJwk.charAt(0) === "[") { publicKey = ""; privateJwk = ""; }
  var cryptoState = {
    publicKey: publicKey,
    privateJwk: privateJwk,
    createdAt: Number(cryptoInput.createdAt) || 0,
    publishedAt: Number(cryptoInput.publishedAt) || 0
  };

  var wallet = cleanWallet(input.wallet);
  var profileImage = sanitizeProfileImage(input.profileImage);

  var followers = [];
  var followersInput = Array.isArray(input.followers) ? input.followers : [];
  followersInput.forEach(function (value) {
    var id = normalizeId(value);
    if (id && id !== userId && followers.indexOf(id) === -1) followers.push(id);
  });
  var following = [];
  var followingInput = Array.isArray(input.following) ? input.following : [];
  followingInput.forEach(function (value) {
    var id = normalizeId(value);
    if (id && id !== userId && following.indexOf(id) === -1) following.push(id);
  });
  if (userId !== DEV_ID && following.indexOf(DEV_ID) === -1) following.push(DEV_ID);
  var games = [];
  var gamesInput = Array.isArray(input.games) ? input.games : [];
  gamesInput.slice(0, 10).forEach(function (value) {
    var g = cleanGameRecord(value);
    if (g && g.name) games.push(g);
  });
  var gameScores = (input.gameScores && typeof input.gameScores === "object") ? input.gameScores : {};
  var cashouts = [];
  var cashoutsInput = Array.isArray(input.cashouts) ? input.cashouts : [];
  cashoutsInput.slice(0, 100).forEach(function (value) {
    var record = cleanCashoutRecord(value);
    if (record) cashouts.push(record);
  });
  var playDaily = {};
  var playDailyInput = input.playDaily && typeof input.playDaily === "object" ? input.playDaily : {};
  GAME_TYPES.forEach(function (type) {
    var ts = Number(playDailyInput[type]) || 0;
    if (ts > 0 && Date.now() - ts < PLAY_COOLDOWN_MS * 30) playDaily[type] = ts;
  });
  var bonusAt = Number(input.bonusAt) || 0;
  if (bonusAt > 0 && Date.now() - bonusAt > DAILY_BONUS_MS * 30) bonusAt = 0;
  var gameCursor = null;
  var gameCursorInput = input.gameCursor && typeof input.gameCursor === "object" ? input.gameCursor : null;
  if (gameCursorInput && (gameCursorInput.id || gameCursorInput.ts)) {
    gameCursor = { id: typeof gameCursorInput.id === "string" ? gameCursorInput.id.slice(0, 80) : "", ts: Number(gameCursorInput.ts) || 0 };
  }
  var bots = [];
  var botsInput = Array.isArray(input.bots) ? input.bots : [];
  botsInput.slice(0, 50).forEach(function (value) {
    var record = cleanBotRecord(value);
    if (!record.username) return;
    var duplicate = bots.some(function (item) { return item.username === record.username || item.id === record.id; });
    if (!duplicate) bots.push(record);
  });

  return {
    schema: 2,
    user: user,
    settings: {
      room: room,
      relay: relay,
      notify: settingsInput.notify !== false,
      hdoToken: isAddress(settingsInput.hdoToken) ? settingsInput.hdoToken : "",
      devMode: settingsInput.devMode === true,
      chatWallpaper: ["pattern", "sky", "mint", "sunset", "night", "paris", "lion", "community", "unicorn", "plug", "image"].indexOf(settingsInput.chatWallpaper) === -1 ? "pattern" : settingsInput.chatWallpaper,
      chatWallpaperImage: (function (v) {
        v = String(v == null ? "" : v).trim();
        if (!v || v.length > MAX_IMAGE_CHARS) return "";
        if (/^data:image\//i.test(v) || /^https?:\/\//i.test(v)) return v;
        return "";
      })(settingsInput.chatWallpaperImage),
      translateTo: translateLangCode(settingsInput.translateTo)
    },
    contacts: contacts,
    threads: threads,
    cursors: cursors,
    dmCursor: dmCursor,
    verifiedIds: verifiedIds,
    verifiedCursor: verifiedCursor,
    crypto: cryptoState,
    wallet: wallet,
    profileImage: profileImage,
    followers: followers,
    following: following,
    bots: bots,
    games: games,
    gameScores: gameScores,
    cashouts: cashouts,
    playDaily: playDaily,
    bonusAt: bonusAt,
    gameCursor: gameCursor,
    welcome: input.welcome !== false
  };
}
function loadState() {
  var raw = null;
  try { raw = localStorage.getItem(STORE_KEY); } catch (e) { raw = null; }
  var data = null;
  if (raw) { try { data = JSON.parse(raw); } catch (e) { data = null; } }
  return normalizeState(data);
}
function saveState() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* storage full */ } }

/* ---------- identity keys ---------- */
async function publishPublicKey(force) {
  if (!running || !state) return;
  var now = Date.now();
  if (!force && state.crypto.publishedAt && now - state.crypto.publishedAt < 6 * 60 * 60 * 1000) return;
  await ensureIdentityKeys();
  if (!state.crypto.publicKey) return;
  var env = { app: APP_TAG, v: ENVELOPE_VERSION, id: uid(), from: state.user.id, name: state.user.name, emoji: state.user.emoji, type: "key", ts: now, pk: state.crypto.publicKey, wallet: state.wallet && isAddress(state.wallet.address) ? state.wallet.address : "" };
  await publish(env, dmTopicFor(state.user.id));
  state.crypto.publishedAt = now;
  saveState();
}
async function publishPresence(force) {
  if (!running || !state) return;
  var now = Date.now();
  if (!force && lastPresenceAt && now - lastPresenceAt < PRESENCE_MS) return;
  if (presenceInFlight) return;
  presenceInFlight = true;
  lastPresenceAt = now;
  await ensureIdentityKeys();
  var env = { app: APP_TAG, v: ENVELOPE_VERSION, id: uid(), from: state.user.id, name: state.user.name, emoji: state.user.emoji, type: "presence", ts: now, wallet: state.wallet && isAddress(state.wallet.address) ? state.wallet.address : "", followers: (state.followers || []).slice(0, 200), following: (state.following || []).slice(0, 200) };
  if (state.crypto.publicKey) env.pk = state.crypto.publicKey;
  try { await publish(env, topicFor(roomSlug())); } catch (e) { /* ignore */ }
  presenceInFlight = false;
}

function fetchPeerPublicKey(peer) {
  var peerId = normalizeId(peer);
  if (!peerId) return Promise.resolve("");
  var url = relayBase() + "/" + encodeURIComponent(dmTopicFor(peerId)) + "/json?poll=1&limit=300&since=all";
  return fetchWithTimeout(url, { cache: "no-store" }, 12000).then(function (response) {
    if (!response.ok) throw new Error("Relay returned HTTP " + response.status);
    return response.text();
  }).then(function (text) {
    var found = "";
    var lines = String(text || "").split("\n");
    for (var i = 0; i < lines.length; i += 1) {
      var line = lines[i].trim();
      if (!line) continue;
      var item;
      try { item = JSON.parse(line); } catch (e) { continue; }
      if (!item || item.event !== "message" || typeof item.message !== "string") continue;
      var envelope;
      try { envelope = JSON.parse(item.message); } catch (e) { continue; }
      if (!envelope || envelope.app !== APP_TAG || Number(envelope.v) !== ENVELOPE_VERSION) continue;
      if (normalizeId(envelope.from) !== peerId) continue;
      var publicKey = cleanPublicKey(envelope.pk);
      if (publicKey && publicKey.length <= 100) found = publicKey;
    }
    return found;
  });
}
function ensurePeerPublicKey(peer) {
  var peerId = normalizeId(peer);
  if (!peerId) return Promise.resolve("");
  var contact = state.contacts[peerId];
  if (contact && contact.publicKey) return Promise.resolve(contact.publicKey);
  if (peerKeyFetches[peerId]) return peerKeyFetches[peerId];
  var promise = fetchPeerPublicKey(peerId).then(function (publicKey) {
    delete peerKeyFetches[peerId];
    if (!publicKey) return "";
    rememberPublicKey(peerId, publicKey);
    return publicKey;
  }, function () {
    delete peerKeyFetches[peerId];
    return "";
  });
  peerKeyFetches[peerId] = promise;
  return promise;
}
function rememberPublicKey(id, value) {
  var peerId = normalizeId(id);
  var publicKey = cleanPublicKey(value);
  if (!peerId || !publicKey || !state) return;
  var contact = state.contacts[peerId];
  if (!contact) return;
  if (contact.publicKey) return;
  contact.publicKey = publicKey;
  delete dmKeyPromises[peerId];
  saveState();
}

/* ---------- relay transport ---------- */
function fetchWithTimeout(url, options, timeoutMs) {
  var controller = null, timer = null;
  if (typeof AbortController !== "undefined") {
    controller = new AbortController();
    timer = setTimeout(function () { try { controller.abort(); } catch (e) { /* ignore */ } }, timeoutMs || 15000);
  }
  var opts = options || {};
  if (controller) opts.signal = controller.signal;
  var req = fetch(url, opts);
  if (timer) req.then(function () { clearTimeout(timer); }, function () { clearTimeout(timer); });
  return req;
}
function parseEnvelopeText(text) { if (typeof text !== "string" || !text) return null; try { var v = JSON.parse(text); return v && typeof v === "object" ? v : null; } catch (e) { return null; } }
function publish(envelope, topic) {
  var base = relayBase();
  var url = base + "/" + encodeURIComponent(topic);
  return fetchWithTimeout(url, { method: "POST", body: JSON.stringify(envelope), cache: "no-store" }, 25000).then(function (r) {
    if (r.ok) return r;
    return r.text().then(function (body) { throw new Error("Relay HTTP " + r.status + (body ? " — " + body.slice(0, 80) : "")); });
  });
}
function pollTopic(url, guard, onCursor) {
  return fetchWithTimeout(url, { cache: "no-store" }).then(function (r) {
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.text();
  }).then(function (text) {
    if (!running) return;
    var nextCursor = null;
    var lines = String(text || "").split("\n");
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;
      var item;
      try { item = JSON.parse(line); } catch (e) { continue; }
      if (!item || item.event !== "message") continue;
      if (item.id) nextCursor = { id: String(item.id).slice(0, 80), ts: Number(item.time) || Math.floor(Date.now() / 1000) };
      if (guard && !guard()) continue;
      var env = parseEnvelopeText(item.message);
      if (env) handleEnvelope(env);
    }
    if (nextCursor && (!guard || guard())) onCursor(nextCursor);
  });
}
function pollGames() {
  if (!running || !state) return Promise.resolve();
  var base = relayBase();
  var cursor = state.gameCursor || null;
  var url = base + "/" + encodeURIComponent(GAMES_TOPIC) + "/json?poll=1&limit=300&since=" + encodeURIComponent(sinceValue(cursor));
  return fetchWithTimeout(url, { cache: "no-store" }, 15000).then(function (r) {
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.text();
  }).then(function (text) {
    if (!running || !state) return;
    var nextCursor = null;
    var changed = false;
    var lines = String(text || "").split("\n");
    for (var i = 0; i < lines.length; i += 1) {
      var line = lines[i].trim();
      if (!line) continue;
      var item;
      try { item = JSON.parse(line); } catch (e) { continue; }
      if (!item || item.event !== "message") continue;
      if (item.id) nextCursor = { id: String(item.id).slice(0, 80), ts: Number(item.time) || Math.floor(Date.now() / 1000) };
      var env = parseEnvelopeText(item.message);
      if (!env || env.app !== APP_TAG || Number(env.v) !== ENVELOPE_VERSION) continue;
      if (env.type !== "game") continue;
      if (normalizeId(env.from) === state.user.id) continue;
      if (applyRemoteGame(env, true)) changed = true;
    }
    if (nextCursor) state.gameCursor = nextCursor;
    if (nextCursor || changed) saveState();
    if (changed) refreshGameUI();
  }).catch(function () {});
}
function pollNow() {
  if (!running || !state || pollInFlight) return;
  pollInFlight = true;
  var slug = roomSlug();
  var base = relayBase();
  var roomCursor = state.cursors[slug] || null;
  var dmCursor = state.dmCursor || null;
  var userId = state.user.id;
  var roomUrl = base + "/" + encodeURIComponent(topicFor(slug)) + "/json?poll=1&limit=200&since=" + encodeURIComponent(sinceValue(roomCursor));
  var dmUrl = base + "/" + encodeURIComponent(dmTopicFor(userId)) + "/json?poll=1&limit=200&since=" + encodeURIComponent(sinceValue(dmCursor));
  var roomPoll = pollTopic(roomUrl, function () { return slug === roomSlug() && base === relayBase(); }, function (c) {
    state.cursors[slug] = c;
    saveState();
  }).catch(function () {});
  var dmPoll = pollTopic(dmUrl, function () { return userId === state.user.id && base === relayBase(); }, function (c) {
    state.dmCursor = c;
    saveState();
  }).catch(function () {});
  var verifiedPoll = pollVerified();
  var gamePoll = pollGames();
  Promise.all([roomPoll, dmPoll, verifiedPoll, gamePoll]).then(function () {
    if (running) { ui.status = "online"; ui.lastSync = Date.now(); renderStatus(); }
  }).catch(function () {}).then(function () {
    pollInFlight = false;
    schedulePoll();
  });
}
/* ---------- Community bots: collect replies written through the API ---------- */
function schedulePoll(delay) {
  if (!running) return;
  if (pollTimer) clearTimeout(pollTimer);
  var next = delay != null ? delay : (document.hidden ? POLL_SLOW_MS : POLL_FAST_MS);
  pollTimer = setTimeout(pollNow, Math.max(0, next));
}
function pollVerified() {
  if (!running || !state) return Promise.resolve();
  var base = relayBase();
  var cursor = state.verifiedCursor || null;
  var url = base + "/" + encodeURIComponent(VERIFIED_TOPIC) + "/json?poll=1&limit=200&since=" + encodeURIComponent(sinceValue(cursor));
  return fetchWithTimeout(url, { cache: "no-store" }, 15000).then(function (r) {
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.text();
  }).then(function (text) {
    if (!running || !state) return;
    var nextCursor = null;
    var changed = false;
    var lines = String(text || "").split("\n");
    for (var i = 0; i < lines.length; i += 1) {
      var line = lines[i].trim();
      if (!line) continue;
      var item;
      try { item = JSON.parse(line); } catch (e) { continue; }
      if (!item || item.event !== "message") continue;
      if (item.id) nextCursor = { id: String(item.id).slice(0, 80), ts: Number(item.time) || Math.floor(Date.now() / 1000) };
      var envelope = parseEnvelopeText(item.message);
      if (!envelope || envelope.app !== APP_TAG || Number(envelope.v) !== ENVELOPE_VERSION) continue;
      if (normalizeId(envelope.from) !== DEV_ID) continue;
      var target = normalizeId(envelope.target);
      if (!target) continue;
      if (!state.verifiedIds) state.verifiedIds = [];
      if (envelope.type === "verify-grant") {
        if (state.verifiedIds.indexOf(target) === -1) { state.verifiedIds.push(target); changed = true; }
      } else if (envelope.type === "verify-revoke") {
        var index = state.verifiedIds.indexOf(target);
        if (index !== -1) { state.verifiedIds.splice(index, 1); changed = true; }
      }
    }
    if (nextCursor) { state.verifiedCursor = nextCursor; saveState(); }
    else if (changed) saveState();
    if (changed) render();
  }).catch(function () {});
}

/* ---------- admin / verified ---------- */
function publishVerifiedGrant(target) {
  var id = normalizeId(target);
  if (!id) return Promise.resolve(false);
  return publish({ app: APP_TAG, v: ENVELOPE_VERSION, id: uid(), from: state.settings.devMode ? DEV_ID : state.user.id, type: "verify-grant", target: id, ts: Date.now() }, VERIFIED_TOPIC).then(function () {
    if (!state.verifiedIds) state.verifiedIds = [];
    if (state.verifiedIds.indexOf(id) === -1) state.verifiedIds.push(id);
    saveState();
    render();
    return true;
  });
}
function publishVerifiedRevoke(target) {
  var id = normalizeId(target);
  if (!id) return Promise.resolve(false);
  return publish({ app: APP_TAG, v: ENVELOPE_VERSION, id: uid(), from: state.settings.devMode ? DEV_ID : state.user.id, type: "verify-revoke", target: id, ts: Date.now() }, VERIFIED_TOPIC).then(function () {
    if (state.verifiedIds) {
      var index = state.verifiedIds.indexOf(id);
      if (index !== -1) state.verifiedIds.splice(index, 1);
    }
    saveState();
    render();
    return true;
  });
}
function grantVerified() {
  if (!state || !isAdmin()) { toast("Admin mode is not on"); return; }
  var input = document.getElementById("verifyTarget");
  var id = normalizeId(input && input.value);
  if (!id) { toast("Enter a profile ID like CM-ABCD-1234"); return; }
  if (id === DEV_ID) { toast("The developer profile is already verified"); return; }
  publishVerifiedGrant(id).then(function () {
    if (input) input.value = "";
    toast("Verified badge granted to " + id);
  }).catch(function (e) {
    toast("Could not grant: " + (e && e.message ? e.message : String(e)), 6000);
  });
}
function revokeVerified(id) {
  if (!state || !isAdmin()) { toast("Admin mode is not on"); return; }
  var target = normalizeId(id);
  if (!target) return;
  publishVerifiedRevoke(target).then(function () { toast("Badge removed from " + target); }).catch(function (e) { toast("Could not remove: " + (e && e.message ? e.message : String(e)), 6000); });
}
function unlockDev() {
  if (!state) return;
  var input = document.getElementById("devCode");
  if (String(input && input.value).trim() !== DEV_UNLOCK_CODE) { toast("Wrong admin code"); return; }
  state.settings.devMode = true;
  saveState();
  render();
  toast("Admin mode unlocked");
}
function lockDev() {
  if (!state) return;
  state.settings.devMode = false;
  saveState();
  render();
  toast("Admin mode off");
}

/* ---------- incoming ---------- */
function handleEnvelope(env) {
  if (!state || !env || typeof env !== "object") return;
  if (env.app !== APP_TAG || Number(env.v) !== ENVELOPE_VERSION) return;
  var from = normalizeId(env.from);
  if (!from || from === state.user.id) return;
  var messageId = typeof env.id === "string" ? env.id.slice(0, 80) : "";
  if (!messageId) return;
  var isPresence = env.type === "presence";
  var isKey = env.type === "key";
  var name = cleanName(env.name);
  var emoji = safeEmoji(env.emoji);
  var ts = Number(env.ts) || Date.now();
  var to = String(env.to || "all");
  if (!isPresence && !isKey && to !== "all" && to !== state.user.id) return;
  if (isKey && !state.contacts[from]) return;
  if (!state.contacts[from]) state.contacts[from] = { id: from, name: name || defaultName(from), emoji: emoji, publicKey: "", wallet: "", lastSeen: 0 };
  var contact = state.contacts[from];
  if (name) contact.name = name;
  if (emoji) contact.emoji = emoji;
  if (env.pk) rememberPublicKey(from, env.pk);
  if (!contact.wallet && env.wallet && isAddress(env.wallet)) contact.wallet = String(env.wallet);
  if (isPresence) {
    contact.lastSeen = ts;
    if (Array.isArray(env.followers)) contact.followers = env.followers.map(normalizeId).filter(Boolean).slice(0, 200);
    if (Array.isArray(env.following)) {
      contact.following = env.following.map(normalizeId).filter(Boolean).slice(0, 200);
      if (!state.followers) state.followers = [];
      var followsMe = contact.following.indexOf(state.user.id) !== -1;
      var idx = state.followers.indexOf(from);
      if (followsMe && idx === -1) state.followers.push(from);
      if (!followsMe && idx !== -1) state.followers.splice(idx, 1);
    }
    saveState(); render(); return;
  }
  if (isKey) { if (env.pk) rememberPublicKey(from, env.pk); saveState(); return; }
  if (env.type === "game") { applyRemoteGame(env, false); return; }
  if (isAiRoom() && to === "all") return;
  if (env.enc === ENC_VERSION) {
    decryptWireEnvelope(env).then(function (payload) {
      applyIncoming(env, from, contact, messageId, payload.text, payload.image, ts, payload.token, payload.airdrop);
    }).catch(function () { /* cannot decrypt */ });
    return;
  }
  applyIncoming(env, from, contact, messageId, env.text, env.image, ts, env.token, env.airdrop);
}
async function decryptWireEnvelope(env) {
  if (!cryptoAvailable()) throw new Error("no crypto");
  await ensureIdentityKeys();
  var key;
  if (env.to === "all") {
    key = await deriveRoomKey(roomSlug());
  } else {
    var pk = state.contacts[env.from] && state.contacts[env.from].publicKey;
    if (!pk) throw new Error("no key");
    key = await deriveDmKey(pk, state.crypto.privateJwk);
  }
  var aad = env.to === "all" ? ENC_AAD_ROOM : ENC_AAD_DM;
  var pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBytes(env.iv), additionalData: utf8Bytes(aad) }, key, base64ToBytes(env.data));
  var payload = JSON.parse(utf8Text(new Uint8Array(pt)));
  return {
    text: String(payload.text || ""),
    image: sanitizeImage(payload.image || ""),
    token: sanitizeToken(payload.token),
    airdrop: sanitizeAirdrop(payload.airdrop)
  };
}
async function buildWireEnvelope(peer, text, image, extra) {
  var room = roomSlug();
  var env = { app: APP_TAG, v: ENVELOPE_VERSION, id: uid(), from: state.user.id, name: state.user.name, emoji: state.user.emoji, to: peer === "community" ? "all" : peer, type: "secure", ts: Date.now(), wallet: state.wallet && isAddress(state.wallet.address) ? state.wallet.address : "" };
  extra = extra || {};
  var plain = { text: text || "", image: image || "" };
  if (extra.token) plain.token = extra.token;
  if (extra.airdrop) plain.airdrop = extra.airdrop;

  if (!cryptoAvailable()) {
    env.text = plain.text;
    env.image = plain.image;
    if (plain.token) env.token = plain.token;
    if (plain.airdrop) env.airdrop = plain.airdrop;
    env._plain = true;
    return env;
  }
  var ok = await ensureIdentityKeys();
  if (!ok) {
    env.text = plain.text;
    env.image = plain.image;
    if (plain.token) env.token = plain.token;
    if (plain.airdrop) env.airdrop = plain.airdrop;
    env._plain = true;
    return env;
  }
  env.pk = state.crypto.publicKey;
  var key;
  if (peer === "community") {
    key = await deriveRoomKey(room);
  } else {
    var pk = state.contacts[peer] && state.contacts[peer].publicKey;
    if (!pk) pk = await ensurePeerPublicKey(peer);
    if (!pk) {
      /* Send a readable fallback instead of losing the message. The plugin
         accepts plaintext envelopes, and the friend gets the text now. */
      env.text = plain.text;
      env.image = plain.image;
      if (plain.token) env.token = plain.token;
      if (plain.airdrop) env.airdrop = plain.airdrop;
      env._plain = true;
      return env;
    }
    key = await deriveDmKey(pk, state.crypto.privateJwk);
  }
  var iv = randomBytes(12);
  var aad = peer === "community" ? ENC_AAD_ROOM : ENC_AAD_DM;
  var ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv, additionalData: utf8Bytes(aad) }, key, utf8Bytes(JSON.stringify(plain)));
  env.enc = ENC_VERSION;
  env.iv = bytesToBase64(iv);
  env.data = bytesToBase64(new Uint8Array(ct));
  return env;
}
function applyIncoming(env, from, contact, messageId, text, image, ts, token, airdrop) {
  var peer = env.to === "all" ? "community" : from;
  var threadKey = peer === "community" ? ("room:" + roomSlug()) : ("dm:" + from);
  if (!state.threads[threadKey]) state.threads[threadKey] = { peer: peer, room: roomSlug(), messages: [], unread: 0, lastTs: 0 };
  var thread = state.threads[threadKey];
  if (thread.messages.some(function (m) { return m.id === messageId; })) return;
  var safeText = String(text == null ? "" : text).slice(0, MAX_TEXT);
  var safeImage = sanitizeImage(image);
  var safeToken = sanitizeToken(token);
  var safeAirdrop = sanitizeAirdrop(airdrop);
  if (!safeText && !safeImage && !safeToken && !safeAirdrop) return;
  thread.messages.push({
    id: messageId,
    from: from,
    name: contact.name,
    text: safeText,
    image: safeImage,
    ts: Number(env.ts) || ts,
    mine: false,
    status: "sent",
    token: safeToken,
    airdrop: safeAirdrop
  });
  if (thread.messages.length > MAX_MESSAGES) thread.messages = thread.messages.slice(-MAX_MESSAGES);
  thread.lastTs = Math.max(thread.lastTs || 0, Number(env.ts) || ts);
  if (ui.peer !== peer || ui.mode !== "thread") thread.unread = (thread.unread || 0) + 1;
  saveState();
  render();
}

/* ---------- actions ---------- */
async function sendMessage(text, image, extra) {
  if (!state || !ui.peer) { toast("Open a room or direct chat first"); return; }
  extra = extra || {};
  var peer = ui.peer;
  var isCommunity = peer === "community";
  var slug = roomSlug();
  var threadKey = isCommunity ? ("room:" + slug) : ("dm:" + peer);
  if (!state.threads[threadKey]) state.threads[threadKey] = { peer: peer, room: slug, messages: [], unread: 0, lastTs: 0 };
  var thread = state.threads[threadKey];
  if (peer === BOTFATHER_ID) {
    handleBotFather(text, thread);
    return;
  }
  var botPeer = findBotById(peer);
  if (botPeer) {
    handleBotMessage(botPeer, text, thread);
    return;
  }
  var msgId = uid();
  var now = Date.now();
  var img = image || "";
  var token = sanitizeToken(extra.token);
  var airdrop = sanitizeAirdrop(extra.airdrop);
  if (!text && !img && !token && !airdrop) return;
  var optimistic = {
    id: msgId,
    from: state.user.id,
    name: state.user.name,
    text: String(text || ""),
    image: img,
    ts: now,
    mine: true,
    status: "sending",
    token: token,
    airdrop: airdrop
  };
  thread.messages.push(optimistic);
  thread.lastTs = now;
  saveState();
  render();
  try {
    var env = await buildWireEnvelope(peer, text || "", img, { token: token, airdrop: airdrop });
    env.id = msgId;
    await publish(env, isCommunity ? topicFor(slug) : dmTopicFor(peer));
    optimistic.status = "sent";
    optimistic.unencrypted = !!env._plain;
    saveState();
    render();
    if (isCommunity && slug === "ai" && text) askAI(thread, text);
  } catch (e) {
    optimistic.status = "failed";
    optimistic.error = e && e.message ? e.message : String(e);
    saveState();
    render();
    toast("Message not sent: " + optimistic.error, 6000);
  }
}
function openBotFather() {
  if (!state) return;
  if (!state.contacts[BOTFATHER_ID]) state.contacts[BOTFATHER_ID] = { id: BOTFATHER_ID, name: "BotFather", emoji: "🤖", publicKey: "", wallet: "", lastSeen: 0 };
  state.contacts[BOTFATHER_ID].bot = true;
  if (!state.threads["dm:" + BOTFATHER_ID]) state.threads["dm:" + BOTFATHER_ID] = { peer: BOTFATHER_ID, room: roomSlug(), messages: [], unread: 0, lastTs: 0 };
  var thread = state.threads["dm:" + BOTFATHER_ID];
  if (!thread.messages.length) {
    thread.messages.push({ id: uid(), from: BOTFATHER_ID, name: "BotFather", text: "I'm BotFather. I create and manage Community bots.\n\nType /help to see every command.", image: "", ts: Date.now(), mine: false, status: "sent", token: null, airdrop: null });
    thread.lastTs = Date.now();
  }
  ui.peer = BOTFATHER_ID;
  ui.mode = "thread";
  ui.tab = "chats";
  saveState();
  render();
  toast("BotFather is ready. Type /help for commands.", 4000);
}
function randomBotToken() {
  var out = "";
  for (var i = 0; i < 4; i += 1) out += Math.random().toString(36).slice(2, 10).toUpperCase();
  return "BOT-" + out;
}
function generateBotId() {
  var alphabet = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  function part(size) { var out = ""; for (var i = 0; i < size; i += 1) out += alphabet.charAt(Math.floor(Math.random() * alphabet.length)); return out; }
  return "CM-B0T" + Math.floor(Math.random() * 10) + "-" + part(4);
}
function newBotId() {
  var id = generateBotId();
  while (findBotById(id)) id = generateBotId();
  return id;
}
function cleanBotRecord(input) {
  var record = input && typeof input === "object" ? input : {};
  var username = String(record.username || "").replace(/^@/, "").slice(0, 40);
  var name = String(record.name || username || "Community Bot").slice(0, 64);
  var id = normalizeId(record.id) || generateBotId();
  var token = String(record.token || "");
  if (token.length < 20) token = randomBotToken();
  return {
    id: id,
    name: name,
    username: username,
    token: token,
    description: String(record.description || "").slice(0, 500),
    commands: Array.isArray(record.commands) ? record.commands.slice(0, 50).map(function (item) {
      return { command: String((item && item.command) || "").replace(/^\//, "").slice(0, 32), description: String((item && item.description) || "").slice(0, 256) };
    }).filter(function (item) { return item.command; }) : [],
    createdAt: Number(record.createdAt) || Date.now(),
    api: !!record.api,
    apiAlive: !!record.apiAlive,
    lastOut: Math.max(0, Number(record.lastOut) || 0)
  };
}
function findBotById(id) {
  if (!state || !state.bots) return null;
  var target = normalizeId(id);
  if (!target) return null;
  for (var i = 0; i < state.bots.length; i += 1) if (state.bots[i] && normalizeId(state.bots[i].id) === target) return state.bots[i];
  return null;
}
function findBotByUsername(username) {
  if (!state || !state.bots) return null;
  var name = String(username || "").replace(/^@/, "").toLowerCase();
  for (var i = 0; i < state.bots.length; i += 1) if (state.bots[i] && String(state.bots[i].username || "").toLowerCase() === name) return state.bots[i];
  return null;
}
function ensureBotContact(bot) {
  if (!state || !bot || !normalizeId(bot.id)) return null;
  var contact = state.contacts[bot.id];
  if (!contact) {
    contact = state.contacts[bot.id] = { id: bot.id, name: bot.name, emoji: "🤖", publicKey: "", wallet: "", lastSeen: 0 };
  }
  contact.name = bot.name;
  contact.bot = true;
  contact.username = bot.username;
  var key = "dm:" + bot.id;
  if (!state.threads[key]) state.threads[key] = { peer: bot.id, room: roomSlug(), messages: [], unread: 0, lastTs: 0 };
  var thread = state.threads[key];
  if (!thread.messages.length) {
    thread.messages.push({ id: uid(), from: bot.id, name: bot.name, text: "Hi! I'm @" + bot.username + ".\n\n" + (bot.description || "I am a Community bot.") + "\n\nType /start to see my commands, or /help for help.", image: "", ts: Date.now(), mine: false, status: "sent", token: null, airdrop: null });
    thread.lastTs = Date.now();
  }
  return contact;
}
function botCommandList(bot) {
  var commands = Array.isArray(bot && bot.commands) ? bot.commands : [];
  if (!commands.length) return "/start - Start the bot\n/help - Show help";
  return commands.map(function (item) { return "/" + item.command + " - " + (item.description || "No description"); }).join("\n");
}
function botReply(bot, text) {
  var clean = String(text || "").trim();
  var lower = clean.toLowerCase();
  var commands = Array.isArray(bot && bot.commands) ? bot.commands : [];
  if (!clean || lower === "/start") {
    return "👋 Welcome to @" + bot.username + "!\n\n" + (bot.description || "I am a Community bot.") + "\n\nCommands:\n" + botCommandList(bot);
  }
  if (lower === "/help") return "Commands:\n" + botCommandList(bot);
  if (clean.charAt(0) === "/") {
    var name = clean.slice(1).split(/\s+/)[0].toLowerCase();
    for (var i = 0; i < commands.length; i += 1) if (String(commands[i].command || "").toLowerCase() === name) return commands[i].description || commands[i].reply || "OK";
    return "Unknown command. Try /help.";
  }
  if (bot.description) return bot.description + "\n\nType /help for commands.";
  return "Hi! I'm @" + bot.username + ". Type /help for my commands.";
}
function handleBotMessage(bot, text, thread) {
  if (!state || !bot || !thread) return;
  var clean = String(text || "").trim();
  if (!clean) return;
  var now = Date.now();
  thread.messages.push({ id: uid(), from: state.user.id, name: state.user.name, text: clean, ts: now, mine: true, status: "sent", token: null, airdrop: null });
  thread.lastTs = now;
  thread.unread = 0;
  saveState();
  render();
  thread.messages.push({ id: uid(), from: bot.id, name: bot.name, text: botReply(bot, clean), image: "", ts: Date.now(), mine: false, status: "sent", token: null, airdrop: null });
  thread.lastTs = Date.now();
  saveState();
  render();
}
function botFatherReply(text) {
  if (!state.bots) state.bots = [];
  var clean = String(text || "").trim();
  var lower = clean.toLowerCase();
  if (!clean || lower === "/start" || lower === "/help") {
    return "I'm BotFather. I create and manage Community bots.\n\n" +
      "/newbot <name> <username> - create a bot\n" +
      "/mybots - list your bots\n" +
      "/token <username> - show a bot token\n" +
      "/setcommands <username> <cmd:description,...> - set commands\n" +
      "/setdescription <username> <text> - set the bot description\n" +
      "/deletebot <username> - delete a bot\n" +
      "Example: /newbot MyBot my_bot";
  }
  var parts = clean.split(/\s+/);
  var command = parts[0].toLowerCase();
  if (command === "/newbot") {
    var name = parts[1] || "My Bot";
    var username = (parts[2] || ("bot_" + Math.random().toString(36).slice(2, 8))).replace(/^@/, "");
    if (findBotByUsername(username)) return "That username is already used. Pick another one.";
    var bot = { id: newBotId(), name: name, username: username, token: randomBotToken(), description: "I am " + name + ".", commands: [], createdAt: Date.now() };
    state.bots.push(bot);
    ensureBotContact(bot);
    saveState();
    return "Done! Bot created:\nName: " + name + "\nUsername: @" + username + "\nCommunity ID: " + bot.id + "\nToken: " + bot.token + "\n\nOpen Chats and tap @" + username + " to DM it. Use /setcommands " + username + " start:Say hello,help:Show help to add commands.";
  }
  if (command === "/mybots") {
    if (!state.bots.length) return "You have no bots yet. Use /newbot to create one.";
    return "Your bots:\n" + state.bots.map(function (b) { return "@" + b.username + " (" + b.id + ") - " + b.name + " · " + (b.commands ? b.commands.length : 0) + " commands"; }).join("\n");
  }
  if (command === "/token") {
    var tokenBot = findBotByUsername(parts[1]);
    if (!tokenBot) return "Bot not found. Use /mybots.";
    return "Token for @" + tokenBot.username + ":\n" + tokenBot.token + "\n\nThis bot runs on this phone. Use /setcommands to choose what it replies to.";
  }
  if (command === "/setcommands") {
    var cmdBot = findBotByUsername(parts[1]);
    if (!cmdBot) return "Bot not found. Use /mybots.";
    var commandList = parts.slice(2).join(" ");
    if (!commandList) return "Usage: /setcommands <username> start:Say hello,help:Show help";
    cmdBot.commands = commandList.split(",").map(function (item) {
      var pieces = item.split(":");
      return { command: (pieces[0] || "").trim(), description: (pieces.slice(1).join(":") || "").trim() };
    }).filter(function (item) { return item.command; });
    saveState();
    return "Commands updated for @" + cmdBot.username + ":\n" + botCommandList(cmdBot);
  }
  if (command === "/setdescription") {
    var descBot = findBotByUsername(parts[1]);
    if (!descBot) return "Bot not found. Use /mybots.";
    var description = parts.slice(2).join(" ").trim();
    if (!description) return "Usage: /setdescription <username> <text>";
    descBot.description = description;
    saveState();
    return "Description updated for @" + descBot.username + ".";
  }
  if (command === "/deletebot") {
    var deleteBot = findBotByUsername(parts[1]);
    if (!deleteBot) return "Bot not found. Use /mybots.";
    var index = state.bots.indexOf(deleteBot);
    if (index !== -1) state.bots.splice(index, 1);
    if (state.contacts[deleteBot.id]) state.contacts[deleteBot.id].bot = false;
    delete state.threads["dm:" + deleteBot.id];
    saveState();
    return "Deleted @" + deleteBot.username + ".";
  }
  return "I did not understand that command. Type /help for the list.";
}
function handleBotFather(text, thread) {
  if (!state || !thread) return;
  var clean = String(text || "").trim();
  if (!clean) return;
  var now = Date.now();
  thread.messages.push({ id: uid(), from: state.user.id, name: state.user.name, text: clean, ts: now, mine: true, status: "sent", token: null, airdrop: null });
  thread.lastTs = now;
  saveState();
  render();
  var reply = botFatherReply(clean);
  thread.messages.push({ id: uid(), from: BOTFATHER_ID, name: "BotFather", text: reply, image: "", ts: Date.now(), mine: false, status: "sent", token: null, airdrop: null });
  thread.lastTs = Date.now();
  saveState();
  render();
}
function askAI(thread, text) {
  fetch(AI_ENDPOINT + encodeURIComponent(text)).then(function (r) {
    if (!r.ok) throw new Error("AI HTTP " + r.status);
    return r.json();
  }).then(function (data) {
    var reply = data && (data.response || data.message || data.reply);
    if (!reply) throw new Error("No AI reply");
    thread.messages.push({ id: uid(), from: AI_ID, name: AI_NAME, text: String(reply), image: "", ts: Date.now(), mine: false, status: "sent", token: null, airdrop: null });
    if (thread.messages.length > MAX_MESSAGES) thread.messages = thread.messages.slice(-MAX_MESSAGES);
    thread.lastTs = Date.now();
    saveState();
    render();
  }).catch(function (e) {
    toast("AI reply failed: " + (e && e.message ? e.message : String(e)), 6000);
  });
}
function retryMessage(id) {
  if (!state || ui.mode !== "thread") return;
  var peer = ui.peer;
  var threadKey = peer === "community" ? ("room:" + roomSlug()) : ("dm:" + peer);
  var thread = state.threads[threadKey];
  if (!thread) return;
  var message = null;
  for (var i = 0; i < thread.messages.length; i += 1) if (thread.messages[i].id === id) message = thread.messages[i];
  if (!message) return;
  message.status = "sending";
  message.error = "";
  saveState();
  render();
  buildWireEnvelope(peer, message.text, message.image, { token: message.token, airdrop: message.airdrop }).then(function (env) {
    env.id = message.id;
    return publish(env, peer === "community" ? topicFor(roomSlug()) : dmTopicFor(peer));
  }).then(function () {
    message.status = "sent";
    message.unencrypted = false;
    saveState();
    render();
  }).catch(function (e) {
    message.status = "failed";
    message.error = e && e.message ? e.message : String(e);
    saveState();
    render();
    toast("Retry failed: " + message.error, 6000);
  });
}
function openThread(peer) {
  ui.searchOpen = false;
  ui.search = "";
  if (!state) return;
  ui.mode = "thread";
  ui.peer = peer;
  var threadKey = peer === "community" ? ("room:" + roomSlug()) : ("dm:" + peer);
  if (state.threads[threadKey]) state.threads[threadKey].unread = 0;
  if (peer !== "community") ensurePeerPublicKey(peer).then(function () { if (ui.peer === peer) render(); });
  saveState();
  render();
  pollNow();
}
function closeThread() { ui.mode = "tabs"; ui.peer = null; ui.searchOpen = false; ui.search = ""; render(); }
function addContact(id) {
  var cid = normalizeId(id);
  if (!cid) { toast("Invalid ID. Use CM-XXXX-XXXX."); return; }
  if (cid === state.user.id) { toast("That's your own ID"); return; }
  if (!state.contacts[cid]) state.contacts[cid] = { id: cid, name: defaultName(cid), emoji: "🙂", publicKey: "", wallet: "", lastSeen: 0 };
  if (!state.threads["dm:" + cid]) state.threads["dm:" + cid] = { peer: cid, room: "", messages: [], unread: 0, lastTs: 0 };
  saveState();
  render();
  toast("Contact added");
  ensurePeerPublicKey(cid).then(function () { render(); });
}
function setRoom(room) {
  state.settings.room = slugFor(room);
  saveState();
  pollNow();
  openThread("community");
}
function saveName() {
  var input = document.getElementById("nameInput");
  var n = cleanName(input && input.value);
  if (!n) { toast("Enter a name"); return; }
  state.user.name = n;
  saveState();
  publishPresence(true);
  render();
  toast("Name saved");
}
function copyUserId() { copyText(state.user.id).then(function (ok) { toast(ok ? "ID copied" : "Could not copy — select it manually"); }); }

/* ---------- wallet ---------- */
function walletAssetBalance(chainKey, symbol) {
  var data = ui.wallet && ui.wallet.data;
  if (!data || !Array.isArray(data.chains)) return null;
  var entry = null;
  data.chains.forEach(function (item) { if (item && item.key === chainKey) entry = item; });
  if (!entry || !entry.ok || !entry.data) return null;
  if (entry.data.native.symbol === symbol) return entry.data.native;
  var found = null;
  entry.data.tokens.forEach(function (token) { if (token.symbol === symbol) found = token; });
  return found;
}
function rpcCall(chain, method, params) {
  var index = 0;
  function attempt() {
    if (index >= chain.rpcs.length) return Promise.reject(new Error("No " + chain.name + " RPC responded"));
    var url = chain.rpcs[index];
    index += 1;
    return fetchWithTimeout(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method: method, params: params || [] }),
      cache: "no-store"
    }, 18000).then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    }).then(function (data) {
      if (!data || data.error) throw new Error((data && data.error && data.error.message) || "RPC error");
      return data.result;
    }).catch(function (error) {
      if (index >= chain.rpcs.length) throw error;
      return attempt();
    });
  }
  return attempt();
}
function erc20BalanceData(address) {
  return "0x70a08231" + String(address).replace(/^0x/i, "").toLowerCase().padStart(64, "0");
}
async function fetchWalletBalances() {
  var address = state.wallet.address;
  var chains = [];
  for (var c = 0; c < WALLET_CHAINS.length; c += 1) {
    var chain = WALLET_CHAINS[c];
    try {
      var nativeHex = await rpcCall(chain, "eth_getBalance", [address, "latest"]);
      var native = window.ethers.BigNumber.from(nativeHex);
      var tokens = [];
      var list = chainTokens(chain);
      for (var i = 0; i < list.length; i += 1) {
        var token = list[i];
        try {
          var hex = await rpcCall(chain, "eth_call", [{ to: token.address, data: erc20BalanceData(address) }, "latest"]);
          var balance = window.ethers.BigNumber.from(hex);
          tokens.push({ symbol: token.symbol, amount: formatAmount(balance, token.decimals), raw: balance.toString() });
        } catch (e) {
          tokens.push({ symbol: token.symbol, amount: "—", raw: "0", error: true });
        }
      }
      chains.push({
        key: chain.key,
        ok: true,
        data: {
          native: { symbol: chain.native.symbol, amount: formatAmount(native, chain.native.decimals), raw: native.toString() },
          tokens: tokens
        }
      });
    } catch (e) {
      chains.push({ key: chain.key, ok: false, error: e && e.message ? e.message : String(e) });
    }
  }
  return { chains: chains };
}
function refreshWallet(force) {
  if (!state || !state.wallet || !walletSupported()) return;
  var w = ui.wallet;
  if (w.loading) return;
  if (!force && w.at && Date.now() - w.at < WALLET_REFRESH_MS) return;
  w.loading = true;
  w.error = "";
  paintWalletBalances();
  var address = state.wallet.address;
  fetchWalletBalances().then(function (data) {
    if (!state || !state.wallet || state.wallet.address !== address) return;
    w.data = data;
  }).catch(function (error) {
    w.error = error && error.message ? error.message : "network error";
  }).then(function () {
    w.at = Date.now();
    w.loading = false;
    paintWalletBalances();
  });
}
function paintWalletBalances() {
  if (!$root) return;
  var box = $root.querySelector('[data-role="wallet-balances"]');
  if (box) box.innerHTML = walletBalancesHTML();
}
function walletRowHTML(label, value, dim) {
  return '<div class="cm-wrow"><span class="cm-wsym">' + escapeHTML(label) + "</span>" +
    '<span class="cm-wval' + (dim ? " dim" : "") + '">' + escapeHTML(value) + "</span></div>";
}
function walletBalancesHTML() {
  var w = ui.wallet;
  var d = w.data;
  var html = "";
  WALLET_CHAINS.forEach(function (chain) {
    var entry = null;
    if (d && Array.isArray(d.chains)) d.chains.forEach(function (item) { if (item && item.key === chain.key) entry = item; });
    var chainData = entry && entry.ok ? entry.data : null;
    var error = entry && !entry.ok ? entry.error : "";
    html += '<div class="cm-wchain">' +
      '<div class="cm-wchain-head"><span>' + escapeHTML(chain.name) + " network</span>" +
      '<span class="cm-wnet">' + escapeHTML(chain.native.symbol) + "</span></div>";
    html += walletRowHTML(chain.native.symbol, chainData ? chainData.native.amount : (w.loading ? "…" : "—"), !chainData);
    if (chainData) {
      chainData.tokens.forEach(function (token) {
        html += walletRowHTML(token.symbol, token.amount, false);
      });
    } else {
      chainTokens(chain).forEach(function (token) { html += walletRowHTML(token.symbol, w.loading ? "…" : "—", true); });
    }
    if (error) html += '<div class="cm-werror">' + escapeHTML(error) + "</div>";
    html += "</div>";
  });
  if (w.error) html += '<div class="cm-werror">' + escapeHTML(w.error) + "</div>";
  return html;
}
function profileImageURL() { return (state && state.profileImage) || DEFAULT_PROFILE_IMAGE; }
function setProfilePictureFromFile() {
  if (!state) return;
  var input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.style.display = "none";
  document.body.appendChild(input);
  input.onchange = function () {
    var file = input.files && input.files[0];
    input.remove();
    if (!file) return;
    readFileAsDataURL(file).then(compressProfileImage).then(function (dataUrl) {
      if (!state) return;
      state.profileImage = dataUrl;
      saveState();
      render();
      toast("Profile picture updated");
    }).catch(function (error) {
      toast(error && error.message ? error.message : "Could not set the picture");
    });
  };
  input.click();
}
function normalizeNftUri(value) {
  var url = String(value || "").trim();
  if (url.indexOf("ipfs://") === 0) url = "https://ipfs.io/ipfs/" + url.slice(7);
  if (url.indexOf("ipfs/") === 0) url = "https://ipfs.io/" + url;
  if (url.indexOf("ar://") === 0) url = "https://arweave.net/" + url.slice(5);
  return url;
}
function fetchNftMetadata(uri) {
  if (uri.indexOf("data:application/json") === 0) {
    var comma = uri.indexOf(",");
    var jsonText = comma >= 0 ? uri.slice(comma + 1) : "";
    if (/;base64/i.test(uri.slice(0, comma))) jsonText = atob(jsonText);
    return Promise.resolve(JSON.parse(jsonText));
  }
  var url = normalizeNftUri(uri);
  if (/\.(png|jpe?g|gif|webp|svg)(\?|#|$)/i.test(url)) return Promise.resolve({ image: url });
  return fetchWithTimeout(url, { cache: "no-store" }, 15000).then(function (r) {
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.json();
  });
}
function fetchNftImage(contract, tokenId, chainKey) {
  var chain = walletChainByKey(chainKey || "celo");
  if (!chain) return Promise.reject(new Error("Unknown network"));
  var iface = new window.ethers.utils.Interface(NFT_ABI);
  var data = iface.encodeFunctionData("tokenURI", [tokenId]);
  return rpcCall(chain, "eth_call", [{ to: contract, data: data }, "latest"]).then(function (hex) {
    var uri = "";
    try { uri = iface.decodeFunctionResult("tokenURI", hex)[0]; } catch (e) { uri = ""; }
    if (!uri) throw new Error("The contract returned an empty token URI");
    return fetchNftMetadata(uri);
  }).then(function (meta) {
    var image = meta && (meta.image || meta.image_url || meta.animation_url);
    if (!image) throw new Error("No image in the NFT metadata");
    return normalizeNftUri(image);
  });
}
function setProfilePictureFromNft() {
  if (!state) return;
  var contract = window.prompt("NFT contract address (0x…)");
  if (!contract) return;
  if (!isAddress(contract.trim())) { toast("Enter a valid contract address"); return; }
  var tokenId = window.prompt("Token ID");
  if (tokenId == null || !String(tokenId).trim()) return;
  var network = window.prompt("Network: celo or bsc", "celo");
  if (!network) return;
  toast("Looking up NFT…", 4000);
  fetchNftImage(contract.trim(), String(tokenId).trim(), network.trim().toLowerCase()).then(function (url) {
    if (!state) return;
    state.profileImage = sanitizeProfileImage(url) || url;
    saveState();
    render();
    toast("Profile picture updated from NFT");
  }).catch(function (error) {
    toast("Could not load that NFT: " + (error && error.message ? error.message : String(error)), 7000);
  });
}
function resetProfilePicture() {
  if (!state) return;
  state.profileImage = "";
  saveState();
  render();
  toast("Using the default profile picture");
}
function walletCreate() {
  if (!state) return;
  var wallet = makeWallet();
  if (!wallet) { toast("This device cannot create a wallet. Update Android System WebView."); return; }
  state.wallet = wallet;
  ui.wallet = { data: null, loading: false, error: "", at: 0 };
  saveState();
  render();
  refreshWallet(true);
  toast("Wallet created");
}
function walletImport() {
  if (!state) return;
  var raw = window.prompt("Paste your wallet private key (64 hex characters)");
  if (!raw) return;
  var wallet = cleanWallet({ privateKey: raw });
  if (!wallet) { toast("That private key is not valid"); return; }
  state.wallet = wallet;
  ui.wallet = { data: null, loading: false, error: "", at: 0 };
  saveState();
  render();
  refreshWallet(true);
  toast("Wallet imported");
}
function walletCopy() {
  if (!state || !state.wallet) return;
  copyText(state.wallet.address).then(function (ok) { toast(ok ? "Wallet address copied" : "Could not copy the address"); });
}
function walletReveal() {
  if (!state || !state.wallet) return;
  if (!window.confirm("Show your private key? Never share it with anyone. Anyone with this key can take your funds.")) return;
  var modal = openModal("Back up wallet key");
  modal.body.appendChild(el("p", "cm-muted", "Wallet address: " + state.wallet.address));
  var code = el("div", "cm-idbox", state.wallet.privateKey);
  modal.body.appendChild(code);
  modal.body.appendChild(el("p", "cm-muted", "Write this key down and keep it offline. If you lose it, the funds are gone."));
  var copy = el("button", "cm-btn primary", "Copy key");
  copy.onclick = function () { copyText(state.wallet.privateKey).then(function (ok) { toast(ok ? "Key copied" : "Could not copy — select it manually"); }); };
  var close = el("button", "cm-btn", "Close");
  close.onclick = modal.close;
  modal.actions.appendChild(close);
  modal.actions.appendChild(copy);
}
function saveHdoToken() {
  var input = document.getElementById("hdoInput");
  var value = input ? String(input.value || "").trim() : "";
  if (value && !isAddress(value)) { toast("Enter a full 0x… contract address (42 characters)"); return; }
  state.settings.hdoToken = value;
  saveState();
  ui.wallet = { data: null, loading: false, error: "", at: 0 };
  render();
  refreshWallet(true);
  toast(value ? "HDO contract saved" : "Using the default HDO contract");
}

/* ---------- token / airdrop actions ---------- */
async function sendTokenOnChain(options) {
  if (!walletSupported()) throw new Error("This device cannot sign transactions");
  var chain = walletChainByKey(options && options.chainKey);
  if (!chain) throw new Error("Choose a network");
  if (!isAddress(options.to)) throw new Error("Enter a valid wallet address");
  var token = options.token || null;
  var amount = options.amountRaw;
  if (!amount || amount.lte(0)) throw new Error("Enter an amount");
  var key = String(options.privateKey || (state.wallet && state.wallet.privateKey) || "").replace(/^0x/i, "").toLowerCase();
  if (!isHexKey(key)) throw new Error("Create a wallet first");
  var signer = new window.ethers.Wallet("0x" + key);
  var txTo = token ? token.address : options.to;
  var value = token ? window.ethers.BigNumber.from(0) : amount;
  var data = token ? new window.ethers.utils.Interface(ERC20_ABI).encodeFunctionData("transfer", [options.to, amount]) : "0x";
  var nonceHex = await rpcCall(chain, "eth_getTransactionCount", [signer.address, "pending"]);
  var gasPriceHex = await rpcCall(chain, "eth_gasPrice", []);
  var gasLimit;
  try {
    var estimateHex = await rpcCall(chain, "eth_estimateGas", [{ from: signer.address, to: txTo, data: data, value: "0x" + value.toString(16) }]);
    gasLimit = window.ethers.BigNumber.from(estimateHex).mul(120).div(100);
  } catch (e) {
    gasLimit = window.ethers.BigNumber.from(token ? 65000 : 21000);
  }
  var raw = await signer.signTransaction({
    nonce: window.ethers.BigNumber.from(nonceHex).toNumber(),
    gasPrice: window.ethers.BigNumber.from(gasPriceHex),
    gasLimit: gasLimit,
    to: txTo,
    value: value,
    data: data,
    chainId: chain.chainId
  });
  var hash = await rpcCall(chain, "eth_sendRawTransaction", [raw]);
  if (!/^0x[0-9a-f]{64}$/i.test(String(hash || ""))) throw new Error("The network did not return a transaction hash");
  return {
    chainKey: chain.key,
    chainName: chain.name,
    symbol: token ? token.symbol : chain.native.symbol,
    amount: String(options.amountText || "").replace(/,/g, ""),
    to: options.to,
    tx: hash
  };
}
async function createAirdrop(options) {
  if (!state.wallet) throw new Error("Create a wallet first");
  var chain = walletChainByKey(options.chainKey);
  if (!chain) throw new Error("Choose a network");
  var token = options.token || null;
  var amount = options.amountRaw;
  if (!amount || amount.lte(0)) throw new Error("Enter an amount");
  var claim = makeWallet();
  if (!claim) throw new Error("Could not create a temporary claim wallet");
  var gasPrice = window.ethers.BigNumber.from(await rpcCall(chain, "eth_gasPrice", []));
  var stipend = gasPrice.mul(token ? 160000 : 50000);
  var info = {
    chainKey: chain.key,
    claimKey: claim.privateKey,
    claimAddress: claim.address,
    amount: String(options.amountText || "").replace(/,/g, ""),
    amountRaw: amount,
    decimals: token ? token.decimals : chain.native.decimals,
    symbol: token ? token.symbol : chain.native.symbol,
    tokenAddress: token ? token.address : "",
    fundingTx: "",
    stipendTx: "",
    maxClaims: isFinite(Number(options && options.maxClaims)) && Number(options.maxClaims) > 0 ? Math.floor(Number(options.maxClaims)) : 1,
    claimsUsed: 0
  };
  if (!/^\d+(\.\d+)?$/.test(info.amount)) info.amount = formatAmount(amount, info.decimals);

  if (token) {
    var fund = await sendTokenOnChain({
      chainKey: chain.key,
      token: null,
      to: claim.address,
      amountRaw: stipend,
      amountText: formatAmount(stipend, chain.native.decimals)
    });
    info.stipendTx = fund.tx;
    var funded = await sendTokenOnChain({
      chainKey: chain.key,
      token: token,
      to: claim.address,
      amountRaw: amount,
      amountText: info.amount
    });
    info.fundingTx = funded.tx;
    return info;
  }
  var sent = await sendTokenOnChain({
    chainKey: chain.key,
    token: null,
    to: claim.address,
    amountRaw: amount.add(stipend),
    amountText: formatAmount(amount.add(stipend), chain.native.decimals)
  });
  info.fundingTx = sent.tx;
  return info;
}
function airdropForMessage(message) { return message && message.airdrop ? sanitizeAirdrop(message.airdrop) : null; }
function findMessage(id) {
  if (!state || ui.mode !== "thread") return null;
  var threadKey = ui.peer === "community" ? ("room:" + roomSlug()) : ("dm:" + ui.peer);
  var thread = state.threads[threadKey];
  if (!thread) return null;
  for (var i = 0; i < thread.messages.length; i += 1) if (thread.messages[i].id === id) return thread.messages[i];
  return null;
}
function messageClipboardText(message) {
  if (!message) return "";
  var parts = [];
  if (message.image) parts.push("[Photo]");
  if (message.token) {
    var chain = walletChainByKey(message.token.chain);
    parts.push("💸 Sent " + message.token.amount + " " + message.token.symbol + " on " + (chain ? chain.name : message.token.chain));
    if (message.token.to) parts.push("To: " + message.token.to);
    if (message.token.tx) parts.push("Transaction: " + message.token.tx);
  }
  if (message.airdrop) {
    var airdropChain = walletChainByKey(message.airdrop.chain);
    parts.push("🎁 Airdrop: " + message.airdrop.amount + " " + message.airdrop.symbol + " on " + (airdropChain ? airdropChain.name : message.airdrop.chain));
  }
  if (message.text && !(message.image && message.text === "📷 Photo") &&
      !(message.token && message.text.indexOf("💸") === 0) &&
      !(message.airdrop && message.text.indexOf("🎁") === 0)) {
    parts.push(message.text);
  }
  return parts.join("\n");
}
function copyMessage(id) {
  var message = findMessage(id);
  if (!message) return;
  var text = messageClipboardText(message);
  if (!text) { toast("This message has nothing to copy"); return; }
  copyText(text).then(function (ok) { toast(ok ? "Message copied" : "Could not copy the message"); });
}
async function claimAirdropById(id) {
  var message = findMessage(id);
  var airdrop = airdropForMessage(message);
  if (!message || !airdrop) return;
  if (airdrop.claimed || airdrop.claimedTx) { toast("This airdrop has already been claimed"); return; }
  if (airdrop.maxClaims && (airdrop.claimsUsed || 0) >= airdrop.maxClaims) { toast("This airdrop has reached its claim limit of " + airdrop.maxClaims + " claimers"); return; }
  if (!state.wallet) { toast("Create or import a wallet first"); return; }
  var chain = walletChainByKey(airdrop.chain);
  if (!chain) { toast("This airdrop uses an unsupported network"); return; }
  if (!window.confirm("Claim " + airdrop.amount + " " + airdrop.symbol + " on " + chain.name + " to your wallet " + state.wallet.address + "?\n\nThe first claim succeeds. This cannot be undone.")) return;
  toast("Claiming " + airdrop.amount + " " + airdrop.symbol + " on " + chain.name + "…", 9000);
  try {
    var token = airdrop.tokenAddress ? { address: airdrop.tokenAddress, symbol: airdrop.symbol, decimals: airdrop.decimals } : null;
    var result = await sendTokenOnChain({
      chainKey: airdrop.chain,
      token: token,
      to: state.wallet.address,
      amountRaw: parseUnits(airdrop.amount, airdrop.decimals),
      amountText: airdrop.amount,
      privateKey: airdrop.claimKey
    });
    airdrop.claimed = true;
    airdrop.claimedTx = result.tx;
    airdrop.claimedBy = state.wallet.address;
    airdrop.claimsUsed = (airdrop.claimsUsed || 0) + 1;
    message.airdrop = airdrop;
    saveState();
    render();
    toast("✅ Claimed " + airdrop.amount + " " + airdrop.symbol + " on " + chain.name, 8000);
    refreshWallet(true);
  } catch (e) {
    toast("Airdrop not claimed: " + (e && e.message ? e.message : String(e)), 9000);
  }
}

/* ---------- modal helpers ---------- */
function el(tag, cls, text) {
  var node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}
function openModal(title) {
  var overlay = el("div", "cm-modal");
  var card = el("div", "cm-card");
  var heading = el("h3", "", title);
  var body = el("div");
  var actions = el("div", "cm-modal-actions");
  card.appendChild(heading);
  card.appendChild(body);
  card.appendChild(actions);
  overlay.appendChild(card);
  document.body.appendChild(overlay);
  function close() { overlay.remove(); }
  overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
  return { body: body, actions: actions, close: close };
}
function openProfileModal(id) {
  var profileId = normalizeId(id);
  if (!profileId) return;
  var isMe = profileId === state.user.id;
  var contact = isMe ? null : state.contacts[profileId];
  if (!isMe && !contact) {
    contact = { id: profileId, name: defaultName(profileId), emoji: "🙂", publicKey: "", wallet: "", lastSeen: 0 };
    state.contacts[profileId] = contact;
  }
  var name = isMe ? state.user.name : (contact ? contact.name : defaultName(profileId));
  var emoji = isMe ? state.user.emoji : (contact ? contact.emoji : "🙂");
  var wallet = isMe
    ? (state.wallet && isAddress(state.wallet.address) ? state.wallet.address : "")
    : (contact && isAddress(contact.wallet) ? contact.wallet : "");
  var modal = openModal(isMe ? "Your profile" : "Profile");

  var head = el("div", "cm-profile");
  head.innerHTML = '<span class="cm-avatar">' + escapeHTML(emoji) + "</span>" +
    '<div style="flex:1;min-width:0"><div class="cm-rowname">' + escapeHTML(name) +
      (isMe ? "" : verifiedBadge(profileId)) + "</div>" +
      '<div class="cm-rowsub">' + escapeHTML(isMe ? "This is you" : profileId) + "</div></div>";
  modal.body.appendChild(head);

  var idRow = el("div", "cm-inline");
  idRow.style.marginTop = "12px";
  idRow.appendChild(el("div", "cm-idbox", profileId));
  var copyId = el("button", "cm-btn", "Copy ID");
  copyId.type = "button";
  copyId.onclick = function () { copyText(profileId).then(function (ok) { toast(ok ? "ID copied" : "Could not copy the ID"); }); };
  idRow.appendChild(copyId);
  modal.body.appendChild(idRow);

  modal.body.appendChild(el("p", "cm-muted", isMe ? "Your wallet address" : "Wallet address"));
  if (wallet) {
    modal.body.appendChild(el("div", "cm-idbox", wallet));
    var copyWallet = el("button", "cm-btn", "Copy wallet");
    copyWallet.type = "button";
    copyWallet.onclick = function () { copyText(wallet).then(function (ok) { toast(ok ? "Wallet address copied" : "Could not copy the wallet address"); }); };
    modal.actions.appendChild(copyWallet);
  } else {
    modal.body.appendChild(el("p", "cm-muted", isMe ? "No wallet has been created on this phone yet." : "No wallet address shared yet."));
  }

  if (!isMe) {
    var walletInput = inputBox("0x… (42 characters)", wallet);
    walletInput.style.marginTop = "8px";
    modal.body.appendChild(walletInput);
  }

  if (!isMe) {
    var followInfo = el("p", "cm-muted", "Followers: " + (contact && contact.followers ? contact.followers.length : 0) + " · Following: " + (contact && contact.following ? contact.following.length : 0));
    modal.body.appendChild(followInfo);
    var followBtn = el("button", "cm-btn", (state.following && state.following.indexOf(profileId) !== -1) ? "Unfollow" : "Follow");
    followBtn.type = "button";
    followBtn.onclick = function () {
      if (!state.following) state.following = [];
      var index = state.following.indexOf(profileId);
      if (index === -1) state.following.push(profileId); else state.following.splice(index, 1);
      saveState();
      publishPresence(true);
      modal.close();
      openProfileModal(profileId);
    };
    modal.actions.appendChild(followBtn);
  }

  var closeBtn = el("button", "cm-btn", "Close");
  closeBtn.type = "button";
  closeBtn.onclick = modal.close;
  modal.actions.appendChild(closeBtn);

  if (isMe) {
    var walletTab = el("button", "cm-btn primary", "Open wallet");
    walletTab.type = "button";
    walletTab.onclick = function () { modal.close(); ui.tab = "wallet"; ui.mode = "tabs"; render(); };
    modal.actions.appendChild(walletTab);
    return;
  }

  var messageBtn = el("button", "cm-btn", "Message");
  messageBtn.type = "button";
  messageBtn.onclick = function () { modal.close(); openThread(profileId); };
  modal.actions.appendChild(messageBtn);

  var saveWallet = el("button", "cm-btn primary", wallet ? "Change wallet" : "Save wallet");
  saveWallet.type = "button";
  saveWallet.onclick = function () {
    var input = modal.body.querySelector("input");
    var value = input ? String(input.value || "").trim() : "";
    if (!value) {
      if (contact) contact.wallet = "";
      saveState();
      modal.close();
      toast("Friend wallet removed");
      return;
    }
    if (!isAddress(value)) { toast("Enter a valid 0x wallet address (42 characters)"); return; }
    if (contact) contact.wallet = window.ethers.utils.getAddress(value);
    saveState();
    modal.close();
    toast("Friend wallet saved");
  };
  modal.actions.appendChild(saveWallet);
}

function field(labelText, control) {
  var wrap = el("div", "cm-field");
  wrap.appendChild(el("label", "cm-label", labelText));
  wrap.appendChild(control);
  return wrap;
}
function selectInput(options, value) {
  var select = el("select", "cm-input cm-select");
  options.forEach(function (option) {
    var item = document.createElement("option");
    item.value = option.value;
    item.textContent = option.label;
    select.appendChild(item);
  });
  if (value != null) select.value = value;
  return select;
}
function inputBox(placeholder, value) {
  var input = el("input", "cm-input");
  input.type = "text";
  input.placeholder = placeholder || "";
  input.autocomplete = "off";
  input.spellcheck = false;
  if (value) input.value = value;
  return input;
}
function chatTokenOptions(chain, scope) {
  var tokens = chainTokens(chain);
  if (scope === "all" || scope === "wallet") return tokens;
  if (scope === "public") return tokens.filter(function (token) { return token.symbol === PUBLIC_ROOM_TOKEN; });
  return tokens.filter(function (token) { return PRIVATE_CHAT_TOKENS.indexOf(token.symbol) !== -1; });
}

function openSendTokenModal(post) {
  if (!state) return;
  if (post && (ui.mode !== "thread" || !ui.peer)) { toast("Open a room or direct chat first"); return; }
  if (post && ui.peer === "community" && isAiRoom()) { toast("Tokens can't be sent in the AI Room"); return; }
  if (!state.wallet) { toast("Create or import a wallet first"); return; }
  if (!walletSupported()) { toast("This device cannot sign transactions"); return; }

  var publicScope = post && ui.peer === "community" && isPresetRoom(roomSlug());
  var scope = post ? (publicScope ? "public" : "private") : "wallet";
  var allowedChains = publicScope ? WALLET_CHAINS.filter(function (c) { return c.key === "celo"; }) : WALLET_CHAINS;
  var delivery = "send";
  var modal = openModal(post ? "Send tokens in this chat" : "Send tokens");

  if (post) {
    var where = ui.peer === "community"
      ? "You are in " + roomInfo(roomSlug()).name + ". Paste the wallet address of the person you want to pay. Choose Airdrop to let the first room member claim the tokens."
      : "This sends tokens on-chain to your friend's wallet address.";
    modal.body.appendChild(el("p", "cm-muted", where));
    modal.body.appendChild(el("p", "cm-muted", publicScope ? "This public room only supports HDO." : "Private rooms and direct chats support CELO, USDT, USDC, HDO and BTC."));
    var deliverySelect = selectInput([{ value: "send", label: "Send to a wallet address" }, { value: "airdrop", label: "Airdrop — first person to claim it" }], "send");
    modal.body.appendChild(field("Delivery", deliverySelect));
  }

  var chainSelect = selectInput(allowedChains.map(function (c) { return { value: c.key, label: c.name + " · " + c.native.symbol }; }), allowedChains[0].key);
  modal.body.appendChild(field("Network", chainSelect));
  var assetSelect = el("select", "cm-input cm-select");
  modal.body.appendChild(field("Token", assetSelect));
  var toInput = inputBox("0x… (42 characters)");
  if (post && ui.peer !== "community" && state.contacts[ui.peer] && state.contacts[ui.peer].wallet) toInput.value = state.contacts[ui.peer].wallet;
  var toField = field("Recipient wallet address", toInput);
  modal.body.appendChild(toField);
  var amountInput = inputBox("0.0");
  amountInput.inputMode = "decimal";
  modal.body.appendChild(field("Amount", amountInput));
  var maxField = el("div", "cm-field");
  maxField.style.display = (post && delivery === "airdrop") ? "" : "none";
  maxField.appendChild(el("label", "cm-label", "Max claims"));
  var maxInput = inputBox("1");
  maxInput.type = "number";
  maxInput.min = "1";
  maxInput.max = "1000";
  maxField.appendChild(maxInput);
  modal.body.appendChild(maxField);
  var info = el("p", "cm-muted", "");
  modal.body.appendChild(info);

  function currentChain() { return walletChainByKey(chainSelect.value) || allowedChains[0]; }
  function currentAsset() {
    var active = currentChain();
    var value = String(assetSelect.value || "native");
    if (value === "native") return { symbol: active.native.symbol, decimals: active.native.decimals, address: "", native: true };
    var tokens = chainTokens(active);
    for (var i = 0; i < tokens.length; i += 1) if (String(tokens[i].address).toLowerCase() === value.toLowerCase()) return tokens[i];
    return { symbol: active.native.symbol, decimals: active.native.decimals, address: "", native: true };
  }
  function updateInfo() {
    var active = currentChain();
    var asset = currentAsset();
    var balance = walletAssetBalance(active.key, asset.symbol);
    info.textContent = "Available: " + (balance ? balance.amount + " " + asset.symbol : "not loaded — refresh the wallet first") +
      "\nNetwork fee is paid in " + active.native.symbol + ".";
  }
  function fillAssets() {
    var active = currentChain();
    assetSelect.innerHTML = "";
    var preferred = "";
    var tokens = chatTokenOptions(active, scope);
    var allowNative = scope !== "public";
    if (allowNative) {
      var nativeOption = document.createElement("option");
      nativeOption.value = "native";
      nativeOption.textContent = active.native.symbol + " (native)";
      assetSelect.appendChild(nativeOption);
      preferred = "native";
    }
    tokens.forEach(function (token) {
      var option = document.createElement("option");
      option.value = token.address;
      option.textContent = token.symbol;
      assetSelect.appendChild(option);
    });
    if (scope === "public" || (post && delivery === "airdrop")) {
      tokens.forEach(function (token) { if (token.symbol === PUBLIC_ROOM_TOKEN) preferred = token.address; });
    }
    assetSelect.value = preferred || (tokens.length ? tokens[0].address : "native");
    updateInfo();
  }
  chainSelect.onchange = fillAssets;
  assetSelect.onchange = updateInfo;
  fillAssets();

  function applyDelivery() {
    delivery = deliverySelect ? String(deliverySelect.value || "send") : "send";
    var isAirdrop = post && delivery === "airdrop";
    toField.style.display = isAirdrop ? "none" : "";
    maxField.style.display = isAirdrop ? "" : "none";
    sendButton.textContent = isAirdrop ? "Create airdrop" : "Send";
    fillAssets();
    info.textContent = "";
    updateInfo();
    if (isAirdrop) {
      var maxClaimsNow = Number(maxInput.value);
      var maxClaimsValid = isFinite(maxClaimsNow) && maxClaimsNow >= 1;
      info.textContent += "\nAirdrop funding also pays a small gas stipend so the claimer can move the funds.";
      if (maxClaimsValid) info.textContent += "\nUp to " + maxClaimsNow + (maxClaimsNow === 1 ? " person can claim this airdrop." : " people can claim this airdrop.") + ".";
    }
  }

  var cancel = el("button", "cm-btn", "Cancel");
  cancel.onclick = modal.close;
  var sendButton = el("button", "cm-btn primary", "Send");
  sendButton.onclick = async function () {
    var active = currentChain();
    var asset = currentAsset();
    var isAirdrop = post && delivery === "airdrop";
    var to = String(toInput.value || "").trim();
    var amountText = String(amountInput.value || "").trim();
    if (!isAirdrop && !isAddress(to)) { toast("Enter a valid 0x wallet address (42 characters)"); return; }
    var amountRaw;
    try { amountRaw = parseUnits(amountText, asset.decimals); } catch (e) { toast("Enter a valid amount"); return; }
    if (amountRaw.lte(0)) { toast("Enter an amount greater than zero"); return; }
    modal.close();
    if (isAirdrop) {
      var maxClaims = post && isAirdrop ? (isFinite(Number(maxInput.value)) && Number(maxInput.value) >= 1 ? Math.floor(Number(maxInput.value)) : 1) : 1;
      if (!window.confirm("Create an airdrop of " + amountText + " " + asset.symbol + " on " + active.name + "?\n\nThe first person in this chat to claim gets the tokens. This cannot be undone.")) return;
      toast("Funding the airdrop on " + active.name + "…", 9000);
      try {
        var airdropInfo = await createAirdrop({ chainKey: active.key, token: asset.native ? null : asset, amountRaw: amountRaw, amountText: amountText, maxClaims: maxClaims });
        await sendMessage("", "", { airdrop: airdropInfo });
        toast("Airdrop posted. The first person to claim gets it.", 7000);
        refreshWallet(true);
      } catch (e) {
        toast("Airdrop not created: " + (e && e.message ? e.message : String(e)), 9000);
      }
      return;
    }
    if (!window.confirm("Send " + amountText + " " + asset.symbol + " on " + active.name + " to " + to + "?\n\nThis cannot be undone.")) return;
    toast("Signing and sending on " + active.name + "…", 9000);
    try {
      var result = await sendTokenOnChain({ chainKey: active.key, token: asset.native ? null : asset, to: to, amountRaw: amountRaw, amountText: amountText });
      if (post) {
        if (ui.peer !== "community" && state.contacts[ui.peer]) { state.contacts[ui.peer].wallet = to; saveState(); }
        await sendMessage("", "", { token: { chain: result.chainKey, symbol: result.symbol, amount: result.amount, to: result.to, tx: result.tx } });
      }
      toast("✅ Sent " + result.amount + " " + result.symbol + " on " + result.chainName, 8000);
      refreshWallet(true);
    } catch (e) {
      toast("Token not sent: " + (e && e.message ? e.message : String(e)), 9000);
    }
  };
  modal.actions.appendChild(cancel);
  modal.actions.appendChild(sendButton);
  if (deliverySelect) deliverySelect.onchange = applyDelivery;
  applyDelivery();
}

var WALLPAPERS = ["pattern", "sky", "mint", "sunset", "night", "paris", "lion", "community", "unicorn", "plug"];
function chatWallpaper() {
  var value = state && state.settings ? state.settings.chatWallpaper : "";
  if (value === "image" && state && state.settings && state.settings.chatWallpaperImage) return "image";
  return WALLPAPERS.indexOf(value) === -1 ? "pattern" : value;
}
function setWallpaper(value) {
  if (!state) return;
  if (!state.settings) state.settings = {};
  if (value === "image" && !state.settings.chatWallpaperImage) return;
  state.settings.chatWallpaper = (value === "image" || WALLPAPERS.indexOf(value) !== -1) ? value : "pattern";
  saveState();
  render();
  toast("Chat wallpaper updated");
}
function setWallpaperImageFromFile() {
  var input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.style.display = "none";
  document.body.appendChild(input);
  input.onchange = function () {
    var f = input.files && input.files[0];
    input.remove();
    if (!f) return;
    readFileAsDataURL(f).then(compressImage).then(function (dataUrl) {
      if (!state) return;
      if (!state.settings) state.settings = {};
      state.settings.chatWallpaperImage = dataUrl;
      state.settings.chatWallpaper = "image";
      saveState();
      render();
      toast("Chat background image updated");
    }).catch(function (e) { toast(e && e.message ? e.message : "Could not set the background image"); });
  };
  input.click();
}
function clearWallpaperImage() {
  if (!state) return;
  if (!state.settings) state.settings = {};
  state.settings.chatWallpaperImage = "";
  if (state.settings.chatWallpaper === "image") state.settings.chatWallpaper = "pattern";
  saveState();
  render();
  toast("Chat background image removed");
}
function toggleThreadSearch() {
  ui.searchOpen = !ui.searchOpen;
  if (!ui.searchOpen) { ui.search = ""; render(); return; }
  render();
  var input = document.getElementById("searchInput");
  if (input) input.focus();
}
function gameById(id) {
  if (!state || !state.games) return null;
  for (var i = 0; i < state.games.length; i += 1) {
    if (state.games[i] && state.games[i].id === id) return state.games[i];
  }
  return null;
}
function createGame() {
  if (!state) return;
  if (!isAdmin()) { toast("Only the admin can create games"); return; }
  if (!state.games) state.games = [];
  if (state.games.length >= 10) { toast("Game limit reached (10)"); return; }
  var nameInput = document.getElementById("gameName");
  var typeInput = document.getElementById("gameType");
  var stakeInput = document.getElementById("gameStake");
  var name = String(nameInput && nameInput.value || "").replace(/\s+/g, " ").trim();
  if (!name) { toast("Enter a game name"); return; }
  var type = typeInput ? typeInput.value : "dice";
  var stake = String(stakeInput && stakeInput.value || "1").replace(/[^0-9.]/g, "").trim() || "1";
  var game = cleanGameRecord({
    id: uid(),
    name: name.slice(0, 40),
    type: type,
    stake: stake,
    creator: state.user.id,
    createdAt: Date.now(),
    expiresAt: Date.now() + GAME_LIFETIME_MS,
    plays: 0,
    prizePool: Math.max(0, parseFloat(stake) || 0),
    paid: 0,
    players: [],
    status: "open"
  });
  if (!game) { toast("Enter a game name"); return; }
  state.games.push(game);
  saveState();
  publishGameEvent("create", game);
  toast("Game created");
  render();
}
function expireGames() {
  if (!state || !state.games) return false;
  var nowMs = Date.now();
  var changed = false;
  state.games.forEach(function (g) {
    if (!g || g.status !== "open") return;
    if (g.expiresAt && nowMs > (Number(g.expiresAt) || 0)) { g.status = "returned"; changed = true; }
  });
  if (changed) saveState();
  return changed;
}
function refreshGameUI() {
  if ((ui.mode === "tabs" && ui.tab === "games") || (ui.mode === "game" && ui.gameId)) render();
}
function applyRemoteGame(env, silent) {
  if (!state || !env) return false;
  var action = String(env.action || "create");
  var fromAdmin = normalizeId(env.from) === DEV_ID;
  if (!state.games) state.games = [];
  if (!state.cashouts) state.cashouts = [];

  if (action === "cashout") {
    var cash = cleanCashoutRecord({
      id: env.cashoutId,
      user: env.player,
      points: env.points,
      hdo: env.hdo,
      address: env.address,
      status: "pending",
      createdAt: env.ts
    });
    if (!cash) return false;
    if (!fromAdmin && normalizeId(env.from) !== cash.user) return false;
    if (findCashout(cash.id)) return false;
    state.cashouts.push(cash);
    if (!silent) { saveState(); refreshGameUI(); }
    return true;
  }

  if (action === "cashout-paid" || action === "cashout-reject") {
    if (!fromAdmin) return false;
    var cashId = String(env.cashoutId || "").slice(0, 80);
    var record = findCashout(cashId);
    if (!record) return false;
    record.status = action === "cashout-paid" ? "paid" : "rejected";
    if (action === "cashout-paid") {
      record.tx = /^0x[0-9a-f]{64}$/i.test(String(env.tx || "")) ? String(env.tx).toLowerCase() : record.tx;
      record.paidAt = Number(env.ts) || Date.now();
    } else if (record.user === state.user.id) {
      if (!state.gameScores) state.gameScores = {};
      state.gameScores[record.user] = (Number(state.gameScores[record.user]) || 0) + record.points;
    }
    if (!silent) { saveState(); refreshGameUI(); }
    return true;
  }

  if (action === "delete") {
    var deleteId = String(env.gameId || (env.game && env.game.id) || "").slice(0, 80);
    if (!deleteId) return false;
    var before = state.games.length;
    state.games = state.games.filter(function (g) { return g.id !== deleteId; });
    if (state.games.length === before) return false;
    if (!silent) { saveState(); refreshGameUI(); }
    return true;
  }

  if (action === "play") {
    var playId = String(env.gameId || "").slice(0, 80);
    var player = normalizeId(env.player);
    if (!playId || !player) return false;
    var game = gameById(playId);
    if (!game || game.status !== "open") return false;
    game.plays = Math.max(0, Number(game.plays) || 0) + 1;
    if (!Array.isArray(game.players)) game.players = [];
    if (game.players.indexOf(player) === -1 && game.players.length < 100) game.players.push(player);
    if (env.win) {
      var stakeNum = Math.max(0, parseFloat(game.stake) || 0);
      game.paid = Math.max(0, Number(game.paid) || 0) + stakeNum;
      game.lastWinner = player;
    }
    if (!silent) { saveState(); refreshGameUI(); }
    return true;
  }

  if (!fromAdmin) return false;
  var record = cleanGameRecord(env.game);
  if (!record) return false;
  var index = -1;
  for (var i = 0; i < state.games.length; i += 1) {
    if (state.games[i] && state.games[i].id === record.id) { index = i; break; }
  }
  if (index === -1) {
    if (state.games.length >= 10) return false;
    record.remote = true;
    state.games.push(record);
  } else {
    var current = state.games[index];
    record.plays = Math.max(Number(current.plays) || 0, record.plays);
    record.paid = Math.max(Number(current.paid) || 0, record.paid);
    if (isFinite(Number(current.prizePool))) record.prizePool = Math.min(Number(current.prizePool), record.prizePool);
    if (Array.isArray(current.players) && current.players.length) record.players = current.players;
    record.lastWinner = current.lastWinner || record.lastWinner;
    if (current.status === "finished" || current.status === "returned") record.status = current.status;
    record.remote = !!(current.remote || fromAdmin);
    state.games[index] = record;
  }
  if (!silent) { saveState(); refreshGameUI(); }
  return true;
}
function publishGameEvent(action, game, extra) {
  if (!state) return Promise.resolve(false);
  var env = {
    app: APP_TAG,
    v: ENVELOPE_VERSION,
    id: uid(),
    from: state.settings && state.settings.devMode ? DEV_ID : state.user.id,
    name: state.user.name,
    type: "game",
    action: String(action || "create"),
    ts: Date.now()
  };
  if (game) env.game = game;
  if (extra) {
    if (extra.gameId) env.gameId = extra.gameId;
    if (extra.player) env.player = extra.player;
    if (extra.win != null) env.win = !!extra.win;
    if (extra.points != null) env.points = Number(extra.points) || 0;
    if (extra.cashoutId) env.cashoutId = extra.cashoutId;
    if (extra.hdo != null) env.hdo = Number(extra.hdo) || 0;
    if (extra.address) env.address = String(extra.address);
    if (extra.tx) env.tx = String(extra.tx);
  }
  return publish(env, GAMES_TOPIC).then(function () { return true; }).catch(function () { return false; });
}
function deleteGame(id) {
  if (!state || !state.games) return;
  if (!isAdmin()) { toast("Only the admin can delete games"); return; }
  if (!gameById(id)) return;
  state.games = state.games.filter(function (g) { return g.id !== id; });
  saveState();
  publishGameEvent("delete", { id: id });
  render();
}
function findCashout(id) {
  if (!state || !state.cashouts) return null;
  var target = String(id || "");
  for (var i = 0; i < state.cashouts.length; i += 1) {
    if (state.cashouts[i] && state.cashouts[i].id === target) return state.cashouts[i];
  }
  return null;
}
function hdoChatToken() {
  var chain = walletChainByKey("celo");
  if (!chain) return null;
  var tokens = chainTokens(chain);
  for (var i = 0; i < tokens.length; i += 1) {
    if (tokens[i].symbol === "HDO") return { chain: chain, token: tokens[i] };
  }
  return null;
}
function gameTypeLabel(type) { return GAME_TYPE_LABELS[type] || "Game"; }
function gameTypeIcon(type) {
  if (type === "dice") return "🎲";
  if (type === "coin") return "🪙";
  if (type === "guess") return "🔢";
  if (type === "quiz") return "❓";
  if (type === "rps") return "✊";
  if (type === "wheel") return "🎡";
  if (type === "higher") return "📈";
  return "🎮";
}
function openGame(id) {
  if (!state || !state.games) return;
  var game = gameById(id);
  if (!game) return;
  if (game.status !== "open") { toast("This game is closed"); return; }
  if (game.expiresAt && Date.now() > (Number(game.expiresAt) || 0)) {
    expireGames();
    render();
    toast("This game expired. The remaining HDO went back to the admin.");
    return;
  }
  ui.mode = "game";
  ui.gameId = id;
  ui.gameResult = null;
  ui.gameRoll = 0;
  ui.gameNumber = 0;
  ui.gameGuess = 0;
  ui.gameCoin = "";
  ui.gameWheel = -1;
  ui.gameQuiz = null;
  render();
}
function closeGame() {
  ui.mode = "tabs";
  ui.tab = "games";
  ui.gameId = null;
  ui.gameResult = null;
  render();
}
function gameScore() {
  return state && state.gameScores ? (Number(state.gameScores[state.user.id]) || 0) : 0;
}
function gameCooldownLeft(type) {
  if (!state || !state.playDaily) return 0;
  var ts = Number(state.playDaily[type]) || 0;
  if (!ts) return 0;
  var left = PLAY_COOLDOWN_MS - (Date.now() - ts);
  return left > 0 ? left : 0;
}
function cooldownLabel(ms) {
  var totalMinutes = Math.max(1, Math.ceil(ms / 60000));
  var hours = Math.floor(totalMinutes / 60);
  var mins = totalMinutes % 60;
  return (hours > 0 ? hours + "h " : "") + mins + "m";
}
function bonusCooldownLeft() {
  if (!state || !state.bonusAt) return 0;
  var left = DAILY_BONUS_MS - (Date.now() - state.bonusAt);
  return left > 0 ? left : 0;
}
function claimDailyBonus() {
  if (!state) return;
  var wait = bonusCooldownLeft();
  if (wait > 0) { toast("Daily bonus already claimed. Next bonus in " + cooldownLabel(wait) + "."); return; }
  if (!state.gameScores) state.gameScores = {};
  state.gameScores[state.user.id] = gameScore() + DAILY_BONUS_POINTS;
  state.bonusAt = Date.now();
  saveState();
  render();
  toast("Daily bonus claimed: +" + DAILY_BONUS_POINTS + " points");
}
function finishGamePlay(game, win, detail) {
  if (!state || !game) return;
  var wait = gameCooldownLeft(game.type);
  if (wait > 0) {
    ui.gameResult = { id: game.id, win: null, detail: "Daily limit reached for " + gameTypeLabel(game.type) + ". Next play in " + cooldownLabel(wait) + "." };
    render();
    return;
  }
  if (!state.playDaily) state.playDaily = {};
  state.playDaily[game.type] = Date.now();
  game.plays = Math.max(0, Number(game.plays) || 0) + 1;
  if (!state.gameScores) state.gameScores = {};
  if (!Array.isArray(game.players)) game.players = [];
  if (game.players.indexOf(state.user.id) === -1 && game.players.length < 100) game.players.push(state.user.id);
  var pts = 0;
  if (win) {
    pts = Math.max(1, Math.round((parseFloat(game.stake) || 1) * POINTS_PER_HDO));
    state.gameScores[state.user.id] = (Number(state.gameScores[state.user.id]) || 0) + pts;
    var stakeNum = Math.max(0, parseFloat(game.stake) || 0);
    game.paid = Math.max(0, Number(game.paid) || 0) + stakeNum;
    game.lastWinner = state.user.id;
  }
  ui.gameResult = { id: game.id, win: win, detail: detail || (win ? "You won!" : (win === false ? "You lost." : "Tie — try again.")), pts: pts };
  saveState();
  publishGameEvent("play", game, { gameId: game.id, player: state.user.id, win: !!win, points: pts });
  render();
}
function dieFace(value) {
  var faces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
  return faces[Math.max(1, Math.min(6, Number(value) || 1)) - 1];
}
function gameRoll() {
  var game = gameById(ui.gameId);
  if (!game) return;
  var roll = Math.floor(Math.random() * 6) + 1;
  ui.gameRoll = roll;
  finishGamePlay(game, roll >= 4, "You rolled " + roll + ". " + (roll >= 4 ? "4 or higher wins!" : "You needed 4 or higher."));
}
function gameCoin(choice) {
  var game = gameById(ui.gameId);
  if (!game) return;
  var flip = Math.random() < 0.5 ? "heads" : "tails";
  ui.gameCoin = flip;
  finishGamePlay(game, choice === flip, "The coin landed on " + flip + ". You picked " + choice + ".");
}
function gameGuess(value) {
  var game = gameById(ui.gameId);
  if (!game) return;
  var number = Math.floor(Math.random() * 10) + 1;
  var guess = Number(value) || 0;
  var win = Math.abs(guess - number) <= 1;
  ui.gameGuess = number;
  finishGamePlay(game, win, "The number was " + number + ". You picked " + guess + (win ? " — close enough!" : "."));
}
function gameQuiz(index) {
  var game = gameById(ui.gameId);
  if (!game) return;
  var quiz = ui.gameQuiz && ui.gameQuiz.id === game.id ? ui.gameQuiz : null;
  if (!quiz) return;
  var question = QUIZ_BANK[quiz.index];
  if (!question) return;
  var win = Number(index) === question.answer;
  finishGamePlay(game, win, (win ? "Correct!" : "Wrong.") + " The answer was " + question.options[question.answer] + ".");
}
function gameRps(choice) {
  var game = gameById(ui.gameId);
  if (!game) return;
  var options = ["rock", "paper", "scissors"];
  var cpu = options[Math.floor(Math.random() * 3)];
  if (choice === cpu) {
    finishGamePlay(game, null, "You both picked " + choice + ". Tie — try again.");
    return;
  }
  var win = (choice === "rock" && cpu === "scissors") || (choice === "paper" && cpu === "rock") || (choice === "scissors" && cpu === "paper");
  finishGamePlay(game, win, "You: " + choice + " · CPU: " + cpu + ". " + (win ? "You win!" : "CPU wins."));
}
function gameWheel() {
  var game = gameById(ui.gameId);
  if (!game) return;
  var segments = ["WIN", "LOSE", "WIN", "LOSE", "WIN", "WIN", "LOSE", "WIN"];
  var index = Math.floor(Math.random() * segments.length);
  var win = segments[index] === "WIN";
  ui.gameWheel = index;
  finishGamePlay(game, win, "The wheel landed on segment " + (index + 1) + ": " + segments[index] + ".");
}
function gameHigher(direction) {
  var game = gameById(ui.gameId);
  if (!game) return;
  var current = Number(ui.gameNumber) || (Math.floor(Math.random() * 11) + 2);
  var next = Math.floor(Math.random() * 11) + 2;
  var win = next !== current && ((direction === "higher" && next > current) || (direction === "lower" && next < current));
  ui.gameNumber = next;
  finishGamePlay(game, win, "It was " + current + ", then " + next + ". You picked " + direction + ".");
}
function gameStageHTML(game) {
  if (game.status !== "open") {
    return '<div class="cm-gameclosed">' + (game.status === "finished" ? "🏁 This game has ended" : "⏰ Returned to admin") + "</div>";
  }
  var result = ui.gameResult && ui.gameResult.id === game.id ? ui.gameResult : null;
  var wait = gameCooldownLeft(game.type);
  var html = '<div class="cm-gamestage">';
  if (game.type === "dice") {
    html += '<div class="cm-diceface">' + dieFace(result ? (ui.gameRoll || 1) : 0) + "</div>";
  } else if (game.type === "coin") {
    html += '<div class="cm-coinface">🪙</div>' + (ui.gameCoin ? '<p class="cm-muted">Last flip: ' + ui.gameCoin + "</p>" : "");
  } else if (game.type === "guess") {
    html += '<div class="cm-gamebig">' + (ui.gameGuess || "?") + "</div>";
  } else if (game.type === "quiz") {
    if (wait <= 0) {
      if (!ui.gameQuiz || ui.gameQuiz.id !== game.id || result) ui.gameQuiz = { id: game.id, index: Math.floor(Math.random() * QUIZ_BANK.length) };
      var quiz = QUIZ_BANK[ui.gameQuiz.index];
      html += '<div class="cm-quizq">' + escapeHTML(quiz.q) + "</div>";
      quiz.options.forEach(function (option, i) {
        html += '<button type="button" class="cm-btn cm-quizoption" data-action="game-quiz" data-i="' + i + '">' + escapeHTML(option) + "</button>";
      });
    }
  } else if (game.type === "rps") {
    html += '<div class="cm-gamebig">✊✋✌️</div>';
  } else if (game.type === "wheel") {
    html += '<div class="cm-wheel">' + ["🎁", "💨", "🎁", "💨", "🎁", "🎁", "💨", "🎁"].map(function (s, i) {
      return '<span class="' + (ui.gameWheel === i ? "active" : "") + '">' + s + "</span>";
    }).join("") + "</div>";
  } else if (game.type === "higher") {
    if (!ui.gameNumber) ui.gameNumber = Math.floor(Math.random() * 11) + 2;
    html += '<div class="cm-gamebig">' + ui.gameNumber + '</div><p class="cm-muted">Will the next number be higher or lower?</p>';
  }
  if (result) {
    html += '<div class="cm-gameresult ' + (result.win === true ? "win" : result.win === false ? "lose" : "tie") + '">' +
      escapeHTML(result.detail || "") + (result.pts ? "<b>+" + result.pts + " points</b>" : "") + "</div>";
  }
  if (wait > 0) {
    html += '<div class="cm-gamelimit">✅ You already played ' + escapeHTML(gameTypeLabel(game.type)) + ' today.<br>Next play in <b>' + cooldownLabel(wait) + "</b>.</div>";
  } else {
    html += '<div class="cm-gamecontrols">';
    if (game.type === "dice") html += '<button type="button" class="cm-btn primary" data-action="game-roll">' + (result ? "Roll again" : "Roll the die") + "</button>";
    else if (game.type === "coin") html += '<button type="button" class="cm-btn primary" data-action="game-coin" data-choice="heads">Heads</button><button type="button" class="cm-btn primary" data-action="game-coin" data-choice="tails">Tails</button>';
    else if (game.type === "guess") {
      for (var n = 1; n <= 10; n += 1) html += '<button type="button" class="cm-btn cm-numbtn" data-action="game-guess" data-n="' + n + '">' + n + "</button>";
    } else if (game.type === "rps") {
      html += '<button type="button" class="cm-btn primary" data-action="game-rps" data-choice="rock">✊ Rock</button><button type="button" class="cm-btn primary" data-action="game-rps" data-choice="paper">✋ Paper</button><button type="button" class="cm-btn primary" data-action="game-rps" data-choice="scissors">✌️ Scissors</button>';
    } else if (game.type === "wheel") html += '<button type="button" class="cm-btn primary" data-action="game-wheel">Spin the wheel</button>';
    else if (game.type === "higher") {
      html += '<button type="button" class="cm-btn primary" data-action="game-higher" data-dir="higher">Higher</button><button type="button" class="cm-btn primary" data-action="game-higher" data-dir="lower">Lower</button>';
    }
    html += "</div>";
  }
  html += "</div>";
  return html;
}
function gamePageHTML() {
  var game = gameById(ui.gameId);
  if (!game) return '<div class="cm-card"><p class="cm-muted">This game was removed.</p><button type="button" class="cm-btn" data-action="close-game">Back to games</button></div>';
  expireGames();
  var left = "";
  if (game.status === "open" && game.expiresAt) {
    var ms = Number(game.expiresAt) - Date.now();
    if (ms > 0) {
      var hours = Math.floor(ms / 3600000);
      var mins = Math.floor((ms % 3600000) / 60000);
      left = (hours > 0 ? hours + "h " : "") + mins + "m left";
    }
  }
  var statusLabel = game.status === "open" ? "Open" : (game.status === "finished" ? "Ended" : "Returned to admin");
  function dailyBonusHTML() {
    var wait = bonusCooldownLeft();
    return '<div class="cm-gamebonus"><div><span>Daily bonus</span><b>+' + DAILY_BONUS_POINTS + " points</b></div>" +
      (wait > 0 ? '<span class="cm-muted">Next in ' + cooldownLabel(wait) + "</span>" : '<button type="button" class="cm-btn primary" data-action="claim-bonus">Claim bonus</button>') +
      "</div>";
  }
  return '<div class="cm-gamepage">' +
    '<div class="cm-gamehead"><button type="button" class="cm-btn cm-gameback" data-action="close-game" aria-label="Back to games">←</button>' +
      '<div class="cm-gameheading"><h2>' + escapeHTML(game.name) + '</h2><span>' + escapeHTML(gameTypeLabel(game.type)) + '</span></div>' +
      '<span class="cm-gamebadge ' + escapeHTML(game.status) + '">' + escapeHTML(statusLabel) + "</span></div>" +
    '<div class="cm-gamehost">🎮 Game page hosted by <b>' + escapeHTML(state.user.id) + '</b>' +
      '<button type="button" class="cm-chip" data-action="copy-game-link" data-id="' + escapeHTML(game.id) + '">Copy game page</button></div>' +
    '<div class="cm-gamecard">' + gameStageHTML(game) + "</div>" +
    '<div class="cm-gameinfo"><div><span>Your points</span><b>' + gameScore() + "</b></div>" +
      '<div><span>Plays</span><b>' + (Number(game.plays) || 0) + "</b></div>" +
      (left ? "<div><span>Time left</span><b>" + left + "</b></div>" : "") +
      (isAdmin() ? '<div><span>Stake per win</span><b>' + escapeHTML(game.stake) + " HDO</b></div>" +
        '<div><span>Won so far</span><b>' + escapeHTML(String(Number(game.paid) || 0)) + " HDO</b></div>" : "") +
    "</div>" +
    '<p class="cm-gamerate">' + POINTS_PER_HDO + " points = 1 HDO · " + CASHOUT_POINTS + " points = " + CASHOUT_HDO + " HDO</p>" +
    '<p class="cm-gamenote">Everyone can play this game. Each player can play ' + escapeHTML(gameTypeLabel(game.type)) + " once every 24 hours.</p>" +
    dailyBonusHTML() +
    (isAdmin() ? '<div class="cm-btn-row"><button type="button" class="cm-btn danger" data-action="delete-game" data-id="' + escapeHTML(game.id) + '">Delete game</button></div>' : "") +
    "</div>";
}
function requestCashout() {
  if (!state) return;
  var pts = gameScore();
  if (pts < CASHOUT_POINTS) { toast("You need " + CASHOUT_POINTS + " points to convert. You have " + pts + "."); return; }
  var address = state.wallet && isAddress(state.wallet.address) ? state.wallet.address : "";
  if (!address) { toast("Create a wallet first so the HDO has somewhere to go"); return; }
  var record = cleanCashoutRecord({
    id: uid(), user: state.user.id, points: CASHOUT_POINTS, hdo: CASHOUT_HDO,
    address: address, status: "pending", createdAt: Date.now()
  });
  if (!record) { toast("Could not create the request"); return; }
  if (!state.cashouts) state.cashouts = [];
  if (!state.gameScores) state.gameScores = {};
  state.gameScores[state.user.id] = pts - CASHOUT_POINTS;
  state.cashouts.push(record);
  saveState();
  render();
  toast("Request sent: " + CASHOUT_HDO + " HDO to " + address.slice(0, 8) + "… The admin will approve it.", 6000);
  publishGameEvent("cashout", null, {
    cashoutId: record.id, player: record.user, points: record.points, hdo: record.hdo, address: record.address
  }).then(function (ok) {
    if (!ok) toast("The request is saved on this device but could not reach the admin. Try again when online.", 6000);
  });
}
async function payCashout(id) {
  if (!isAdmin()) { toast("Only the admin can pay HDO"); return; }
  var record = findCashout(id);
  if (!record || record.status !== "pending") return;
  var pair = hdoChatToken();
  if (!pair) { toast("HDO is not available on this device"); return; }
  var amountRaw;
  try { amountRaw = parseUnits(String(record.hdo), pair.token.decimals); } catch (e) { toast("Invalid HDO amount"); return; }
  toast("Sending " + record.hdo + " HDO to " + record.address.slice(0, 8) + "…", 8000);
  try {
    var result = await sendTokenOnChain({
      chainKey: "celo", token: pair.token, to: record.address, amountRaw: amountRaw, amountText: String(record.hdo)
    });
    record.status = "paid";
    record.tx = result.tx;
    record.paidAt = Date.now();
    saveState();
    publishGameEvent("cashout-paid", null, { cashoutId: record.id, tx: result.tx });
    render();
    toast("Paid " + record.hdo + " HDO · " + result.tx.slice(0, 10) + "…", 6000);
  } catch (error) {
    toast("HDO payment failed: " + (error && error.message ? error.message : String(error)), 7000);
  }
}
function rejectCashout(id) {
  if (!isAdmin()) return;
  var record = findCashout(id);
  if (!record || record.status !== "pending") return;
  record.status = "rejected";
  if (record.user === state.user.id) {
    if (!state.gameScores) state.gameScores = {};
    state.gameScores[record.user] = (Number(state.gameScores[record.user]) || 0) + record.points;
  }
  saveState();
  publishGameEvent("cashout-reject", null, { cashoutId: record.id, player: record.user, points: record.points });
  render();
  toast("Request rejected and points returned to the player.");
}
function claimHdo() {
  if (!state) return;
  var pts = gameScore();
  if (pts <= 0) { toast("No points to claim"); return; }
  if (pts >= CASHOUT_POINTS) { requestCashout(); return; }
  toast("You have " + pts + " points. Reach " + CASHOUT_POINTS + " points to convert them to " + CASHOUT_HDO + " HDO.", 5000);
}
function copyGameLink(id) {
  if (!state) return;
  var game = gameById(id);
  var text = "Community Chat game page\nHost: " + state.user.id + "\nGame: " + (game ? game.name : "Game") +
    "\nOpen Community Chat and tap Games, then " + (game ? game.name : "the game") + " to play.";
  copyText(text).then(function (ok) { toast(ok ? "Game page details copied" : "Could not copy the game page"); });
}
function applySearch() {
  var input = document.getElementById("searchInput");
  var raw = String(input && input.value || "");
  ui.search = raw;
  var q = raw.trim().toLowerCase();
  if (ui.mode === "thread") {
    var msgs = document.getElementById("msgs");
    if (!msgs) return;
    var visible = 0;
    msgs.querySelectorAll(".cm-bubble").forEach(function (node) {
      var show = !q || node.textContent.toLowerCase().indexOf(q) !== -1;
      node.style.display = show ? "" : "none";
      if (show) visible += 1;
    });
    var note = document.getElementById("searchEmpty");
    if (q && !visible) {
      if (!note) { note = document.createElement("div"); note.id = "searchEmpty"; note.className = "cm-empty"; msgs.appendChild(note); }
      note.textContent = "No messages match \"" + q + "\".";
      note.style.display = "";
    } else if (note) {
      note.style.display = "none";
    }
  } else {
    var scope = document.querySelector(".cm-content");
    if (!scope) return;
    scope.querySelectorAll(".cm-row, .cm-botrow").forEach(function (node) {
      node.style.display = (!q || node.textContent.toLowerCase().indexOf(q) !== -1) ? "" : "none";
    });
  }
}

/* ---------- render ---------- */
function render() {
  if (!$root) return;
  $root.setAttribute("data-wallpaper", chatWallpaper());
  if (ui.mode === "thread") renderThread();
  else if (ui.mode === "game") renderGamePage();
  else renderTabs();
}
function renderGamePage() {
  $root.innerHTML = '<div class="cm-gamewrap">' + gamePageHTML() + "</div>";
  bindActions();
}
function renderStatus() { /* status is shown in the Me tab */ }
function renderTabs() {
  var tabs = ["chats", "people", "games", "wallet", "me"];
  var labels = { chats: "Chats", people: "People", games: "Games", wallet: "Wallet", me: "Me" };
  var html = '<div class="cm-topbar">' +
    '<img class="cm-logo" src="icon.png" alt="Community Chat">' +
    '<h1>Community Chat</h1>' +
    '<img class="cm-topavatar" src="' + escapeHTML(profileImageURL()) + '" alt="' + escapeHTML(state.user.name) + '" title="' + escapeHTML(state.user.name) + '"></div>';
  html += '<div class="cm-tabs">' + tabs.map(function (t) {
    return '<button class="cm-tab' + (ui.tab === t ? " active" : "") + '" data-tab="' + t + '">' + labels[t] + "</button>";
  }).join("") + "</div>";
  if (ui.tab === "chats" || ui.tab === "people") {
    html += '<div class="cm-searchbar"><span class="cm-search-ico">🔍</span><input id="searchInput" type="search" placeholder="Search chats and people" oninput="applySearch()"></div>';
  }
  html += '<div class="cm-content">';
  if (ui.tab === "chats") html += renderChats();
  else if (ui.tab === "people") html += renderPeople();
  else if (ui.tab === "games") html += renderGames();
  else if (ui.tab === "wallet") html += renderWallet();
  else html += renderMe();
  html += "</div>";
  $root.innerHTML = html;
  $root.querySelectorAll("[data-tab]").forEach(function (b) {
    b.onclick = function () { ui.tab = b.dataset.tab; render(); };
  });
  bindActions();
  if (ui.tab === "wallet") setTimeout(function () { refreshWallet(false); }, 0);
}
function lastPreview(thread) {
  if (!thread || !thread.messages.length) return "No messages yet";
  var m = thread.messages[thread.messages.length - 1];
  if (m.token) return "💸 " + m.token.amount + " " + m.token.symbol;
  if (m.airdrop) return "🎁 " + m.airdrop.amount + " " + m.airdrop.symbol;
  if (m.image && !m.text) return "📷 Photo";
  return String(m.text || "").slice(0, 48);
}
function applyWallpaperImage() {
  var img = state && state.settings ? (state.settings.chatWallpaperImage || "") : "";
  var useImage = chatWallpaper() === "image" && !!img;
  var nodes = [document.getElementById("msgs")].filter(Boolean);
  nodes.forEach(function (node) {
    if (useImage) {
      node.style.backgroundImage = "url(" + JSON.stringify(img) + ")";
      node.style.backgroundSize = "cover";
      node.style.backgroundPosition = "center";
      node.style.backgroundRepeat = "no-repeat";
    } else {
      node.style.backgroundImage = "";
      node.style.backgroundSize = "";
      node.style.backgroundPosition = "";
      node.style.backgroundRepeat = "";
    }
  });
}
function renderChats() {
  var slug = roomSlug();
  var info = roomInfo(slug);
  var thread = state.threads["room:" + slug];
  var html = '<div class="cm-card"><div class="cm-row" data-action="open-room"><span class="cm-avatar">' + info.emoji + '</span><div style="flex:1"><div class="cm-rowname">' + escapeHTML(info.name) + '</div><div class="cm-rowsub">' + escapeHTML(lastPreview(thread)) + "</div></div></div></div>";
  html += '<div class="cm-section-title">Direct chats</div>';
  var dms = Object.keys(state.contacts);
  if (!dms.length) html += '<div class="cm-empty">No direct chats yet. Add a friend in People.</div>';
  dms.forEach(function (id) {
    var c = state.contacts[id];
    var th = state.threads["dm:" + id];
    var unread = th ? (th.unread || 0) : 0;
    var online = c.lastSeen && Date.now() - c.lastSeen < ONLINE_MS;
    html += '<div class="cm-row" data-action="open-dm" data-id="' + escapeHTML(id) + '"><span class="cm-avatar">' + escapeHTML(c.emoji) + '</span><div style="flex:1"><div class="cm-rowname">' + escapeHTML(c.name) + verifiedBadge(id) + (online ? ' <span class="cm-online">online</span>' : "") + '</div><div class="cm-rowsub">' + escapeHTML(lastPreview(th)) + (unread ? " · " + unread + " new" : "") + "</div></div></div>";
  });
  html += '<div class="cm-card" style="margin-top:12px"><h3>Rooms</h3><div class="cm-btn-row">';
  ROOMS.forEach(function (r) {
    html += '<button class="cm-btn' + (slug === r.slug ? " primary" : "") + '" data-action="set-room" data-slug="' + r.slug + '">' + r.emoji + " " + r.name + "</button>";
  });
  html += '</div><div class="cm-inline" style="margin-top:8px"><input class="cm-input" id="roomInput" placeholder="custom room code"><button class="cm-btn" data-action="join-room">Join</button></div></div>';
  return html;
}
function renderPeople() {
  var contacts = Object.keys(state.contacts);
  var html = '<div class="cm-card"><h3>Add contact</h3><div class="cm-inline"><input class="cm-input" id="contactInput" placeholder="CM-XXXX-XXXX"><button class="cm-btn primary" data-action="add-contact">Add</button></div></div>';
  html += '<div class="cm-section-title">People you know</div>';
  if (!contacts.length) html += '<div class="cm-empty">No contacts yet.</div>';
  contacts.forEach(function (id) {
    var c = state.contacts[id];
    var online = c.lastSeen && Date.now() - c.lastSeen < ONLINE_MS;
    html += '<div class="cm-row" data-action="open-dm" data-id="' + escapeHTML(id) + '"><span class="cm-avatar">' + escapeHTML(c.emoji) + '</span><div style="flex:1"><div class="cm-rowname">' + escapeHTML(c.name) + verifiedBadge(id) + (online ? ' <span class="cm-online">online</span>' : "") + '</div><div class="cm-rowsub">' + escapeHTML(id) + "</div></div></div>";
  });
  html += '<div class="cm-card" style="margin-top:12px"><h3>Verified badge</h3>';
  if (isAdmin()) {
    html += '<p class="cm-muted">Admin mode is on. Grant or remove the blue check for a profile ID.</p>';
    html += '<div class="cm-inline"><input class="cm-input" id="verifyTarget" placeholder="CM-XXXX-XXXX"><button class="cm-btn primary" data-action="grant-verified">Grant</button></div>';
    if (state.verifiedIds && state.verifiedIds.length) {
      html += '<div class="cm-btn-row">' + state.verifiedIds.map(function (id) {
        return '<button class="cm-btn danger" data-action="revoke-verified" data-id="' + escapeHTML(id) + '">Remove ' + escapeHTML(id) + "</button>";
      }).join("") + "</div>";
    } else {
      html += '<p class="cm-muted">No profiles verified yet.</p>';
    }
  } else {
    html += '<p class="cm-muted">' + (state.user.id === DEV_ID ? "Your developer profile is verified." : "Message " + DEV_ID + " to request a badge. Include your ID " + state.user.id + ".") + "</p>";
    if (state.user.id !== DEV_ID) html += '<div class="cm-btn-row"><button class="cm-btn primary" data-action="message-dev">Message developer</button></div>';
  }
  html += "</div>";
  return html;
}
function dailyBonusHTML() {
  var wait = bonusCooldownLeft();
  return '<div class="cm-gamebonus"><div><span>Daily bonus</span><b>+' + DAILY_BONUS_POINTS + ' points</b></div>' +
    (wait > 0 ? '<span class="cm-muted">Next in ' + cooldownLabel(wait) + "</span>" : '<button type="button" class="cm-btn primary" data-action="claim-bonus">Claim bonus</button>') +
    "</div>";
}
function renderGames() {
  if (!state.games) state.games = [];
  if (!state.gameScores) state.gameScores = {};
  if (!state.cashouts) state.cashouts = [];
  expireGames();
  var pts = gameScore();
  var html = '<div class="cm-card"><h3>Game Room</h3><p class="cm-muted">The admin creates a game for everyone in the room. Tap a game to open its page and play. Games stay open for 24 hours, and each player can play each game type once every 24 hours.</p></div>';
  if (isAdmin() && state.games.length < 10) {
    html += '<div class="cm-card"><h3>Create game</h3>' +
      '<div class="cm-inline"><input class="cm-input" id="gameName" placeholder="Game name" maxlength="40"><select class="cm-input" id="gameType">' +
        GAME_TYPES.map(function (type) { return '<option value="' + type + '">' + escapeHTML(GAME_TYPE_LABELS[type]) + "</option>"; }).join("") +
      "</select></div>" +
      '<div class="cm-inline"><input class="cm-input" id="gameStake" placeholder="Stake per win (HDO, admin only)" value="1"><button class="cm-btn primary" data-action="create-game">Create</button></div>' +
      '<p class="cm-muted">Games: ' + state.games.length + '/10 · each game runs for 24 hours. Each winner earns stake × 10 points. Only you see the stake and the HDO won.</p></div>';
  } else if (!isAdmin()) {
    html += '<div class="cm-card"><p class="cm-muted">Only the admin creates games and sets the HDO stake. Every player can play each open game once every 24 hours.</p></div>';
  } else {
    html += '<div class="cm-card"><p class="cm-muted">Game limit reached (10). Delete one to create another.</p></div>';
  }
  html += '<div class="cm-card"><h3>Games</h3>';
  if (!state.games.length) html += '<p class="cm-muted">No games yet. The admin can create one above.</p>';
  state.games.forEach(function (g) {
    var status = g.status || "open";
    var statusLabel = status === "open" ? "Open" : (status === "finished" ? "Ended" : "Returned to admin");
    var left = "";
    var wait = gameCooldownLeft(g.type);
    if (status === "open" && g.expiresAt) {
      var ms = Number(g.expiresAt) - Date.now();
      if (ms > 0) {
        var hours = Math.floor(ms / 3600000);
        var mins = Math.floor((ms % 3600000) / 60000);
        left = " · " + (hours > 0 ? hours + "h " : "") + mins + "m left";
      }
    }
    html += '<div class="cm-gamecard-row">' +
      '<div class="cm-gamecard-top"><span class="cm-gametype-icon">' + gameTypeIcon(g.type) + "</span>" +
        '<div class="cm-gamecard-name">' + escapeHTML(g.name) + '<span class="cm-muted">' + escapeHTML(gameTypeLabel(g.type)) + left + "</span></div>" +
        '<span class="cm-game-status ' + escapeHTML(status) + '">' + escapeHTML(statusLabel) + "</span></div>" +
      '<div class="cm-gamecard-meta"><span>' + (Number(g.plays) || 0) + " plays</span>" +
        (wait > 0 ? "<span>✅ Played · next in " + cooldownLabel(wait) + "</span>" : "<span>Ready to play</span>") +
        (isAdmin()
          ? "<span>Stake/win: " + escapeHTML(g.stake) + " HDO</span><span>Won so far: " + escapeHTML(String(Number(g.paid) || 0)) + " HDO</span>"
          : "<span>" + POINTS_PER_HDO + " pts = 1 HDO</span>") +
      "</div>" +
      '<div class="cm-btn-row"><button class="cm-btn primary" data-action="play-game" data-id="' + escapeHTML(g.id) + '"' + (status === "open" ? "" : " disabled") + '>Open game</button>' +
      (isAdmin() ? '<button class="cm-btn danger" data-action="delete-game" data-id="' + escapeHTML(g.id) + '">Delete</button>' : "") + "</div>" +
      "</div>";
  });
  html += "</div>";

  html += '<div class="cm-card"><h3>Your points</h3>' +
    '<div class="cm-pointsline"><b>' + pts + '</b> points<span>' + POINTS_PER_HDO + " points = 1 HDO</span></div>" +
    '<p class="cm-muted">' + CASHOUT_POINTS + " points converts to " + CASHOUT_HDO + " HDO. You need " + CASHOUT_POINTS + " points per request.</p>" +
    '<div class="cm-btn-row"><button class="cm-btn primary" data-action="claim-hdo"' + (pts >= CASHOUT_POINTS ? "" : " disabled") + ">Convert " + CASHOUT_POINTS + " points to " + CASHOUT_HDO + " HDO</button></div>" +
    '<p class="cm-muted">The request is sent to the admin, who pays the HDO to your wallet from the game stake.</p></div>';

  html += '<div class="cm-card"><h3>Daily bonus</h3>' +
    '<p class="cm-muted">Claim ' + DAILY_BONUS_POINTS + ' extra points once every 24 hours.</p>' +
    '<div class="cm-gamebonus"><div><span>Daily bonus</span><b>+' + DAILY_BONUS_POINTS + ' points</b></div>' +
    (bonusCooldownLeft() > 0
      ? '<span class="cm-muted">Next in ' + cooldownLabel(bonusCooldownLeft()) + "</span>"
      : '<button type="button" class="cm-btn primary" data-action="claim-bonus">Claim bonus</button>') +
    "</div></div>";


  var mine = (state.cashouts || []).filter(function (c) { return c.user === state.user.id; }).slice(-5).reverse();
  if (mine.length) {
    html += '<div class="cm-card"><h3>Your HDO requests</h3>';
    mine.forEach(function (c) {
      html += '<div class="cm-cashoutrow"><div><b>' + c.hdo + ' HDO</b><span class="cm-muted">' + c.points + ' points · ' + escapeHTML(c.status) + "</span></div>" +
        (c.tx ? '<button class="cm-token-link" data-action="open-tx" data-url="' + escapeHTML("https://celoscan.io/tx/" + c.tx) + '">Transaction ↗</button>' : "") + "</div>";
    });
    html += "</div>";
  }

  if (isAdmin()) {
    var pending = (state.cashouts || []).filter(function (c) { return c.status === "pending"; });
    html += '<div class="cm-card"><h3>HDO payouts (admin)</h3><p class="cm-muted">Only you see this. Approving sends real HDO on Celo from this wallet to the player.</p>';
    if (!pending.length) html += '<p class="cm-muted">No pending requests.</p>';
    pending.forEach(function (c) {
      html += '<div class="cm-cashoutrow"><div><b>' + escapeHTML(c.user) + "</b>" +
        '<span class="cm-muted">' + c.hdo + " HDO · " + c.points + " points · " + escapeHTML(c.address.slice(0, 10)) + "…</span></div>" +
        '<div class="cm-btn-row"><button class="cm-btn primary" data-action="pay-cashout" data-id="' + escapeHTML(c.id) + '">Pay HDO</button>' +
        '<button class="cm-btn" data-action="reject-cashout" data-id="' + escapeHTML(c.id) + '">Reject</button></div></div>';
    });
    html += "</div>";
  }

  var scores = Object.keys(state.gameScores).map(function (k) { return { id: k, pts: state.gameScores[k] }; }).sort(function (a, b) { return b.pts - a.pts; });
  html += '<div class="cm-card"><h3>Leaderboard</h3>';
  if (!scores.length) html += '<p class="cm-muted">No scores yet.</p>';
  scores.slice(0, 10).forEach(function (s, i) {
    html += '<div class="cm-row"><span class="cm-avatar cm-avatar-sm">' + (i + 1) + '</span><div style="flex:1"><div class="cm-rowname">' + escapeHTML(s.id) + '</div><div class="cm-rowsub">' + s.pts + ' pts</div></div></div>';
  });
  html += "</div>";
  return html;
}
function renderMe() {
  var html = '<div class="cm-card"><h3>Profile</h3><div class="cm-inline"><input class="cm-input" id="nameInput" value="' + escapeHTML(state.user.name) + '"><button class="cm-btn primary" data-action="save-name">Save</button></div><p class="cm-muted">ID: <span class="cm-idbox">' + escapeHTML(state.user.id) + '</span></p><div class="cm-btn-row"><button class="cm-btn" data-action="copy-id">Copy ID</button></div></div>';
  html += '<div class="cm-card"><h3>Relay</h3><div class="cm-inline"><input class="cm-input" id="relayInput" value="' + escapeHTML(state.settings.relay) + '"><button class="cm-btn primary" data-action="save-relay">Save</button></div><p class="cm-muted">Default: community-relay.hdo-box.workers.dev. Everyone must use the same relay.</p></div>';
  html += '<div class="cm-card"><h3>Followers & following</h3><p class="cm-muted">Followers: ' + (state.followers ? state.followers.length : 0) + " · Following: " + (state.following ? state.following.length : 0) + "</p></div>";
  html += '<div class="cm-card"><h3>Community bots</h3><p class="cm-muted">Open BotFather to create bots, set commands and get a token. Tap a bot to DM it.</p><div class="cm-btn-row"><button class="cm-btn primary" data-action="open-botfather">Open BotFather</button></div>';
  if (state.bots && state.bots.length) {
    html += '<div class="cm-botlist">' + state.bots.map(function (bot) {
      return '<button class="cm-botrow" data-action="open-bot" data-id="' + escapeHTML(bot.id) + '"><span class="cm-avatar" style="width:34px;height:34px;font-size:17px">🤖</span><span class="cm-botrow-main"><b>@' + escapeHTML(bot.username) + '</b><small>' + escapeHTML(bot.name) + " · " + escapeHTML(bot.id) + '</small></span><span class="cm-botrow-go">›</span></button>';
    }).join("") + "</div>";
  }


  html += '<div class="cm-card"><h3>Admin</h3>' + (isAdmin()
    ? '<p class="cm-muted">Admin mode is ON' + (state.user.id === DEV_ID ? "" : " (unlocked)") + '. Grant verified badges in People.</p><div class="cm-btn-row"><button class="cm-btn danger" data-action="lock-dev">Turn off admin mode</button></div>'
    : '<p class="cm-muted">Enter the admin code to unlock verified-badge tools.</p><div class="cm-inline"><input class="cm-input" id="devCode" type="password" placeholder="Admin code"><button class="cm-btn primary" data-action="unlock-dev">Unlock</button></div>') + "</div>";
  html += '<div class="cm-card"><h3>Message translation</h3><p class="cm-muted">Choose the language for the 🌐 Translate button in rooms and direct chats.</p><div class="cm-inline"><select class="cm-input" id="translateLang">' + TRANSLATE_LANGS.map(function (lang) {
    return '<option value="' + lang.code + '"' + (translateTarget() === lang.code ? " selected" : "") + '>' + escapeHTML(lang.name) + '</option>';
  }).join("") + '</select><button class="cm-btn primary" data-action="save-translate-lang">Save</button></div></div>';
  html += '<div class="cm-card"><h3>Chat wallpaper</h3><p class="cm-muted">Pick a background for your chats. It stays on this phone.</p><div class="cm-wallpapers">' + WALLPAPERS.map(function (name) {
    var labels = { pattern: "Pattern", sky: "Sky", mint: "Mint", sunset: "Sunset", night: "Night", paris: "Paris", lion: "Lion", community: "Community", unicorn: "Unicorn", plug: "Plug" };
    var active = chatWallpaper() === name;
    return '<button type="button" class="cm-wallpaper' + (active ? " active" : "") + '" data-action="set-wallpaper" data-value="' + name + '" aria-pressed="' + (active ? "true" : "false") + '"><span class="cm-wallpaper-swatch" data-swatch="' + name + '"></span><span class="cm-wallpaper-name">' + labels[name] + '</span></button>';
  }).join("") + '</div></div>';
  html += '<div class="cm-card"><h3>Chat background image</h3><p class="cm-muted">Use your own photo as the chat background. It stays on this phone.</p>' +
    (state.settings && state.settings.chatWallpaperImage
      ? '<div class="cm-wallpaper-preview"><img src="' + escapeHTML(state.settings.chatWallpaperImage) + '" alt="Chat background preview"></div>' +
        '<div class="cm-btn-row"><button type="button" class="cm-btn" data-action="set-wallpaper" data-value="image">Use image</button><button type="button" class="cm-btn danger" data-action="clear-wallpaper-image">Remove image</button></div>'
      : '<div class="cm-btn-row"><button type="button" class="cm-btn primary" data-action="set-wallpaper-image">Choose image</button></div>') +
    '</div>';
  html += '<div class="cm-card"><h3>About</h3><p class="cm-muted">Community Chat v' + VERSION + " · " + escapeHTML(ui.status || "") + " · Last sync: " + escapeHTML(ui.lastSync ? new Date(ui.lastSync).toLocaleTimeString() : "not yet") + '</p><p class="cm-muted">Made for Acode. Send feedback or ask for a verified badge by messaging ' + escapeHTML(DEV_ID) + " from the People tab.</p></div>";
  return html;
}
function renderWallet() {
  if (!walletSupported()) {
    return '<div class="cm-card"><h3>Wallet</h3><p class="cm-muted">This WebView does not support the features a wallet needs. Update Android System WebView and reopen the app.</p></div>';
  }
  if (!state.wallet) {
    return '<div class="cm-card"><h3>Wallet</h3><p>No wallet on this phone yet.</p><div class="cm-btn-row"><button class="cm-btn primary" data-action="wallet-create">Create wallet</button><button class="cm-btn" data-action="wallet-import">Import wallet</button></div></div>';
  }
  return '<div class="cm-card cm-wallet">' +
    "<h3>Wallet</h3>" +
    '<div class="cm-wprofile">' +
      '<img class="cm-wavatar" src="' + escapeHTML(profileImageURL()) + '" alt="Profile picture">' +
      '<div class="cm-wprofile-actions">' +
        '<button class="cm-btn" data-action="set-profile-picture">Set picture</button>' +
        '<button class="cm-btn" data-action="set-profile-nft">Set NFT</button>' +
        '<button class="cm-btn" data-action="reset-profile-picture">Use default</button>' +
      "</div>" +
    "</div>" +
    '<p>Your wallet address on <b>Celo</b> and <b>BSC</b>. It was created on this phone and only you hold the key.</p>' +
    '<div class="cm-idbox cm-addrbox"><code>' + escapeHTML(state.wallet.address) + "</code>" +
      '<button class="cm-chip" data-action="wallet-copy">Copy</button></div>' +
    '<div class="cm-wbal" data-role="wallet-balances">' + walletBalancesHTML() + "</div>" +
    '<div class="cm-btn-row">' +
      '<button class="cm-btn primary" data-action="wallet-send">Send tokens</button>' +
      '<button class="cm-btn" data-action="wallet-refresh">Refresh</button>' +
    "</div>" +
    '<div class="cm-btn-row">' +
      '<button class="cm-btn" data-action="wallet-reveal">Back up key</button>' +
      '<button class="cm-btn" data-action="wallet-import">Import wallet</button>' +
    "</div>" +
    "<details><summary>Token settings</summary>" +
      '<label class="cm-label" for="hdoInput">HDO token contract (Celo)</label>' +
      '<div class="cm-inline"><input class="cm-input" id="hdoInput" type="text" spellcheck="false" placeholder="0x…" value="' + escapeHTML(state.settings.hdoToken || HDO_TOKEN_DEFAULT) + '"><button class="cm-btn primary" data-action="wallet-save-hdo">Save</button></div>' +
      '<p class="cm-muted">HDO is read from this contract on Celo. G$, USDT, USDC and bridged BTC use their official Celo contracts.</p>' +
    "</details>" +
    '<p class="cm-muted">Never share your private key. If you lose this phone without a backup, the funds are gone. A token transfer is public on its blockchain even when the chat note is encrypted.</p>' +
  "</div>";
}
function renderThread() {
  var oldInput = document.getElementById("composer");
  var draft = oldInput ? oldInput.value : "";
  var oldMsgs = document.getElementById("msgs");
  var wasBottom = !oldMsgs || (oldMsgs.scrollHeight - oldMsgs.scrollTop - oldMsgs.clientHeight < 120);
  var oldScroll = oldMsgs ? oldMsgs.scrollTop : 0;
  var peer = ui.peer;
  var isCommunity = peer === "community";
  var slug = roomSlug();
  var name = isCommunity ? roomInfo(slug).name : (state.contacts[peer] ? state.contacts[peer].name : peer);
  var threadKey = isCommunity ? ("room:" + slug) : ("dm:" + peer);
  var thread = state.threads[threadKey];
  var msgs = thread ? thread.messages : [];
  var contact = !isCommunity ? state.contacts[peer] : null;
  var online = contact && contact.lastSeen && Date.now() - contact.lastSeen < ONLINE_MS;
  var headInfo = '<div style="flex:1"' + (isCommunity ? "" : ' class="cm-clickable" data-action="view-profile" data-id="' + escapeHTML(peer) + '"') + '><div class="cm-rowname">' + escapeHTML(name) + (isCommunity ? "" : verifiedBadge(peer)) + (online ? ' <span class="cm-online">online</span>' : "") + '</div><div class="cm-rowsub">' + (isCommunity ? escapeHTML(roomInfo(slug).desc) : escapeHTML(peer)) + "</div></div>";
  var html = '<div class="cm-thread"><div class="cm-thread-head"><button class="cm-btn" data-action="back">←</button>' + headInfo + '<button class="cm-btn" data-action="toggle-search" aria-label="Search this chat" title="Search this chat">🔍</button></div>';
  html += '<div class="cm-searchbar cm-searchbar-thread"' + (ui.searchOpen ? "" : " hidden") + '><span class="cm-search-ico">🔍</span><input id="searchInput" type="search" placeholder="Search this chat" oninput="applySearch()" value="' + escapeHTML(ui.search || "") + '"></div>';
  html += '<div class="cm-thread-msgs" id="msgs">';
  if (!msgs.length) {
    html += '<div class="cm-empty">' + (isCommunity && slug === "ai" ? "Ask Lucky AI anything. Replies are private to this app." : "No messages yet. Say hello!") + "</div>";
  }
  msgs.forEach(function (m) {
    var mine = m.from === state.user.id;
    var isAi = m.from === AI_ID;
    var bubble = '<div class="cm-bubble' + (mine ? " mine" : "") + (isAi ? " ai" : "") + '">';
    if (!mine && !isAi) bubble += '<div class="cm-bubble-name cm-clickable" data-action="view-profile" data-id="' + escapeHTML(m.from) + '">' + escapeHTML(m.name || "Friend") + verifiedBadge(m.from) + "</div>";
    if (m.image) bubble += '<img src="' + escapeHTML(m.image) + '" alt="Photo">';
    if (m.token) bubble += tokenCardHTML(m.token);
    else if (m.airdrop) bubble += airdropCardHTML(m);
    else if (m.text) bubble += escapeHTML(m.text);
    if (m.tr && m.showTr) bubble += '<div class="cm-translated"><span class="cm-translated-label">🌐 ' + escapeHTML(translateLangName(m.trLang)) + '</span>' + escapeHTML(m.tr) + '</div>';
    if (m.status === "failed") bubble += '<div class="cm-msg-error">Not sent' + (m.error ? ": " + escapeHTML(m.error) : "") + ' <button class="cm-linkbtn" data-action="retry" data-id="' + escapeHTML(m.id) + '">Retry</button></div>';
    else if (m.status === "sending") bubble += '<div class="cm-msg-meta">Sending…</div>';
    else if (m.unencrypted) bubble += '<div class="cm-msg-meta">🔓 unencrypted</div>';
    var canTranslate = !!(m.text && !m.token && !m.airdrop);
    bubble += '<div class="cm-bubble-actions">' +
      (canTranslate ? '<button type="button" class="cm-translatebtn" data-action="translate-message" data-id="' + escapeHTML(m.id) + '">' + (m.translating ? "Translating…" : (m.tr && m.showTr ? "Hide translation" : "Translate")) + '</button>' : '') +
      '<button type="button" class="cm-copybtn" data-action="copy-message" data-id="' + escapeHTML(m.id) + '">Copy</button></div>';
    bubble += "</div>";
    html += bubble;
  });
  html += "</div>";
  if (isCommunity && slug === "ai") {
    html += '<div class="cm-composer"><input id="composer" placeholder="Ask Lucky AI…"><button class="cm-btn primary" data-action="send">Send</button></div>';
  } else {
    html += '<div class="cm-composer"><button class="cm-btn" data-action="pick-image" aria-label="Send photo">📷</button><button class="cm-btn" data-action="send-token" aria-label="Send tokens">💸</button><input id="composer" placeholder="Message…"><button class="cm-btn primary" data-action="send">Send</button></div>';
  }
  html += "</div>";
  $root.innerHTML = html;
  var msgsEl = document.getElementById("msgs");
  if (msgsEl) msgsEl.scrollTop = wasBottom ? msgsEl.scrollHeight : oldScroll;
  var restored = document.getElementById("composer");
  if (restored && draft) restored.value = draft;
  bindActions();
  if (ui.searchOpen && ui.search) applySearch();
  applyWallpaperImage();
  var comp = document.getElementById("composer");
  if (comp) comp.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); doSend(); } });
}
function tokenCardHTML(token) {
  var chain = walletChainByKey(token.chain);
  var url = chain && chain.explorer ? chain.explorer + token.tx : "";
  return '<div class="cm-token-card"><div class="cm-token-title">💸 Sent ' + escapeHTML(token.amount) + " " + escapeHTML(token.symbol) + "</div>" +
    '<div class="cm-token-sub">on ' + escapeHTML(chain ? chain.name : token.chain) + "</div>" +
    (url ? '<button class="cm-linkbtn" data-action="open-tx" data-url="' + escapeHTML(url) + '">View transaction</button>' : "") + "</div>";
}
function airdropCardHTML(message) {
  var airdrop = message.airdrop;
  var chain = walletChainByKey(airdrop.chain);
  var claimed = airdrop.claimed || airdrop.claimedTx;
  var html = '<div class="cm-airdrop-card"><div class="cm-airdrop-top"><span class="cm-airdrop-gift">🎁</span><div><div class="cm-token-title">Airdrop ' + escapeHTML(airdrop.amount) + " " + escapeHTML(airdrop.symbol) + "</div>" +
    '<div class="cm-token-sub">' + escapeHTML(chain ? chain.name : airdrop.chain) + "</div></div></div>";
  if (claimed) {
    html += '<div class="cm-airdrop-note">This airdrop has been claimed.</div>';
    var url = chain && airdrop.claimedTx ? chain.explorer + airdrop.claimedTx : "";
    if (url) html += '<button class="cm-linkbtn" data-action="open-tx" data-url="' + escapeHTML(url) + '">View transaction</button>';
  } else {
    html += '<button class="cm-btn primary cm-airdrop-btn" data-action="claim-airdrop" data-id="' + escapeHTML(message.id) + '">Claim</button>';
  }
  html += "</div>";
  return html;
}

/* ---------- bind ---------- */
function bindActions() {
  $root.querySelectorAll("[data-action]").forEach(function (node) {
    node.onclick = function () {
      var action = node.dataset.action;
      if (action === "open-room") openThread("community");
      else if (action === "open-dm") openThread(node.dataset.id);
      else if (action === "set-room") setRoom(node.dataset.slug);
      else if (action === "join-room") { var v = document.getElementById("roomInput"); if (v && v.value) setRoom(v.value); }
      else if (action === "add-contact") { var c = document.getElementById("contactInput"); addContact(c && c.value); }
      else if (action === "message-dev") { addContact(DEV_ID); openThread(DEV_ID); }
      else if (action === "save-name") saveName();
      else if (action === "copy-id") copyUserId();
      else if (action === "save-relay") {
        var relayInput = document.getElementById("relayInput");
        var relay = cleanRelay(relayInput && relayInput.value);
        if (!relay) { toast("Invalid relay URL"); return; }
        state.settings.relay = relay;
        state.cursors = {};
        state.dmCursor = null;
        saveState();
        render();
        pollNow();
        toast("Relay updated");
      }
      else if (action === "create-game") createGame();
      else if (action === "play-game") openGame(node.dataset.id);
      else if (action === "close-game") closeGame();
      else if (action === "game-roll") gameRoll();
      else if (action === "game-coin") gameCoin(node.dataset.choice);
      else if (action === "game-guess") gameGuess(node.dataset.n);
      else if (action === "game-quiz") gameQuiz(node.dataset.i);
      else if (action === "game-rps") gameRps(node.dataset.choice);
      else if (action === "game-wheel") gameWheel();
      else if (action === "game-higher") gameHigher(node.dataset.dir);
      else if (action === "copy-game-link") copyGameLink(node.dataset.id);
      else if (action === "pay-cashout") payCashout(node.dataset.id);
      else if (action === "reject-cashout") rejectCashout(node.dataset.id);
      else if (action === "delete-game") deleteGame(node.dataset.id);
      else if (action === "claim-hdo") claimHdo();
      else if (action === "claim-bonus") claimDailyBonus();
      else if (action === "back") closeThread();
      else if (action === "send") doSend();
      else if (action === "retry") retryMessage(node.dataset.id);
      else if (action === "pick-image") document.getElementById("fileInput").click();
      else if (action === "send-token") openSendTokenModal(true);
      else if (action === "claim-airdrop") claimAirdropById(node.dataset.id);
      else if (action === "open-tx") openExternal(node.dataset.url);
      else if (action === "copy-message") copyMessage(node.dataset.id);
      else if (action === "translate-message") translateMessage(node.dataset.id);
      else if (action === "save-translate-lang") saveTranslateLang();
      else if (action === "view-profile") openProfileModal(node.dataset.id);
      else if (action === "open-botfather") openBotFather();
      else if (action === "open-bot") openThread(node.dataset.id);
      else if (action === "toggle-search") toggleThreadSearch();
      else if (action === "set-wallpaper") setWallpaper(node.dataset.value);
      else if (action === "set-wallpaper-image") setWallpaperImageFromFile();
      else if (action === "clear-wallpaper-image") clearWallpaperImage();
      else if (action === "unlock-dev") unlockDev();
      else if (action === "lock-dev") lockDev();
      else if (action === "grant-verified") grantVerified();
      else if (action === "revoke-verified") revokeVerified(node.dataset.id);
      else if (action === "wallet-create") walletCreate();
      else if (action === "wallet-import") walletImport();
      else if (action === "wallet-copy") walletCopy();
      else if (action === "wallet-reveal") walletReveal();
      else if (action === "wallet-refresh") refreshWallet(true);
      else if (action === "wallet-send") openSendTokenModal(false);
      else if (action === "wallet-save-hdo") saveHdoToken();
      else if (action === "set-profile-picture") setProfilePictureFromFile();
      else if (action === "set-profile-nft") setProfilePictureFromNft();
      else if (action === "reset-profile-picture") resetProfilePicture();
    };
  });
}
function doSend() {
  var comp = document.getElementById("composer");
  if (!comp) return;
  var text = comp.value.trim();
  if (!text) return;
  comp.value = "";
  sendMessage(text, "", {});
}
document.getElementById("fileInput").addEventListener("change", function (e) {
  var f = e.target.files && e.target.files[0];
  e.target.value = "";
  if (!f) return;
  readFileAsDataURL(f).then(compressImage).then(function (dataUrl) {
    if (ui.mode === "thread") sendMessage("", dataUrl, {});
  }).catch(function (error) {
    toast(error && error.message ? error.message : "Could not add that image");
  });
});

/* ---------- boot ---------- */
async function boot() {
  state = loadState();
  (state.bots || []).forEach(function (bot) { ensureBotContact(bot); });
  await ensureIdentityKeys();
  publishPublicKey(true).catch(function () {});
  $root = document.getElementById("app");
  ui.status = "connecting";
  render();
  pollNow();
  setInterval(function () { publishPresence(false); }, 60000);
  setTimeout(function () { publishPresence(true); }, 1000);
}
boot();
