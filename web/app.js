/* Community Chat — web app */
const VERSION = "1.0.0";
const STORE_KEY = "community.chat.web.v1";
const APP_TAG = "acode-community";
const ENVELOPE_VERSION = 1;
const DEFAULT_ROOM = "general";
const DEFAULT_RELAY = "https://community-relay.hdo-box.workers.dev";
const LEGACY_RELAYS = ["https://ntfy.sh", "https://ntfy.envs.net"];
const TOPIC_PREFIX = "acode-community-v1-";
const VERIFIED_TOPIC = TOPIC_PREFIX + "verified";
const AI_ENDPOINT = "https://luckyai-blush.vercel.app/api/chat?message=";
const AI_ID = "CM-AI00-0000";
const AI_NAME = "Lucky AI";
const DEV_ID = "CM-6S29-CA2X";
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
const MAX_MESSAGES = 250;
const ROOMS = [
  { slug: "general", name: "General", emoji: "💬", desc: "Say hello to everyone" },
  { slug: "ai", name: "AI Room", emoji: "🤖", desc: "Chat with Lucky AI" },
  { slug: "games", name: "Game Room", emoji: "🎮", desc: "Games, tips and fun" },
  { slug: "dev", name: "Dev Room", emoji: "💻", desc: "Code and projects" },
  { slug: "help", name: "Help Room", emoji: "🛟", desc: "Ask for help" }
];

let state = null;
let ui = { tab: "chats", mode: "tabs", peer: null, loading: false };
let running = true;
let pollTimer = null;
let pollInFlight = false;
let presenceInFlight = false;
let lastPresenceAt = 0;
let $root = null;

/* ---------- utils ---------- */
function uid() { return "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); }
function normalizeId(v) { var s = String(v == null ? "" : v).trim().toUpperCase().replace(/\s+/g, ""); if (/^CM-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(s)) return s; return ""; }
function cleanName(v) { return String(v == null ? "" : v).trim().slice(0, 40); }
function safeEmoji(v) { var s = String(v == null ? "" : v).trim(); return s ? s.slice(0, 4) : "🙂"; }
function slugFor(v) { var s = String(v == null ? "" : v).trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40); return s || "general"; }
function roomSlug() { return slugFor(state ? state.settings.room : DEFAULT_ROOM); }
function roomInfo(v) { var s = slugFor(v); for (var i = 0; i < ROOMS.length; i++) if (ROOMS[i].slug === s) return ROOMS[i]; return { slug: s, name: s, emoji: "💬", desc: "Custom room" }; }
function isPresetRoom(v) { var s = slugFor(v); return ROOMS.some(function (r) { return r.slug === s; }); }
function topicFor(slug) { return TOPIC_PREFIX + slug; }
function dmTopicFor(id) { return TOPIC_PREFIX + "dm-" + String(id || "").toLowerCase(); }
function cleanRelay(v) { var s = String(v == null ? "" : v).trim(); if (!s) return ""; try { var u = new URL(s); if (u.protocol !== "https:" && u.protocol !== "http:") return ""; return (u.origin + u.pathname).replace(/\/+$/, ""); } catch (e) { return ""; } }
function relayBase() { return cleanRelay(state && state.settings.relay) || DEFAULT_RELAY; }
function sinceValue(c) { if (c && c.id) return c.id; if (c && c.ts) return String(c.ts); return "all"; }
function escapeHTML(v) { return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function colorFor(id) { var h = 0; var s = String(id || ""); for (var i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0; return "hsl(" + (Math.abs(h) % 360) + ",60%,55%)"; }
function isVerifiedId(id) { var n = normalizeId(id); return !!n && (VERIFIED_IDS.indexOf(n) !== -1 || (state && Array.isArray(state.verifiedIds) && state.verifiedIds.indexOf(n) !== -1)); }
function verifiedBadge(id) { return isVerifiedId(id) ? '<span class="cm-verified" title="Verified">✓</span>' : ""; }
function toast(msg, dur) { var t = document.createElement("div"); t.className = "cm-toast"; t.textContent = msg; document.body.appendChild(t); setTimeout(function () { t.remove(); }, dur || 3000); }
function readFileAsDataURL(file) { return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(r.result); }; r.onerror = rej; r.readAsDataURL(file); }); }
function compressImage(dataUrl) { return new Promise(function (res) { var img = new Image(); img.onload = function () { var max = 1280; var w = img.width, h = img.height; if (w > max || h > max) { if (w > h) { h = Math.round(h * max / w); w = max; } else { w = Math.round(w * max / h); h = max; } } var c = document.createElement("canvas"); c.width = w; c.height = h; c.getContext("2d").drawImage(img, 0, 0, w, h); var out = c.toDataURL("image/jpeg", 0.82); if (out.length > MAX_IMAGE_CHARS) out = c.toDataURL("image/jpeg", 0.6); res(out); }; img.onerror = function () { res(dataUrl); }; img.src = dataUrl; }); }

/* ---------- crypto ---------- */
function cryptoAvailable() { return !!(window.crypto && window.crypto.subtle); }
function bytesToBase64(b) { var s = ""; for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return btoa(s); }
function base64ToBytes(s) { var bin = atob(s); var out = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; }
function utf8Bytes(s) { return new TextEncoder().encode(s); }
function utf8Text(b) { return new TextDecoder().decode(b); }
function randomBytes(n) { var b = new Uint8Array(n); crypto.getRandomValues(b); return b; }
async function deriveRoomKey(room) {
  var salt = utf8Bytes("acode-community-room-v1:" + room);
  var keyMaterial = await crypto.subtle.importKey("raw", utf8Bytes(room), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt: salt, iterations: ROOM_KDF_ITERATIONS, hash: "SHA-256" }, keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
async function generateIdentityKey() {
  var kp = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveKey", "deriveBits"]);
  var pub = await crypto.subtle.exportKey("spki", kp.publicKey);
  var priv = await crypto.subtle.exportKey("pkcs8", kp.privateKey);
  return { publicKey: bytesToBase64(new Uint8Array(pub)), privateJwk: JSON.stringify(Array.from(new Uint8Array(priv))) };
}
async function importPrivateKey(jwkArr) {
  var buf = new Uint8Array(jwkArr);
  return crypto.subtle.importKey("pkcs8", buf, { name: "ECDH", namedCurve: "P-256" }, true, ["deriveKey", "deriveBits"]);
}
async function importPublicKey(b64) {
  var buf = base64ToBytes(b64);
  return crypto.subtle.importKey("spki", buf, { name: "ECDH", namedCurve: "P-256" }, true, []);
}
async function deriveDmKey(peerPubB64, myPrivJwk) {
  var peerPub = await importPublicKey(peerPubB64);
  var myPriv = await importPrivateKey(JSON.parse(myPrivJwk));
  var bits = await crypto.subtle.deriveBits({ name: "ECDH", public: peerPub }, myPriv, 256);
  var km = await crypto.subtle.importKey("raw", bits, "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "HKDF", hash: "SHA-256", salt: utf8Bytes("acode-community-dm-v1"), info: utf8Bytes("key") }, km, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
async function encryptAES(key, plaintext) {
  var iv = randomBytes(12);
  var ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv, additionalData: utf8Bytes(ENC_AAD_ROOM) }, key, utf8Bytes(plaintext));
  return { iv: bytesToBase64(iv), data: bytesToBase64(new Uint8Array(ct)) };
}
async function decryptAES(key, ivB64, dataB64, aad) {
  var iv = base64ToBytes(ivB64);
  var ct = base64ToBytes(dataB64);
  var pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv, additionalData: utf8Bytes(aad) }, key, ct);
  return utf8Text(new Uint8Array(pt));
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
    var cid = normalizeId(k); if (!cid || cid === userId) return;
    var c = ci[k] || {};
    contacts[cid] = { id: cid, name: cleanName(c.name) || defaultName(cid), emoji: safeEmoji(c.emoji) || "🙂", publicKey: (typeof c.publicKey === "string" ? c.publicKey : ""), lastSeen: Number(c.lastSeen) || 0 };
  });
  var threads = {};
  var ti = input.threads && typeof input.threads === "object" ? input.threads : {};
  Object.keys(ti).forEach(function (k) {
    var t = ti[k] || {}; var msgs = Array.isArray(t.messages) ? t.messages.slice(-MAX_MESSAGES) : [];
    threads[k] = { peer: t.peer || "community", room: t.room || "", messages: msgs, unread: Math.max(0, Number(t.unread) || 0), lastTs: Number(t.lastTs) || 0 };
  });
  var cursors = input.cursors && typeof input.cursors === "object" ? input.cursors : {};
  var dmCursor = input.dmCursor && typeof input.dmCursor === "object" ? input.dmCursor : null;
  var verifiedIds = Array.isArray(input.verifiedIds) ? input.verifiedIds.map(normalizeId).filter(Boolean) : [];
  var cryptoInput = input.crypto && typeof input.crypto === "object" ? input.crypto : {};
  var cryptoState = { publicKey: (typeof cryptoInput.publicKey === "string" ? cryptoInput.publicKey : ""), privateJwk: (typeof cryptoInput.privateJwk === "string" ? cryptoInput.privateJwk : ""), publishedAt: Number(cryptoInput.publishedAt) || 0 };
  return { schema: 1, user: user, settings: { room: room, relay: relay, notify: settingsInput.notify !== false }, contacts: contacts, threads: threads, cursors: cursors, dmCursor: dmCursor, verifiedIds: verifiedIds, crypto: cryptoState, welcome: input.welcome !== false };
}
function loadState() {
  var raw = null;
  try { raw = localStorage.getItem(STORE_KEY); } catch (e) { raw = null; }
  var data = null;
  if (raw) { try { data = JSON.parse(raw); } catch (e) { data = null; } }
  return normalizeState(data);
}
function saveState() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {} }

/* ---------- identity keys ---------- */
async function ensureIdentityKeys() {
  if (!state.crypto) state.crypto = { publicKey: "", privateJwk: "", publishedAt: 0 };
  if (state.crypto.publicKey && state.crypto.privateJwk) return true;
  try {
    var kp = await generateIdentityKey();
    state.crypto.publicKey = kp.publicKey;
    state.crypto.privateJwk = kp.privateJwk;
    saveState();
    return true;
  } catch (e) { return false; }
}
async function publishPublicKey(force) {
  if (!running || !state) return;
  var now = Date.now();
  if (!force && state.crypto.publishedAt && now - state.crypto.publishedAt < 6 * 60 * 60 * 1000) return;
  await ensureIdentityKeys();
  var env = { app: APP_TAG, v: ENVELOPE_VERSION, id: uid(), from: state.user.id, name: state.user.name, emoji: state.user.emoji, type: "key", ts: now, pk: state.crypto.publicKey };
  await publish(env, dmTopicFor(state.user.id));
  state.crypto.publishedAt = now; saveState();
}
async function publishPresence(force) {
  if (!running || !state) return;
  var now = Date.now();
  if (!force && lastPresenceAt && now - lastPresenceAt < PRESENCE_MS) return;
  if (presenceInFlight) return;
  presenceInFlight = true; lastPresenceAt = now;
  await ensureIdentityKeys();
  var env = { app: APP_TAG, v: ENVELOPE_VERSION, id: uid(), from: state.user.id, name: state.user.name, emoji: state.user.emoji, type: "presence", ts: now };
  if (state.crypto && state.crypto.publicKey) env.pk = state.crypto.publicKey;
  try { await publish(env, topicFor(roomSlug())); } catch (e) {}
  presenceInFlight = false;
}

/* ---------- relay transport ---------- */
function fetchWithTimeout(url, options, timeoutMs) {
  var controller = null, timer = null;
  if (typeof AbortController !== "undefined") { controller = new AbortController(); timer = setTimeout(function () { try { controller.abort(); } catch (e) {} }, timeoutMs || 15000); }
  var opts = options || {}; if (controller) opts.signal = controller.signal;
  var req = fetch(url, opts);
  if (timer) { req.then(function () { clearTimeout(timer); }, function () { clearTimeout(timer); }); }
  return req;
}
function parseEnvelopeText(text) { if (typeof text !== "string" || !text) return null; try { var v = JSON.parse(text); return v && typeof v === "object" ? v : null; } catch (e) { return null; } }
function publish(envelope, topic) {
  var base = relayBase();
  var url = base + "/" + encodeURIComponent(topic);
  return fetchWithTimeout(url, { method: "POST", body: JSON.stringify(envelope), cache: "no-store" }, 25000).then(function (r) {
    if (r.ok) return r;
    return r.text().then(function (b) { throw new Error("Relay HTTP " + r.status); });
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
      var line = lines[i].trim(); if (!line) continue;
      var item; try { item = JSON.parse(line); } catch (e) { continue; }
      if (!item || item.event !== "message") continue;
      if (item.id) nextCursor = { id: String(item.id).slice(0, 80), ts: Number(item.time) || Math.floor(Date.now() / 1000) };
      var env = parseEnvelopeText(item.message);
      if (env) handleEnvelope(env);
    }
    if (nextCursor) onCursor(nextCursor);
  });
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
  var roomPoll = pollTopic(roomUrl, function () { return slug === roomSlug() && base === relayBase(); }, function (c) { var p = state.cursors[slug]; state.cursors[slug] = c; if (!p || p.id !== c.id) saveState(); }).catch(function () {});
  var dmPoll = pollTopic(dmUrl, function () { return userId === state.user.id && base === relayBase(); }, function (c) { state.dmCursor = c; saveState(); }).catch(function () {});
  Promise.all([roomPoll, dmPoll]).then(function () {
    if (running) { ui.status = "online"; renderStatus(); }
  }).catch(function () {}).then(function () { pollInFlight = false; schedulePoll(); });
}
function schedulePoll(delay) {
  if (!running) return;
  if (pollTimer) clearTimeout(pollTimer);
  var next = delay != null ? delay : (document.hidden ? POLL_SLOW_MS : POLL_FAST_MS);
  pollTimer = setTimeout(pollNow, Math.max(0, next));
}

/* ---------- incoming ---------- */
function handleEnvelope(env) {
  if (!state || !env || typeof env !== "object") return;
  if (env.app !== APP_TAG || Number(env.v) !== ENVELOPE_VERSION) return;
  var from = normalizeId(env.from); if (!from || from === state.user.id) return;
  var messageId = typeof env.id === "string" ? env.id.slice(0, 80) : ""; if (!messageId) return;
  var isPresence = env.type === "presence";
  var isKey = env.type === "key";
  var name = cleanName(env.name);
  var emoji = safeEmoji(env.emoji);
  var ts = Number(env.ts) || Date.now();
  var to = String(env.to || "all");
  if (!isPresence && !isKey && to !== "all" && to !== state.user.id) return;
  if (isKey && !state.contacts[from]) return;
  // upsert contact
  if (!state.contacts[from]) state.contacts[from] = { id: from, name: name || defaultName(from), emoji: emoji, publicKey: "", lastSeen: 0 };
  var contact = state.contacts[from];
  if (name) contact.name = name; if (emoji) contact.emoji = emoji;
  if (env.pk) contact.publicKey = env.pk;
  if (isPresence) { contact.lastSeen = ts; saveState(); render(); return; }
  if (isKey) { if (env.pk) contact.publicKey = env.pk; saveState(); return; }
  if (env.enc === ENC_VERSION) {
    // decrypt
    decryptWireEnvelope(env).then(function (payload) {
      applyIncoming(env, from, contact, messageId, payload.text, payload.image, ts);
    }).catch(function () {});
    return;
  }
  applyIncoming(env, from, contact, messageId, env.text, env.image, ts);
}
async function decryptWireEnvelope(env) {
  if (!cryptoAvailable()) throw new Error("no crypto");
  await ensureIdentityKeys();
  var key;
  if (env.to === "all") {
    key = await deriveRoomKey(roomSlug());
  } else {
    if (!state.contacts[env.from] || !state.contacts[env.from].publicKey) throw new Error("no key");
    key = await deriveDmKey(state.contacts[env.from].publicKey, state.crypto.privateJwk);
  }
  var aad = env.to === "all" ? ENC_AAD_ROOM : ENC_AAD_DM;
  var pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBytes(env.iv), additionalData: utf8Bytes(aad) }, key, base64ToBytes(env.data));
  var payload = JSON.parse(utf8Text(new Uint8Array(pt)));
  return { text: String(payload.text || ""), image: payload.image || "" };
}
async function buildWireEnvelope(peer, text, image) {
  var room = roomSlug();
  var env = { app: APP_TAG, v: ENVELOPE_VERSION, id: uid(), from: state.user.id, name: state.user.name, emoji: state.user.emoji, to: peer === "community" ? "all" : peer, type: "secure", ts: Date.now() };
  if (!cryptoAvailable()) throw new Error("Encryption unavailable");
  await ensureIdentityKeys();
  env.pk = state.crypto.publicKey;
  var key;
  if (peer === "community") key = await deriveRoomKey(room);
  else {
    var pk = state.contacts[peer] && state.contacts[peer].publicKey;
    if (!pk) throw new Error("Waiting for friend's key");
    key = await deriveDmKey(pk, state.crypto.privateJwk);
  }
  var iv = randomBytes(12);
  var aad = peer === "community" ? ENC_AAD_ROOM : ENC_AAD_DM;
  var plain = utf8Bytes(JSON.stringify({ text: text || "", image: image || "" }));
  var ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv, additionalData: utf8Bytes(aad) }, key, plain);
  env.enc = ENC_VERSION; env.iv = bytesToBase64(iv); env.data = bytesToBase64(new Uint8Array(ct));
  return env;
}
function applyIncoming(env, from, contact, messageId, text, image) {
  var peer = env.to === "all" ? "community" : from;
  var threadKey = peer === "community" ? ("room:" + roomSlug()) : ("dm:" + from);
  if (!state.threads[threadKey]) state.threads[threadKey] = { peer: peer, room: roomSlug(), messages: [], unread: 0, lastTs: 0 };
  var thread = state.threads[threadKey];
  if (thread.messages.some(function (m) { return m.id === messageId; })) return;
  thread.messages.push({ id: messageId, from: from, name: contact.name, text: text || "", image: image || "", ts: Number(env.ts) || Date.now(), mine: false });
  if (thread.messages.length > MAX_MESSAGES) thread.messages = thread.messages.slice(-MAX_MESSAGES);
  thread.lastTs = Math.max(thread.lastTs || 0, Number(env.ts) || Date.now());
  if (ui.peer !== peer || ui.mode !== "thread") thread.unread = (thread.unread || 0) + 1;
  saveState();
  render();
}

/* ---------- actions ---------- */
async function sendMessage(text, image) {
  if (!state) return;
  var peer = ui.peer;
  if (!peer) return;
  var isCommunity = peer === "community";
  var slug = roomSlug();
  var threadKey = isCommunity ? ("room:" + slug) : ("dm:" + peer);
  if (!state.threads[threadKey]) state.threads[threadKey] = { peer: peer, room: slug, messages: [], unread: 0, lastTs: 0 };
  var thread = state.threads[threadKey];
  var msgId = uid();
  var now = Date.now();
  var img = image || "";
  var optimistic = { id: msgId, from: state.user.id, name: state.user.name, text: img && !text ? "📷 Photo" : (text || ""), image: img, ts: now, mine: true, status: "sending" };
  thread.messages.push(optimistic);
  thread.lastTs = now;
  saveState(); render();
  try {
    var env = await buildWireEnvelope(peer, text || "", img);
    env.id = msgId;
    await publish(env, isCommunity ? topicFor(slug) : dmTopicFor(peer));
    optimistic.status = "sent"; saveState(); render();
    if (isCommunity && slug === "ai" && text) {
      fetch(AI_ENDPOINT + encodeURIComponent(text)).then(function (r) { return r.text(); }).then(function (reply) {
        var aiMsg = { id: uid(), from: AI_ID, name: AI_NAME, text: reply, image: "", ts: Date.now(), mine: false };
        thread.messages.push(aiMsg);
        if (thread.messages.length > MAX_MESSAGES) thread.messages = thread.messages.slice(-MAX_MESSAGES);
        thread.lastTs = Date.now();
        saveState(); render();
      }).catch(function () { toast("AI reply failed"); });
    }
  } catch (e) {
    optimistic.status = "failed"; saveState(); render();
    toast(e && e.message ? e.message : "Send failed");
  }
}
function retryMessage(id) {
  // simple: resend by id lookup
  toast("Retry not implemented in web build");
}
function openThread(peer) {
  ui.mode = "thread"; ui.peer = peer;
  var threadKey = peer === "community" ? ("room:" + roomSlug()) : ("dm:" + peer);
  if (state.threads[threadKey]) state.threads[threadKey].unread = 0;
  saveState(); render();
}
function closeThread() { ui.mode = "tabs"; ui.peer = null; render(); }
function addContact(id) {
  var cid = normalizeId(id); if (!cid) { toast("Invalid ID"); return; }
  if (cid === state.user.id) { toast("That's you"); return; }
  if (!state.contacts[cid]) state.contacts[cid] = { id: cid, name: defaultName(cid), emoji: "🙂", publicKey: "", lastSeen: 0 };
  if (!state.threads["dm:" + cid]) state.threads["dm:" + cid] = { peer: cid, room: "", messages: [], unread: 0, lastTs: 0 };
  saveState(); render(); toast("Contact added");
}
function setRoom(room) { state.settings.room = slugFor(room); state.cursors[roomSlug()] = null; saveState(); render(); pollNow(); }
function saveName() { var n = cleanName(document.getElementById("nameInput").value); if (!n) { toast("Enter a name"); return; } state.user.name = n; saveState(); publishPresence(true); render(); toast("Name saved"); }

/* ---------- render ---------- */
function render() { if (!$root) return; if (ui.mode === "thread") renderThread(); else renderTabs(); }
function renderTabs() {
  var tabs = ["chats", "people", "me"];
  var html = '<div class="cm-topbar"><h1>Community Chat</h1><span class="cm-muted">' + escapeHTML(state.user.emoji) + " " + escapeHTML(state.user.name) + "</span></div>";
  html += '<div class="cm-tabs">' + tabs.map(function (t) { return '<button class="cm-tab' + (ui.tab === t ? " active" : "") + '" data-tab="' + t + '">' + (t === "chats" ? "Chats" : t === "people" ? "People" : "Me") + "</button>"; }).join("") + "</div>";
  html += '<div class="cm-content">';
  if (ui.tab === "chats") html += renderChats();
  else if (ui.tab === "people") html += renderPeople();
  else html += renderMe();
  html += "</div>";
  $root.innerHTML = html;
  $root.querySelectorAll("[data-tab]").forEach(function (b) { b.onclick = function () { ui.tab = b.dataset.tab; render(); }; });
  bindActions();
}
function renderChats() {
  var slug = roomSlug();
  var info = roomInfo(slug);
  var html = '<div class="cm-card"><div class="cm-row" data-action="open-room"><span class="cm-avatar">' + info.emoji + '</span><div><div class="cm-rowname">' + escapeHTML(info.name) + '</div><div class="cm-rowsub">' + escapeHTML(info.desc) + "</div></div></div></div>";
  html += '<div class="cm-section-title" style="font-weight:700;margin:8px 0">Direct chats</div>';
  var dms = Object.keys(state.contacts);
  if (!dms.length) html += '<div class="cm-empty">No direct chats yet. Add a friend in People.</div>';
  dms.forEach(function (id) {
    var c = state.contacts[id];
    var th = state.threads["dm:" + id];
    var unread = th ? (th.unread || 0) : 0;
    html += '<div class="cm-row" data-action="open-dm" data-id="' + escapeHTML(id) + '"><span class="cm-avatar">' + escapeHTML(c.emoji) + '</span><div style="flex:1"><div class="cm-rowname">' + escapeHTML(c.name) + verifiedBadge(id) + '</div><div class="cm-rowsub">' + escapeHTML(id) + (unread ? " · " + unread + " new" : "") + "</div></div></div>";
  });
  // room picker
  html += '<div class="cm-card" style="margin-top:12px"><h3>Rooms</h3><div class="cm-btn-row">';
  ROOMS.forEach(function (r) { html += '<button class="cm-btn' + (slug === r.slug ? " primary" : "") + '" data-action="set-room" data-slug="' + r.slug + '">' + r.emoji + " " + r.name + "</button>"; });
  html += '</div><div class="cm-inline" style="margin-top:8px"><input class="cm-input" id="roomInput" placeholder="custom room code"><button class="cm-btn" data-action="join-room">Join</button></div></div>';
  return html;
}
function renderPeople() {
  var contacts = Object.keys(state.contacts);
  var html = '<div class="cm-card"><h3>Add contact</h3><div class="cm-inline"><input class="cm-input" id="contactInput" placeholder="CM-XXXX-XXXX"><button class="cm-btn primary" data-action="add-contact">Add</button></div></div>';
  html += '<div class="cm-section-title" style="font-weight:700;margin:8px 0">People you know</div>';
  if (!contacts.length) html += '<div class="cm-empty">No contacts yet.</div>';
  contacts.forEach(function (id) {
    var c = state.contacts[id];
    html += '<div class="cm-row" data-action="open-dm" data-id="' + escapeHTML(id) + '"><span class="cm-avatar">' + escapeHTML(c.emoji) + '</span><div style="flex:1"><div class="cm-rowname">' + escapeHTML(c.name) + verifiedBadge(id) + '</div><div class="cm-rowsub">' + escapeHTML(id) + '</div></div></div>';
  });
  html += '<div class="cm-card" style="margin-top:12px"><h3>Verified badge</h3><p class="cm-muted">' + (state.user.id === DEV_ID ? "Your developer profile is verified." : "Message " + DEV_ID + " to request a badge. Include your ID " + state.user.id + ".") + '</p>' + (state.user.id !== DEV_ID ? '<div class="cm-btn-row"><button class="cm-btn primary" data-action="message-dev">Message developer</button></div>' : '') + '</div>';
  return html;
}
function renderMe() {
  var html = '<div class="cm-card"><h3>Profile</h3><div class="cm-inline"><input class="cm-input" id="nameInput" value="' + escapeHTML(state.user.name) + '"><button class="cm-btn primary" data-action="save-name">Save</button></div><p class="cm-muted">ID: <span class="cm-idbox">' + escapeHTML(state.user.id) + '</span></p><div class="cm-btn-row"><button class="cm-btn" data-action="copy-id">Copy ID</button></div></div>';
  html += '<div class="cm-card"><h3>Relay</h3><div class="cm-inline"><input class="cm-input" id="relayInput" value="' + escapeHTML(state.settings.relay) + '"><button class="cm-btn primary" data-action="save-relay">Save</button></div><p class="cm-muted">Default: community-relay.hdo-box.workers.dev. Everyone must use the same relay.</p></div>';
  html += '<div class="cm-card"><h3>About</h3><p class="cm-muted">Community Chat web v' + VERSION + " · " + (ui.status || "") + "</p></div>";
  return html;
}
function renderThread() {
  var peer = ui.peer;
  var isCommunity = peer === "community";
  var slug = roomSlug();
  var name = isCommunity ? roomInfo(slug).name : (state.contacts[peer] ? state.contacts[peer].name : peer);
  var threadKey = isCommunity ? ("room:" + slug) : ("dm:" + peer);
  var thread = state.threads[threadKey];
  var msgs = thread ? thread.messages : [];
  var html = '<div class="cm-thread"><div class="cm-thread-head"><button class="cm-btn" data-action="back">←</button><div style="flex:1"><div class="cm-rowname">' + escapeHTML(name) + (isCommunity ? "" : verifiedBadge(peer)) + '</div></div></div>';
  html += '<div class="cm-thread-msgs" id="msgs">';
  msgs.forEach(function (m) {
    var mine = m.from === state.user.id;
    html += '<div class="cm-bubble ' + (mine ? "mine" : "") + '">' + (m.image ? '<img src="' + escapeHTML(m.image) + '">' : "") + (m.text ? escapeHTML(m.text) : "") + (m.status === "failed" ? ' <span style="opacity:.7">(failed)</span>' : "") + "</div>";
  });
  html += '</div><div class="cm-composer"><button class="cm-btn" data-action="pick-image">📷</button><input id="composer" placeholder="Message…"><button class="cm-btn primary" data-action="send">Send</button></div></div>';
  $root.innerHTML = html;
  var msgsEl = document.getElementById("msgs"); if (msgsEl) msgsEl.scrollTop = msgsEl.scrollHeight;
  bindActions();
  var comp = document.getElementById("composer");
  if (comp) { comp.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); doSend(); } }); }
}
function renderStatus() { /* no-op */ }

/* ---------- bind ---------- */
function bindActions() {
  $root.querySelectorAll("[data-action]").forEach(function (el) {
    el.onclick = function (e) {
      var a = el.dataset.action;
      if (a === "open-room") { /* toggle */ }
      else if (a === "open-dm") openThread(el.dataset.id);
      else if (a === "set-room") setRoom(el.dataset.slug);
      else if (a === "join-room") { var v = document.getElementById("roomInput").value; if (v) setRoom(v); }
      else if (a === "add-contact") { var v = document.getElementById("contactInput").value; addContact(v); }
      else if (a === "message-dev") { addContact(DEV_ID); openThread(DEV_ID); }
      else if (a === "save-name") saveName();
      else if (a === "copy-id") { navigator.clipboard.writeText(state.user.id).then(function () { toast("Copied"); }); }
      else if (a === "save-relay") { var v = cleanRelay(document.getElementById("relayInput").value); if (!v) { toast("Invalid URL"); return; } state.settings.relay = v; state.cursors = {}; state.dmCursor = null; saveState(); render(); pollNow(); toast("Relay updated"); }
      else if (a === "back") closeThread();
      else if (a === "send") doSend();
      else if (a === "pick-image") document.getElementById("fileInput").click();
      else if (a === "tab") { ui.tab = el.dataset.tab; render(); }
    };
  });
}
function doSend() {
  var comp = document.getElementById("composer"); if (!comp) return;
  var text = comp.value.trim(); comp.value = "";
  sendMessage(text, "").then(function () {});
}
document.getElementById("fileInput").addEventListener("change", function (e) {
  var f = e.target.files && e.target.files[0]; e.target.value = "";
  if (!f) return;
  readFileAsDataURL(f).then(compressImage).then(function (du) {
    if (ui.mode === "thread") sendMessage("", du);
  });
});

/* ---------- boot ---------- */
async function boot() {
  state = loadState();
  await ensureIdentityKeys();
  // publish public key
  publishPublicKey(true).catch(function () {});
  $root = document.getElementById("app");
  ui.status = "connecting";
  render();
  pollNow();
  setInterval(function () { publishPresence(false); }, 60000);
  setTimeout(function () { publishPresence(true); }, 1000);
}
boot();
