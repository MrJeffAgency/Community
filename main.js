/*
 * Community Chat for Acode
 * ------------------------------------------------------------
 * A small chat plugin for Acode.
 *
 *  - Every installation gets a unique ID (CM-XXXX-XXXX) which is
 *    generated once and stored in localStorage on the phone.
 *  - Messages are sent through a public ntfy.sh topic (or any
 *    compatible relay) so two phones with this plugin can chat.
 *  - All conversations are also stored locally on the phone.
 *
 * The plugin uses no build step: Acode loads this file directly.
 */
(function () {
  "use strict";

  /* ------------------------------------------------------------------ *
   * Constants
   * ------------------------------------------------------------------ */

  var PLUGIN_ID = "mrjeffagency.community";
  var VERSION = "1.2.0";
  var STORE_KEY = "acode.community.chat.v1";
  var APP_TAG = "acode-community";
  var ENVELOPE_VERSION = 1;
  var DEFAULT_ROOM = "general";
  var DEFAULT_RELAY = "https://ntfy.sh";
  var TOPIC_PREFIX = "acode-community-v1-";
  var THREAD_ACTION_ID = PLUGIN_ID + ".thread";
  var AI_ENDPOINT = "https://luckyai-blush.vercel.app/api/chat?message=";
  var AI_ID = "CM-AI00-0000";
  var AI_NAME = "Lucky AI";
  var AI_WELCOME_ID = "ai-welcome-v1";

  var ENC_VERSION = "aes-gcm-v1";
  var ENC_AAD_ROOM = "acode-community-room-v1";
  var ENC_AAD_DM = "acode-community-dm-v1";
  var ROOM_KDF_ITERATIONS = 120000;
  var KEY_PUBLISH_MS = 6 * 60 * 60 * 1000;

  var POLL_FAST_MS = 5000;
  var POLL_SLOW_MS = 25000;
  var PRESENCE_MS = 60000;
  var ONLINE_MS = 150000;
  var MAX_TEXT = 1200;
  var MAX_MESSAGES = 250;
  var MAX_THREADS = 50;
  var MAX_IMAGE_CHARS = 220000;
  var MAX_IMAGES_PER_THREAD = 8;
  var MAX_IMAGE_CAPTION = 240;
  var MAX_AI_TEXT = 6000;

  var ROOMS = [
    { slug: "general", name: "General", emoji: "💬", desc: "Say hello to everyone" },
    { slug: "ai", name: "AI Room", emoji: "🤖", desc: "Chat with Lucky AI" },
    { slug: "games", name: "Game Room", emoji: "🎮", desc: "Games, tips and fun" },
    { slug: "dev", name: "Dev Room", emoji: "💻", desc: "Code and projects" },
    { slug: "help", name: "Help Room", emoji: "🛟", desc: "Ask for help" }
  ];


  var ID_RE = /^CM-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  var ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  var AVATARS = [
    "🦊", "🐼", "🐸", "🦉", "🐙", "🚀", "🌙", "⭐", "🔥", "🌊",
    "🍀", "🎧", "💡", "🦄", "🐯", "🐨", "🌈", "⚡", "🍕", "🎮"
  ];

  var COLORS = [
    "#6c5ce7", "#00a8a8", "#e17055", "#0984e3", "#00b894",
    "#d63031", "#8e44ad", "#f39c12", "#16a085", "#c0392b"
  ];

  /* ------------------------------------------------------------------ *
   * Runtime
   * ------------------------------------------------------------------ */

  var acodeApi = null;
  var pageRef = null;
  var baseUrl = "";
  var state = null;
  var $root = null;
  var sidebarEl = null;
  var toast = null;

  var running = false;
  var pollTimer = null;
  var presenceTimer = null;
  var tickTimer = null;
  var pollInFlight = false;
  var memoryStore = null;
  var loadedFromStorage = false;
  var identityPromise = null;
  var roomKeyPromises = {};
  var dmKeyPromises = {};
  var peerKeyFetches = {};
  var keyPublishInFlight = false;
  var cryptoEpoch = 0;

  var ui = {
    tab: "chats",
    mode: "tabs",
    peer: null,
    status: "connecting",
    lastSync: 0,
    lastError: "",
    modal: null,
    aiBusy: false,
    aiPending: 0
  };

  /* ------------------------------------------------------------------ *
   * Small helpers
   * ------------------------------------------------------------------ */

  function safeRequire(name) {
    try {
      return acodeApi.require(name);
    } catch (e) {
      return null;
    }
  }

  function toastMsg(message, duration) {
    try {
      if (typeof toast === "function") {
        toast(String(message), duration || 3000);
        return;
      }
    } catch (e) {
      /* ignore */
    }
  }

  function escapeHTML(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      if (c === "&") return "&amp;";
      if (c === "<") return "&lt;";
      if (c === ">") return "&gt;";
      if (c === '"') return "&quot;";
      return "&#39;";
    });
  }

  function safeText(value, max) {
    return String(value == null ? "" : value).slice(0, max == null ? 500 : max);
  }

  /* ------------------------------------------------------------------ *
   * End-to-end encryption helpers
   * ------------------------------------------------------------------ */

  function cryptoAvailable() {
    return !!(window.crypto && window.crypto.subtle &&
      typeof window.TextEncoder === "function" &&
      typeof window.TextDecoder === "function");
  }

  function utf8Bytes(value) {
    return new window.TextEncoder().encode(String(value == null ? "" : value));
  }

  function utf8Text(bytes) {
    return new window.TextDecoder().decode(bytes);
  }

  function bytesToBase64(bytes) {
    var binary = "";
    for (var i = 0; i < bytes.length; i += 0x8000) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return window.btoa(binary);
  }

  function base64ToBytes(value) {
    var binary = window.atob(String(value == null ? "" : value));
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  function cleanPublicKey(value) {
    var key = String(value == null ? "" : value).trim();
    if (key.length < 60 || key.length > 300) return "";
    if (!/^[A-Za-z0-9+/=]+$/.test(key)) return "";
    return key;
  }

  function resetCryptoCaches() {
    cryptoEpoch += 1;
    identityPromise = null;
    dmKeyPromises = {};
    peerKeyFetches = {};
    keyPublishInFlight = false;
  }

  function ensureIdentityKeys() {
    if (!state) return Promise.resolve(false);
    if (state.crypto && state.crypto.publicKey && state.crypto.privateJwk) {
      return Promise.resolve(true);
    }
    if (!cryptoAvailable()) return Promise.resolve(false);
    if (identityPromise) return identityPromise;

    var epoch = cryptoEpoch;
    identityPromise = window.crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveKey"]
    ).then(function (pair) {
      return Promise.all([
        window.crypto.subtle.exportKey("raw", pair.publicKey),
        window.crypto.subtle.exportKey("jwk", pair.privateKey)
      ]);
    }).then(function (parts) {
      if (!state || epoch !== cryptoEpoch) return false;
      state.crypto = {
        publicKey: bytesToBase64(new Uint8Array(parts[0])),
        privateJwk: JSON.stringify(parts[1]),
        createdAt: Date.now(),
        publishedAt: 0
      };
      saveState();
      return true;
    }).catch(function () {
      return false;
    }).then(function (ok) {
      if (epoch === cryptoEpoch) identityPromise = null;
      return ok;
    });

    return identityPromise;
  }

  function getRoomCryptoKey(slug) {
    var room = String(slug || roomSlug());
    if (roomKeyPromises[room]) return roomKeyPromises[room];
    if (!cryptoAvailable()) {
      return Promise.reject(new Error("Encryption is not available on this device"));
    }
    var promise = window.crypto.subtle.importKey(
      "raw",
      utf8Bytes("acode-community-passphrase-v1:" + room),
      "PBKDF2",
      false,
      ["deriveKey"]
    ).then(function (baseKey) {
      return window.crypto.subtle.deriveKey({
        name: "PBKDF2",
        salt: utf8Bytes("acode-community-room-salt-v1"),
        iterations: ROOM_KDF_ITERATIONS,
        hash: "SHA-256"
      }, baseKey, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    });
    roomKeyPromises[room] = promise;
    promise.catch(function () {
      if (roomKeyPromises[room] === promise) delete roomKeyPromises[room];
    });
    return promise;
  }

  function deriveDmKey(peer) {
    var peerId = normalizeId(peer);
    if (!peerId) return Promise.reject(new Error("Unknown friend"));
    if (dmKeyPromises[peerId]) return dmKeyPromises[peerId];
    if (!cryptoAvailable()) {
      return Promise.reject(new Error("Encryption is not available on this device"));
    }

    var promise = ensureIdentityKeys().then(function (ok) {
      if (!ok) throw new Error("Your secure key is not ready yet");
      var contact = contactFor(peerId);
      var publicKey = contact && contact.publicKey;
      if (!publicKey) throw new Error("Waiting for this friend's secure key");
      return window.crypto.subtle.importKey(
        "raw",
        base64ToBytes(publicKey),
        { name: "ECDH", namedCurve: "P-256" },
        false,
        []
      );
    }).then(function (peerKey) {
      var jwk;
      try {
        jwk = JSON.parse(state.crypto.privateJwk);
      } catch (e) {
        throw new Error("Your secure key is damaged");
      }
      return window.crypto.subtle.importKey(
        "jwk",
        jwk,
        { name: "ECDH", namedCurve: "P-256" },
        false,
        ["deriveKey"]
      ).then(function (privateKey) {
        return window.crypto.subtle.deriveKey(
          { name: "ECDH", public: peerKey },
          privateKey,
          { name: "AES-GCM", length: 256 },
          false,
          ["encrypt", "decrypt"]
        );
      });
    });

    dmKeyPromises[peerId] = promise;
    promise.catch(function () {
      if (dmKeyPromises[peerId] === promise) delete dmKeyPromises[peerId];
    });
    return promise;
  }

  function rememberPublicKey(id, value) {
    var peerId = normalizeId(id);
    var publicKey = cleanPublicKey(value);
    if (!peerId || !publicKey || !state) return;
    var contact = state.contacts[peerId];
    if (!contact) return;
    // Trust on first use: once a friend's key is known, only an explicit
    // invite paste can replace it. This stops a relay from swapping keys later.
    if (contact.publicKey) return;
    contact.publicKey = publicKey;
    delete dmKeyPromises[peerId];
    saveState();
  }

  function fetchPeerPublicKey(peer) {
    var peerId = normalizeId(peer);
    if (!peerId) return Promise.resolve("");
    var url = relayBase() + "/" + encodeURIComponent(dmTopicFor(peerId)) +
      "/json?poll=1&limit=300&since=all";
    return fetchWithTimeout(url, { cache: "no-store" }, 12000)
      .then(function (response) {
        if (!response.ok) throw new Error("Relay returned HTTP " + response.status);
        return response.text();
      })
      .then(function (text) {
        var found = "";
        var lines = String(text || "").split("\n");
        for (var i = 0; i < lines.length; i += 1) {
          var line = lines[i].trim();
          if (!line) continue;
          var item;
          try {
            item = JSON.parse(line);
          } catch (e) {
            continue;
          }
          if (!item || item.event !== "message" || typeof item.message !== "string") continue;
          var envelope;
          try {
            envelope = JSON.parse(item.message);
          } catch (e) {
            continue;
          }
          if (!envelope || envelope.app !== APP_TAG || Number(envelope.v) !== ENVELOPE_VERSION) continue;
          if (normalizeId(envelope.from) !== peerId) continue;
          var publicKey = cleanPublicKey(envelope.pk);
          if (publicKey) found = publicKey;
        }
        return found;
      });
  }

  function ensurePeerPublicKey(peer) {
    var peerId = normalizeId(peer);
    if (!peerId) return Promise.resolve("");
    var contact = contactFor(peerId);
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

  function publishPublicKey(force) {
    if (!state || !state.crypto || !state.crypto.publicKey) return Promise.resolve(false);
    var now = Date.now();
    var publishedAt = Number(state.crypto.publishedAt) || 0;
    if (!force && publishedAt && now - publishedAt < KEY_PUBLISH_MS) return Promise.resolve(true);
    if (keyPublishInFlight) return Promise.resolve(true);
    keyPublishInFlight = true;

    var envelope = {
      app: APP_TAG,
      v: ENVELOPE_VERSION,
      id: uid(),
      from: state.user.id,
      name: state.user.name,
      emoji: state.user.emoji,
      to: state.user.id,
      type: "key",
      pk: state.crypto.publicKey,
      ts: now
    };

    return publish(envelope, dmTopicFor(state.user.id)).then(function () {
      keyPublishInFlight = false;
      if (state && state.crypto) {
        state.crypto.publishedAt = now;
        saveState();
      }
      return true;
    }, function () {
      keyPublishInFlight = false;
      return false;
    });
  }

  function buildWireEnvelope(peer, text, image, slug) {
    var room = String(slug || roomSlug());
    var envelope = {
      app: APP_TAG,
      v: ENVELOPE_VERSION,
      id: uid(),
      from: state.user.id,
      name: state.user.name,
      emoji: state.user.emoji,
      to: peer === "community" ? "all" : peer,
      type: "secure",
      ts: Date.now()
    };

    if (!cryptoAvailable()) {
      envelope.type = image ? "image" : "text";
      envelope.text = text || "";
      if (image) envelope.image = image;
      return Promise.resolve(envelope);
    }

    return ensureIdentityKeys().then(function (ok) {
      if (!ok) throw new Error("Encryption could not start on this device");
      envelope.pk = state.crypto.publicKey;
      if (!state.crypto.publishedAt) publishPublicKey(true);

      var keyPromise;
      if (peer === "community") {
        keyPromise = getRoomCryptoKey(room);
      } else {
        keyPromise = ensurePeerPublicKey(peer).then(function (publicKey) {
          if (!publicKey) {
            throw new Error("Waiting for this friend's secure key. Ask them to open Community Chat, then tap retry.");
          }
          return deriveDmKey(peer);
        });
      }

      return keyPromise.then(function (key) {
        var iv = window.crypto.getRandomValues(new Uint8Array(12));
        var aad = utf8Bytes(peer === "community" ? ENC_AAD_ROOM : ENC_AAD_DM);
        var plain = utf8Bytes(JSON.stringify({ text: text || "", image: image || "" }));
        return window.crypto.subtle.encrypt(
          { name: "AES-GCM", iv: iv, additionalData: aad },
          key,
          plain
        ).then(function (cipher) {
          envelope.enc = ENC_VERSION;
          envelope.iv = bytesToBase64(iv);
          envelope.data = bytesToBase64(new Uint8Array(cipher));
          return envelope;
        });
      });
    });
  }

  function decryptWireEnvelope(envelope) {
    if (!cryptoAvailable() || typeof envelope.data !== "string" || typeof envelope.iv !== "string") {
      return Promise.reject(new Error("Encrypted message cannot be opened on this device"));
    }
    var scope = envelope.to === "all" ? "room" : "dm";

    return ensureIdentityKeys().then(function (ok) {
      if (!ok) throw new Error("Encryption is not ready");
      var keyPromise;
      if (scope === "room") {
        keyPromise = getRoomCryptoKey(roomSlug());
      } else {
        keyPromise = ensurePeerPublicKey(envelope.from).then(function (publicKey) {
          if (!publicKey) throw new Error("No secure key for this sender");
          return deriveDmKey(envelope.from);
        });
      }

      return keyPromise.then(function (key) {
        return window.crypto.subtle.decrypt({
          name: "AES-GCM",
          iv: base64ToBytes(envelope.iv),
          additionalData: utf8Bytes(scope === "room" ? ENC_AAD_ROOM : ENC_AAD_DM)
        }, key, base64ToBytes(envelope.data));
      });
    }).then(function (plain) {
      var payload = JSON.parse(utf8Text(new Uint8Array(plain)));
      return {
        text: String(payload && payload.text || ""),
        image: sanitizeImage(payload && payload.image || "")
      };
    });
  }

  function hashString(value) {
    var hash = 0;
    var str = String(value || "");
    for (var i = 0; i < str.length; i += 1) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
  }

  function pick(list, value) {
    return list[hashString(value) % list.length];
  }

  function emojiFor(id) {
    return pick(AVATARS, id || "community");
  }

  function colorFor(id) {
    return pick(COLORS, id || "community");
  }

  function safeEmoji(value) {
    var str = Array.from(String(value == null ? "" : value)).slice(0, 4).join("");
    str = str.replace(/[\u0000-\u001f<>]/g, "");
    return str;
  }

  function cleanName(value) {
    return String(value == null ? "" : value)
      .replace(/[\u0000-\u001f]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 40);
  }

  function defaultName(id) {
    return "User " + String(id || "CM-0000-0000").slice(-4);
  }

  function makeUserId() {
    var bytes = new Uint8Array(8);
    if (window.crypto && typeof window.crypto.getRandomValues === "function") {
      window.crypto.getRandomValues(bytes);
    } else {
      for (var i = 0; i < bytes.length; i += 1) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }
    var out = "";
    for (var j = 0; j < bytes.length; j += 1) {
      out += ID_ALPHABET.charAt(bytes[j] % ID_ALPHABET.length);
    }
    return "CM-" + out.slice(0, 4) + "-" + out.slice(4);
  }

  function makeUser() {
    var id = makeUserId();
    return {
      id: id,
      name: defaultName(id),
      emoji: emojiFor(id),
      createdAt: Date.now()
    };
  }

  function uid() {
    var bytes = new Uint8Array(16);
    if (window.crypto && typeof window.crypto.getRandomValues === "function") {
      window.crypto.getRandomValues(bytes);
    } else {
      for (var i = 0; i < bytes.length; i += 1) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
    }
    var out = "";
    for (var j = 0; j < bytes.length; j += 1) {
      out += (bytes[j] % 36).toString(36);
    }
    return Date.now().toString(36) + "-" + out;
  }

  function normalizeId(value) {
    var str = String(value == null ? "" : value)
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");
    if (/^[A-Z0-9]{8}$/.test(str)) {
      str = "CM-" + str.slice(0, 4) + "-" + str.slice(4);
    }
    return ID_RE.test(str) ? str : "";
  }

  function cleanRoom(value) {
    return String(value == null ? "" : value)
      .replace(/^#+/, "")
      .replace(/[\u0000-\u001f]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 32);
  }

  function slugFor(room) {
    var str = String(room == null ? "" : room)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
    return str || DEFAULT_ROOM;
  }

  function roomSlug() {
    return slugFor(state ? state.settings.room : DEFAULT_ROOM);
  }

  function roomInfo(value) {
    var slug = slugFor(value);
    for (var i = 0; i < ROOMS.length; i += 1) {
      if (ROOMS[i].slug === slug) {
        return {
          slug: ROOMS[i].slug,
          name: ROOMS[i].name,
          emoji: ROOMS[i].emoji,
          desc: ROOMS[i].desc
        };
      }
    }
    var label = cleanRoom(value) || DEFAULT_ROOM;
    return { slug: slug, name: label, emoji: "💬", desc: "Custom room" };
  }

  function roomName() {
    return roomInfo(state ? state.settings.room : DEFAULT_ROOM).name;
  }

  function isAiRoom() {
    return roomSlug() === "ai";
  }

  function sanitizeImage(value) {
    if (typeof value !== "string") return "";
    if (value.length > MAX_IMAGE_CHARS) return "";
    if (!/^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(value)) return "";
    return value;
  }

  function cleanRelay(value) {
    var str = String(value == null ? "" : value).trim();
    if (!str) return "";
    try {
      var url = new URL(str);
      if (url.protocol !== "https:" && url.protocol !== "http:") return "";
      return (url.origin + url.pathname).replace(/\/+$/, "");
    } catch (e) {
      return "";
    }
  }

  function relayBase() {
    return cleanRelay(state && state.settings.relay) || DEFAULT_RELAY;
  }

  function topicFor(slug) {
    return TOPIC_PREFIX + slug;
  }

  function dmTopicFor(id) {
    return TOPIC_PREFIX + "dm-" + String(id || "").toLowerCase();
  }

  function sanitizeTs(value) {
    var number = Number(value);
    var now = Date.now();
    if (!isFinite(number)) return now;
    if (number < now - 30 * 24 * 60 * 60 * 1000) return now;
    if (number > now + 5 * 60 * 1000) return now;
    return number;
  }

  function formatClock(ts) {
    try {
      return new Date(ts).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return "";
    }
  }

  function sameDay(a, b) {
    var da = new Date(a);
    var db = new Date(b);
    return (
      da.getFullYear() === db.getFullYear() &&
      da.getMonth() === db.getMonth() &&
      da.getDate() === db.getDate()
    );
  }

  function dayKey(ts) {
    var date = new Date(ts);
    return date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate();
  }

  function formatDay(ts) {
    var now = Date.now();
    if (sameDay(ts, now)) return "Today";
    if (sameDay(ts, now - 86400000)) return "Yesterday";
    try {
      return new Date(ts).toLocaleDateString([], {
        day: "numeric",
        month: "short",
        year: new Date(ts).getFullYear() === new Date().getFullYear() ? undefined : "numeric"
      });
    } catch (e) {
      return "";
    }
  }

  function formatListTime(ts) {
    if (!ts) return "";
    var now = Date.now();
    if (sameDay(ts, now)) return formatClock(ts);
    if (sameDay(ts, now - 86400000)) return "Yesterday";
    if (now - ts < 7 * 86400000) {
      try {
        return new Date(ts).toLocaleDateString([], { weekday: "short" });
      } catch (e) {
        return "";
      }
    }
    try {
      return new Date(ts).toLocaleDateString([], { day: "2-digit", month: "2-digit" });
    } catch (e) {
      return "";
    }
  }

  function relativeTime(ts) {
    if (!ts) return "never";
    var diff = Date.now() - ts;
    if (diff < 45000) return "just now";
    if (diff < 3600000) return Math.floor(diff / 60000) + "m ago";
    if (diff < 86400000) return Math.floor(diff / 3600000) + "h ago";
    return formatListTime(ts);
  }

  function isOnline(contact) {
    return !!contact && contact.lastSeen > 0 && Date.now() - contact.lastSeen < ONLINE_MS;
  }

  function displayName(contact) {
    if (!contact) return "Unknown";
    return contact.alias || contact.name || defaultName(contact.id);
  }

  function contactFor(id) {
    return (state && state.contacts && state.contacts[id]) || null;
  }

  /* ------------------------------------------------------------------ *
   * State and local storage
   * ------------------------------------------------------------------ */

  function sanitizeMessages(list) {
    if (!Array.isArray(list)) return [];
    var out = [];
    var start = Math.max(0, list.length - MAX_MESSAGES);
    for (var i = start; i < list.length; i += 1) {
      var message = list[i];
      if (!message || typeof message.id !== "string") {
        continue;
      }
      var image = sanitizeImage(message.image);
      var text = typeof message.text === "string" ? message.text : "";
      if (!text && !image) continue;
      var from = normalizeId(message.from);
      if (!from) continue;
      var status = message.status;
      if (status !== "sending" && status !== "sent" && status !== "failed") {
        status = "sent";
      }
      if (status === "sending") status = "failed";
      out.push({
        id: message.id.slice(0, 80),
        from: from,
        name: cleanName(message.name),
        text: safeText(text, from === AI_ID ? MAX_AI_TEXT : MAX_TEXT),
        image: image,
        ts: Number(message.ts) || Date.now(),
        mine: !!message.mine,
        status: status
      });
    }
    return out;
  }

  function normalizeState(data) {
    var input = data && typeof data === "object" ? data : {};
    var userInput = input.user && typeof input.user === "object" ? input.user : {};
    var userId = normalizeId(userInput.id) || makeUserId();

    var user = {
      id: userId,
      name: cleanName(userInput.name) || defaultName(userId),
      emoji: safeEmoji(userInput.emoji) || emojiFor(userId),
      createdAt: Number(userInput.createdAt) || Date.now()
    };

    var settingsInput = input.settings && typeof input.settings === "object" ? input.settings : {};
    var room = cleanRoom(settingsInput.room) || DEFAULT_ROOM;
    var relay = cleanRelay(settingsInput.relay) || DEFAULT_RELAY;

    var contacts = {};
    var contactsInput = input.contacts && typeof input.contacts === "object" ? input.contacts : {};
    Object.keys(contactsInput).forEach(function (key) {
      var contactId = normalizeId(key);
      if (!contactId || contactId === userId) return;
      var contact = contactsInput[key] || {};
      contacts[contactId] = {
        id: contactId,
        name: cleanName(contact.name) || defaultName(contactId),
        alias: cleanName(contact.alias),
        emoji: safeEmoji(contact.emoji) || emojiFor(contactId),
        publicKey: cleanPublicKey(contact.publicKey),
        lastSeen: Number(contact.lastSeen) || 0,
        addedAt: Number(contact.addedAt) || Date.now(),
        auto: !!contact.auto
      };
    });

    var threads = {};
    var threadsInput = input.threads && typeof input.threads === "object" ? input.threads : {};
    Object.keys(threadsInput).forEach(function (key) {
      var thread = threadsInput[key];
      if (!thread || typeof thread !== "object") return;
      var peer = thread.peer === "community" ? "community" : normalizeId(thread.peer);
      if (!peer) return;
      var messages = sanitizeMessages(thread.messages);
      if (!messages.length && peer !== "community") return;
      var threadRoom = cleanRoom(thread.room) || room;
      threads[key] = {
        peer: peer,
        room: threadRoom,
        messages: messages,
        unread: Math.max(0, Number(thread.unread) || 0),
        lastTs: Number(thread.lastTs) || (messages.length ? messages[messages.length - 1].ts : 0),
        createdAt: Number(thread.createdAt) || Date.now()
      };
    });

    var dmCursor = null;
    var dmInput = input.dmCursor && typeof input.dmCursor === "object" ? input.dmCursor : null;
    if (dmInput && (dmInput.id || dmInput.ts)) {
      dmCursor = {
        id: typeof dmInput.id === "string" ? dmInput.id.slice(0, 80) : "",
        ts: Number(dmInput.ts) || 0
      };
    }

    var cursors = {};
    var cursorsInput = input.cursors && typeof input.cursors === "object" ? input.cursors : {};
    Object.keys(cursorsInput).forEach(function (key) {
      var cursor = cursorsInput[key];
      if (!cursor || typeof cursor !== "object") return;
      var id = typeof cursor.id === "string" ? cursor.id.slice(0, 80) : "";
      var ts = Number(cursor.ts) || 0;
      if (!id && !ts) return;
      cursors[slugFor(key)] = { id: id, ts: ts };
    });

    var cryptoInput = input.crypto && typeof input.crypto === "object" ? input.crypto : {};
    var cryptoState = {
      publicKey: cleanPublicKey(cryptoInput.publicKey),
      privateJwk: typeof cryptoInput.privateJwk === "string" ? cryptoInput.privateJwk.slice(0, 3000) : "",
      createdAt: Number(cryptoInput.createdAt) || 0,
      publishedAt: Number(cryptoInput.publishedAt) || 0
    };

    return {
      schema: 1,
      user: user,
      settings: {
        room: room,
        relay: relay,
        notify: settingsInput.notify !== false
      },
      contacts: contacts,
      threads: threads,
      cursors: cursors,
      dmCursor: dmCursor,
      crypto: cryptoState,
      welcome: input.welcome !== false
    };
  }

  function loadState() {
    var raw = null;
    try {
      raw = localStorage.getItem(STORE_KEY);
    } catch (e) {
      raw = memoryStore;
    }
    loadedFromStorage = !!raw;
    var data = null;
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch (e) {
        data = null;
      }
    }
    return normalizeState(data);
  }

  function trimState() {
    if (!state) return;
    var keys = Object.keys(state.threads);
    keys.forEach(function (key) {
      var thread = state.threads[key];
      if (!thread || !Array.isArray(thread.messages)) {
        delete state.threads[key];
        return;
      }
      if (thread.messages.length > MAX_MESSAGES) {
        thread.messages = thread.messages.slice(-MAX_MESSAGES);
      }
      trimThreadImages(thread);
      if (!thread.messages.length && thread.peer !== "community") {
        delete state.threads[key];
        return;
      }
      if (thread.messages.length) {
        thread.lastTs = thread.messages[thread.messages.length - 1].ts || thread.lastTs || 0;
      }
    });

    var threadKeys = Object.keys(state.threads);
    if (threadKeys.length > MAX_THREADS) {
      threadKeys.sort(function (a, b) {
        return (state.threads[b].lastTs || 0) - (state.threads[a].lastTs || 0);
      });
      var currentCommunityKey = threadKey("community");
      threadKeys.slice(MAX_THREADS).forEach(function (key) {
        if (key === currentCommunityKey) return;
        delete state.threads[key];
      });
    }
  }

  function trimThreadImages(thread, keep) {
    if (!thread || !Array.isArray(thread.messages)) return;
    var limit = keep == null ? MAX_IMAGES_PER_THREAD : keep;
    var seen = 0;
    for (var i = thread.messages.length - 1; i >= 0; i -= 1) {
      var message = thread.messages[i];
      if (!message || !message.image) continue;
      seen += 1;
      if (seen > limit) {
        message.image = "";
        if (!message.text) message.text = "📷 Photo";
      }
    }
  }

  function emergencyPrune() {
    if (!state) return;
    Object.keys(state.threads).forEach(function (key) {
      var thread = state.threads[key];
      if (thread && Array.isArray(thread.messages)) {
        trimThreadImages(thread, 2);
        var keep = Math.max(20, Math.floor(thread.messages.length / 2));
        thread.messages = thread.messages.slice(-keep);
      }
    });
    trimState();
  }

  function saveState() {
    if (!state) return;
    trimState();
    var json = JSON.stringify(state);
    try {
      localStorage.setItem(STORE_KEY, json);
    } catch (e) {
      emergencyPrune();
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(state));
      } catch (e2) {
        memoryStore = JSON.stringify(state);
        console.warn("[Community] Could not write local storage:", e2);
      }
    }
  }

  /* ------------------------------------------------------------------ *
   * Threads and contacts
   * ------------------------------------------------------------------ */

  function threadKey(peer) {
    if (peer === "community") return "room::" + roomSlug() + "::community";
    return "dm::" + normalizeId(peer);
  }

  function getThread(peer, create) {
    if (!state) return null;
    var normalizedPeer = peer === "community" ? "community" : normalizeId(peer);
    if (!normalizedPeer) return null;
    var key = threadKey(normalizedPeer);
    var thread = state.threads[key];
    if (!thread && create) {
      thread = {
        peer: normalizedPeer,
        room: roomSlug(),
        messages: [],
        unread: 0,
        lastTs: 0,
        createdAt: Date.now()
      };
      state.threads[key] = thread;
    }
    return thread || null;
  }

  function ensureCommunityThread() {
    getThread("community", true);
  }

  function ensureAiWelcome(thread) {
    if (!state || !isAiRoom()) return;
    var target = thread || getThread("community", true);
    if (!target) return;
    var hasWelcome = target.messages.some(function (message) {
      return message.id === AI_WELCOME_ID;
    });
    if (hasWelcome) return;
    target.messages.push({
      id: AI_WELCOME_ID,
      from: AI_ID,
      name: AI_NAME,
      text: "Hi! 👋 I'm Lucky AI, your helper in the AI Room.\n\n" +
        "Ask me anything — coding, games, school work, ideas, or how to use Acode. Try:\n" +
        "• Explain this error: ...\n" +
        "• Give me a game idea\n" +
        "• Help me write a message\n\n" +
        "I can read text here, so type your question below.",
      ts: Date.now(),
      mine: false,
      status: "sent"
    });
    target.lastTs = Date.now();
  }

  function upsertContact(id, name, emoji, seen) {
    var contactId = normalizeId(id);
    if (!state || !contactId || contactId === state.user.id) return null;
    var contact = state.contacts[contactId];
    if (!contact) {
      contact = {
        id: contactId,
        name: cleanName(name) || defaultName(contactId),
        alias: "",
        emoji: safeEmoji(emoji) || emojiFor(contactId),
        publicKey: "",
        lastSeen: 0,
        addedAt: Date.now(),
        auto: true
      };
      state.contacts[contactId] = contact;
    }
    if (name && !contact.alias) contact.name = cleanName(name) || contact.name;
    if (emoji) contact.emoji = safeEmoji(emoji) || contact.emoji;
    if (seen) contact.lastSeen = Date.now();
    return contact;
  }

  function directThreads() {
    if (!state) return [];
    return Object.keys(state.threads)
      .map(function (key) {
        return state.threads[key];
      })
      .filter(function (thread) {
        return thread && thread.peer !== "community" &&
          (thread.messages.length > 0 || thread.lastTs);
      })
      .sort(function (a, b) {
        return (b.lastTs || 0) - (a.lastTs || 0);
      });
  }

  function onlineCount() {
    if (!state) return 0;
    return Object.keys(state.contacts).filter(function (id) {
      return isOnline(state.contacts[id]);
    }).length;
  }

  function unreadTotal() {
    if (!state) return 0;
    var total = 0;
    var slug = roomSlug();
    Object.keys(state.threads).forEach(function (key) {
      var thread = state.threads[key];
      if (!thread) return;
      if (thread.peer === "community" && thread.room !== slug) return;
      total += thread.unread || 0;
    });
    return total;
  }

  /* ------------------------------------------------------------------ *
   * Relay transport (ntfy compatible)
   * ------------------------------------------------------------------ */

  function fetchWithTimeout(url, options, timeoutMs) {
    var controller = null;
    var timer = null;
    if (typeof AbortController !== "undefined") {
      controller = new AbortController();
      timer = setTimeout(function () {
        try {
          controller.abort();
        } catch (e) {
          /* ignore */
        }
      }, timeoutMs || 15000);
    }
    var opts = options || {};
    if (controller) opts.signal = controller.signal;
    var request = fetch(url, opts);
    if (timer) {
      request.then(function () {
        clearTimeout(timer);
      }, function () {
        clearTimeout(timer);
      });
    }
    return request;
  }

  function publish(envelope, topic) {
    var base = relayBase();
    var url = base + "/" + encodeURIComponent(topic || topicFor(roomSlug()));
    return fetchWithTimeout(url, {
      method: "POST",
      body: JSON.stringify(envelope),
      cache: "no-store"
    }, 25000).then(function (response) {
      if (!response.ok) {
        throw new Error("Relay returned HTTP " + response.status);
      }
      return response;
    });
  }

  function publishPresence() {
    if (!running || !state) return Promise.resolve();
    return ensureIdentityKeys().then(function () {
      if (!running || !state) return null;
      var envelope = {
        app: APP_TAG,
        v: ENVELOPE_VERSION,
        id: uid(),
        from: state.user.id,
        name: state.user.name,
        emoji: state.user.emoji,
        type: "presence",
        ts: Date.now()
      };
      if (state.crypto && state.crypto.publicKey) envelope.pk = state.crypto.publicKey;
      return publish(envelope);
    }).catch(function () {
      return null;
    });
  }

  function setStatus(status, error) {
    ui.status = status;
    if (status === "online") {
      ui.lastSync = Date.now();
      ui.lastError = "";
    } else if (error) {
      ui.lastError = String(error).slice(0, 160);
    }
    if ($root) renderStatus();
  }

  function sinceValue(cursor) {
    if (cursor && cursor.id) return cursor.id;
    if (cursor && cursor.ts) return String(cursor.ts);
    return "all";
  }

  function pollTopic(url, guard, onCursor) {
    return fetchWithTimeout(url, { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) {
          var error = new Error("Relay returned HTTP " + response.status);
          error.status = response.status;
          throw error;
        }
        return response.text();
      })
      .then(function (text) {
        if (!running || (guard && !guard())) return;

        var nextCursor = null;
        var lines = String(text || "").split("\n");
        for (var i = 0; i < lines.length; i += 1) {
          var line = lines[i].trim();
          if (!line) continue;
          var item;
          try {
            item = JSON.parse(line);
          } catch (e) {
            continue;
          }
          if (!item || item.event !== "message" || typeof item.message !== "string") {
            continue;
          }
          if (item.id) {
            nextCursor = {
              id: String(item.id).slice(0, 80),
              ts: Number(item.time) || Math.floor(Date.now() / 1000)
            };
          }
          var envelope;
          try {
            envelope = JSON.parse(item.message);
          } catch (e) {
            continue;
          }
          handleEnvelope(envelope);
        }

        if (nextCursor) onCursor(nextCursor);
      });
  }

  function pollNow() {
    if (!running || !state || pollInFlight) return Promise.resolve();
    pollInFlight = true;

    var slug = roomSlug();
    var base = relayBase();
    var roomCursor = state.cursors[slug] || null;
    var dmCursor = state.dmCursor || null;
    var userId = state.user.id;

    var roomUrl = base + "/" + encodeURIComponent(topicFor(slug)) +
      "/json?poll=1&limit=200&since=" + encodeURIComponent(sinceValue(roomCursor));
    var dmUrl = base + "/" + encodeURIComponent(dmTopicFor(userId)) +
      "/json?poll=1&limit=200&since=" + encodeURIComponent(sinceValue(dmCursor));

    if (ui.status === "offline") setStatus("connecting");

    var roomPoll = pollTopic(
      roomUrl,
      function () {
        return slug === roomSlug() && base === relayBase();
      },
      function (cursor) {
        var previous = state.cursors[slug];
        state.cursors[slug] = cursor;
        if (!previous || previous.id !== cursor.id || previous.ts !== cursor.ts) {
          saveState();
        }
      }
    ).catch(function (error) {
      if (roomCursor && roomCursor.id && error.status >= 400 && error.status < 500) {
        delete state.cursors[slug];
        saveState();
      }
      throw error;
    });

    var dmPoll = pollTopic(
      dmUrl,
      function () {
        return userId === state.user.id && base === relayBase();
      },
      function (cursor) {
        state.dmCursor = cursor;
        saveState();
      }
    ).catch(function (error) {
      if (dmCursor && dmCursor.id && error.status >= 400 && error.status < 500) {
        state.dmCursor = null;
        saveState();
      }
      throw error;
    });

    return Promise.all([roomPoll, dmPoll])
      .then(function () {
        if (running) setStatus("online");
      })
      .catch(function (error) {
        if (!running) return;
        setStatus("offline", error && error.message ? error.message : String(error));
      })
      .then(function () {
        pollInFlight = false;
        schedulePoll();
      });
  }

  function schedulePoll(delay) {
    if (!running) return;
    if (pollTimer) clearTimeout(pollTimer);
    var next = delay;
    if (next == null) {
      next = $root && pageRef && pageRef.isConnected && !document.hidden
        ? POLL_FAST_MS
        : POLL_SLOW_MS;
    }
    pollTimer = setTimeout(function () {
      pollNow();
    }, Math.max(0, next));
  }

  /* ------------------------------------------------------------------ *
   * Incoming messages
   * ------------------------------------------------------------------ */

  function handleEnvelope(envelope) {
    if (!state || !envelope || typeof envelope !== "object") return;
    if (envelope.app !== APP_TAG || Number(envelope.v) !== ENVELOPE_VERSION) return;

    var from = normalizeId(envelope.from);
    if (!from || from === state.user.id) return;

    var messageId = typeof envelope.id === "string" ? envelope.id.slice(0, 80) : "";
    if (!messageId) return;

    var isPresence = envelope.type === "presence";
    var isKey = envelope.type === "key";
    var name = cleanName(envelope.name);
    var emoji = safeEmoji(envelope.emoji);
    var ts = sanitizeTs(envelope.ts);

    var to = String(envelope.to || "all");
    if (!isPresence && !isKey && to !== "all" && to !== state.user.id) return;

    // Key-only messages are for peers we already know; don't auto-add strangers.
    if (isKey && !state.contacts[from]) return;

    var contact = upsertContact(from, name, emoji, true);
    if (!contact) return;
    if (envelope.pk) rememberPublicKey(from, envelope.pk);

    if (isPresence) {
      saveState();
      if ($root && pageRef && pageRef.isConnected) {
        if (ui.mode === "thread") {
          updateThreadBar();
        } else if (ui.tab === "chats") {
          renderHome();
        }
      }
      updateSidebar();
      return;
    }

    if (isKey) {
      saveState();
      return;
    }

    if (isAiRoom() && to === "all") return;

    if (envelope.enc === ENC_VERSION) {
      decryptWireEnvelope(envelope).then(function (payload) {
        if (!state || !payload) return;
        applyIncomingMessage(envelope, from, contact, messageId, payload.text, payload.image, ts);
      }).catch(function () {
        /* Ignore messages this device cannot decrypt. */
      });
      return;
    }

    applyIncomingMessage(envelope, from, contact, messageId, envelope.text, envelope.image, ts);
  }

  function applyIncomingMessage(envelope, from, contact, messageId, rawText, rawImage, ts) {
    if (!state) return;
    var text = String(rawText == null ? "" : rawText).slice(0, MAX_TEXT).trim();
    var image = sanitizeImage(rawImage);
    var isImage = !!image;
    if (!text && !image) return;

    var to = String(envelope.to || "all");
    var peer = to === "all" ? "community" : from;
    var thread = getThread(peer, true);
    if (!thread) return;

    var duplicate = thread.messages.some(function (message) {
      return message.id === messageId;
    });
    if (duplicate) return;

    var storedText = isImage && !text ? "📷 Photo" : text;
    thread.messages.push({
      id: messageId,
      from: from,
      name: contact.name || cleanName(envelope.name),
      text: safeText(storedText, isImage ? MAX_IMAGE_CAPTION : MAX_TEXT),
      image: image,
      ts: ts,
      mine: false,
      status: "sent"
    });
    thread.lastTs = Math.max(thread.lastTs || 0, ts);

    var active = pageRef && pageRef.isConnected && !document.hidden;
    var inThread = active && ui.mode === "thread" && ui.peer === peer;
    if (!inThread) thread.unread = (thread.unread || 0) + 1;

    saveState();

    if (active) {
      if (inThread) {
        renderThreadMessages();
        updateThreadBar();
      } else if (ui.mode === "tabs" && ui.tab === "chats") {
        renderHome();
      }
      renderTabs();
    }
    updateSidebar();

    if (!inThread && ts > Date.now() - 90000) {
      notifyMessage(contact, peer, isImage && !text ? "📷 Photo" : text);
    }
  }

  function notifyMessage(contact, peer, text) {
    if (!state || !state.settings.notify) return;
    var title = peer === "community"
      ? roomInfo(state.settings.room).name + " · " + displayName(contact)
      : displayName(contact);
    var body = String(text || "New message");
    if (body.length > 140) body = body.slice(0, 137) + "…";
    var open = function () {
      openPage();
      openThread(peer);
    };

    try {
      if (acodeApi && typeof acodeApi.pushNotification === "function") {
        acodeApi.pushNotification(title, body, {
          type: "info",
          autoClose: true,
          action: open
        });
        return;
      }
    } catch (e) {
      /* fall through to toast */
    }
    toastMsg(title + ": " + body, 4200);
  }

  function sendMessage() {
    if (!state || ui.mode !== "thread" || !ui.peer) return;
    var input = $root && $root.querySelector('[data-role="input"]');
    if (!input) return;
    var text = String(input.value || "").trim();
    if (!text) return;
    if (text.length > MAX_TEXT) text = text.slice(0, MAX_TEXT);

    var peer = ui.peer;
    var thread = getThread(peer, true);
    if (!thread) return;

    if (peer === "community" && isAiRoom()) {
      input.value = "";
      input.style.height = "auto";
      updateComposer();
      sendAiMessage(text, thread);
      return;
    }

    var slug = roomSlug();
    var topic = peer === "community" ? topicFor(slug) : dmTopicFor(peer);

    var message = {
      id: uid(),
      from: state.user.id,
      name: state.user.name,
      text: text,
      ts: Date.now(),
      mine: true,
      status: "sending"
    };
    thread.messages.push(message);
    thread.lastTs = message.ts;
    thread.unread = 0;

    input.value = "";
    input.style.height = "auto";
    updateComposer();
    saveState();
    renderThreadMessages(true);

    deliverMessage(peer, message, topic, slug)
      .then(function () {
        message.status = "sent";
        saveState();
        setStatus("online");
        renderThreadMessages();
        updateSidebar();
      })
      .catch(function (error) {
        message.status = "failed";
        saveState();
        setStatus("offline", error && error.message ? error.message : String(error));
        renderThreadMessages();
        updateSidebar();
        var reason = error && error.message ? error.message : "";
        if (reason && /secure key|Encryption|encrypt/i.test(reason)) {
          toastMsg(reason + " Tap the message to retry.", 5200);
        } else {
          toastMsg("Message saved on this phone but not sent. Tap it to retry.");
        }
      });
  }

  function deliverMessage(peer, message, topic, slug) {
    return buildWireEnvelope(peer, message.text || "", message.image || "", slug).then(function (envelope) {
      envelope.id = message.id;
      envelope.ts = message.ts;
      return publish(envelope, topic);
    });
  }

  function askLuckyAI(message) {
    var text = String(message == null ? "" : message).slice(0, 1000).trim();
    if (!text) return Promise.reject(new Error("Please type a question first"));
    var url = AI_ENDPOINT + encodeURIComponent(text);
    return fetchWithTimeout(url, { cache: "no-store" }, 30000)
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Lucky AI returned HTTP " + response.status);
        }
        return response.json();
      })
      .then(function (data) {
        var reply = data && (data.response || data.reply || data.answer);
        if (!reply || typeof reply !== "string") {
          throw new Error("Lucky AI sent an empty reply");
        }
        return reply.trim();
      });
  }

  function sendAiMessage(text, thread) {
    if (!state || !thread) return;
    var clean = String(text || "").slice(0, MAX_TEXT).trim();
    if (!clean) return;
    var aiKey = threadKey("community");
    var viewingAi = function () {
      return !!state && isAiRoom() && ui.mode === "thread" && ui.peer === "community";
    };

    var now = Date.now();
    thread.messages.push({
      id: uid(),
      from: state.user.id,
      name: state.user.name,
      text: clean,
      ts: now,
      mine: true,
      status: "sent"
    });
    thread.lastTs = now;
    thread.unread = 0;
    saveState();
    renderThreadMessages(true);

    ui.aiPending = (ui.aiPending || 0) + 1;
    ui.aiBusy = true;
    renderThreadMessages(true);
    updateComposer();

    askLuckyAI(clean)
      .then(function (reply) {
        var target = state && state.threads[aiKey];
        if (!target) return;
        target.messages.push({
          id: uid(),
          from: AI_ID,
          name: AI_NAME,
          text: safeText(reply, MAX_AI_TEXT),
          ts: Date.now(),
          mine: false,
          status: "sent"
        });
        target.lastTs = Date.now();
        if (!viewingAi()) target.unread = (target.unread || 0) + 1;
        saveState();
        updateSidebar();
        if ($root && pageRef && pageRef.isConnected) {
          if (viewingAi()) {
            renderThreadMessages(true);
          } else if (ui.mode === "tabs" && ui.tab === "chats") {
            renderHome();
          }
        }
      })
      .catch(function (error) {
        var target = state && state.threads[aiKey];
        if (!target) return;
        target.messages.push({
          id: uid(),
          from: AI_ID,
          name: AI_NAME,
          text: "⚠️ I could not reach Lucky AI just now." +
            (error && error.message ? " (" + String(error.message).slice(0, 120) + ")" : "") +
            "\nCheck your internet connection and try again.",
          ts: Date.now(),
          mine: false,
          status: "sent"
        });
        target.lastTs = Date.now();
        saveState();
        updateSidebar();
        if ($root && pageRef && pageRef.isConnected && viewingAi()) {
          renderThreadMessages(true);
        }
      })
      .then(function () {
        ui.aiPending = Math.max(0, (ui.aiPending || 1) - 1);
        ui.aiBusy = ui.aiPending > 0;
        if ($root && pageRef && pageRef.isConnected && viewingAi()) {
          renderThreadMessages(true);
        }
        updateComposer();
      });
  }

  function retryMessage(messageId) {
    if (!state || ui.mode !== "thread" || !ui.peer) return;
    var thread = getThread(ui.peer, false);
    if (!thread) return;
    var message = null;
    for (var i = 0; i < thread.messages.length; i += 1) {
      if (thread.messages[i].id === messageId) {
        message = thread.messages[i];
        break;
      }
    }
    if (!message || message.status === "sending") return;

    message.status = "sending";
    renderThreadMessages();
    saveState();

    if (ui.peer === "community" && isAiRoom()) {
      message.status = "sent";
      saveState();
      renderThreadMessages();
      return;
    }

    var peer = ui.peer;
    var slug = roomSlug();
    var topic = peer === "community" ? topicFor(slug) : dmTopicFor(peer);

    deliverMessage(peer, message, topic, slug)
      .then(function () {
        message.status = "sent";
        saveState();
        setStatus("online");
        renderThreadMessages();
      })
      .catch(function (error) {
        message.status = "failed";
        saveState();
        renderThreadMessages();
        setStatus("offline", error && error.message ? error.message : String(error));
        var reason = error && error.message ? error.message : "";
        if (reason && /secure key|Encryption|encrypt/i.test(reason)) {
          toastMsg(reason, 5200);
        } else {
          toastMsg("Still offline. The message is saved and can be retried.");
        }
      });
  }

  /* ------------------------------------------------------------------ *
   * UI: shell
   * ------------------------------------------------------------------ */

  function rootTemplate() {
    return '' +
      '<div class="cm-statusbar" data-role="statusbar">' +
        '<span class="cm-dot connecting" data-role="dot"></span>' +
        '<span class="cm-statustext" data-role="statustext">Connecting…</span>' +
        '<button type="button" class="cm-room" data-action="open-room" title="Change room" data-role="room">#general</button>' +
        '<button type="button" class="cm-iconbtn" data-action="sync" title="Sync now" aria-label="Sync now"><span class="icon refresh"></span></button>' +
      '</div>' +
      '<div class="cm-threadbar" data-role="threadbar" hidden>' +
        '<button type="button" class="cm-iconbtn" data-action="back" title="Back" aria-label="Back"><span class="icon arrow_back"></span></button>' +
        '<span class="cm-avatar cm-avatar-sm" data-role="threadavatar">💬</span>' +
        '<div class="cm-threadinfo">' +
          '<div class="cm-threadname" data-role="threadname">Community</div>' +
          '<div class="cm-threadsub" data-role="threadsub">#general</div>' +
        '</div>' +
        '<button type="button" class="cm-iconbtn" data-action="thread-menu" title="Chat options" aria-label="Chat options"><span class="icon more_vert"></span></button>' +
      '</div>' +
      '<div class="cm-view" data-role="view"></div>' +
      '<div class="cm-tabs" data-role="tabs">' +
        '<button type="button" class="cm-tab active" data-action="tab" data-tab="chats">' +
          '<span class="icon chat_bubble"></span><span>Chats</span>' +
          '<i class="cm-badge" data-role="unread" hidden>0</i>' +
        '</button>' +
        '<button type="button" class="cm-tab" data-action="tab" data-tab="people">' +
          '<span class="icon account_box"></span><span>People</span>' +
        '</button>' +
        '<button type="button" class="cm-tab" data-action="tab" data-tab="me">' +
          '<span class="icon person"></span><span>Me</span>' +
        '</button>' +
      '</div>' +
      '<div class="cm-composer" data-role="composer" hidden>' +
        '<input type="file" class="cm-fileinput" data-role="imagefile" accept="image/*" aria-hidden="true" tabindex="-1">' +
        '<div class="cm-composewrap">' +
          '<button type="button" class="cm-attach" data-action="pick-image" title="Send a photo" aria-label="Send a photo"><span class="icon image"></span></button>' +
          '<textarea class="cm-input" data-role="input" rows="1" maxlength="1200" placeholder="Message…" enterkeyhint="send" aria-label="Message"></textarea>' +
          '<button type="button" class="cm-send" data-action="send" title="Send" aria-label="Send"><span class="icon send"></span></button>' +
        '</div>' +
        '<div class="cm-composemeta">' +
          '<span data-role="counter"></span>' +
          '<span class="cm-hint" data-role="hint">Tap send to post</span>' +
        '</div>' +
      '</div>';
  }

  function ensureUI() {
    if ($root || !pageRef) return;
    $root = document.createElement("div");
    $root.className = "cm-app";
    $root.innerHTML = rootTemplate();
    pageRef.appendBody($root);
    if (typeof pageRef.settitle === "function") pageRef.settitle("Community");

    var tail = document.createElement("span");
    tail.className = "icon more_vert";
    tail.title = "Community settings";
    tail.setAttribute("role", "button");
    tail.addEventListener("click", function () {
      ui.tab = "me";
      ui.mode = "tabs";
      ui.peer = null;
      render();
    });
    if (pageRef.header && typeof pageRef.header.appendChild === "function") {
      pageRef.header.appendChild(tail);
    }

    $root.addEventListener("click", onClick);
    $root.addEventListener("submit", onSubmit);
    $root.addEventListener("input", onInput);
    $root.addEventListener("keydown", onKeyDown);
    $root.addEventListener("change", onChange);

    if (typeof pageRef.on === "function") {
      pageRef.on("show", function () {
        pollNow();
        render();
      });
      pageRef.on("hide", function () {
        removeThreadBackAction();
        schedulePoll(POLL_SLOW_MS);
      });
    }
  }

  function render() {
    if (!$root) return;
    renderStatus();
    renderTabs();

    var threadMode = ui.mode === "thread" && !!ui.peer;
    var view = $root.querySelector('[data-role="view"]');
    if (!view) return;

    view.className = "cm-view" + (threadMode ? " cm-view-thread" : "");
    $root.querySelector('[data-role="statusbar"]').hidden = threadMode;
    $root.querySelector('[data-role="threadbar"]').hidden = !threadMode;
    $root.querySelector('[data-role="tabs"]').hidden = threadMode;
    $root.querySelector('[data-role="composer"]').hidden = !threadMode;

    if (threadMode) {
      updateThreadBar();
      view.innerHTML = '<div class="cm-messages" data-role="messages">' + messagesHTML() + "</div>";
      var box = view.querySelector('[data-role="messages"]');
      requestAnimationFrame(function () {
        if (box) box.scrollTop = box.scrollHeight;
      });
    } else if (ui.tab === "chats") {
      view.innerHTML = chatsHTML();
    } else if (ui.tab === "people") {
      view.innerHTML = peopleHTML();
    } else {
      view.innerHTML = meHTML();
    }

    updateComposer();
  }

  function renderStatus() {
    if (!$root || !state) return;
    var dot = $root.querySelector('[data-role="dot"]');
    var text = $root.querySelector('[data-role="statustext"]');
    var room = $root.querySelector('[data-role="room"]');
    if (dot) {
      dot.className = "cm-dot " + (ui.status === "online" ? "online" : ui.status === "offline" ? "offline" : "connecting");
    }
    if (text) {
      if (ui.status === "online") {
        text.textContent = "Online · synced " + relativeTime(ui.lastSync || Date.now());
        text.title = "";
      } else if (ui.status === "offline") {
        text.textContent = "Offline · saved on this phone";
        text.title = ui.lastError || "";
      } else {
        text.textContent = "Connecting…";
        text.title = "";
      }
    }
    if (room) {
      var info = roomInfo(state.settings.room);
      room.textContent = info.emoji + " " + info.name;
      room.title = "Change room";
    }
  }

  function renderTabs() {
    if (!$root) return;
    var tabs = $root.querySelectorAll("[data-action=\"tab\"]");
    for (var i = 0; i < tabs.length; i += 1) {
      var tab = tabs[i];
      tab.classList.toggle("active", ui.mode !== "thread" && tab.dataset.tab === ui.tab);
    }
    var badge = $root.querySelector('[data-role="unread"]');
    if (badge) {
      var total = unreadTotal();
      badge.hidden = total < 1;
      badge.textContent = total > 99 ? "99+" : String(total);
    }
  }

  function updateThreadBar() {
    if (!$root || !state || !ui.peer) return;
    var bar = $root.querySelector('[data-role="threadbar"]');
    if (!bar) return;
    var avatar = $root.querySelector('[data-role="threadavatar"]');
    var name = $root.querySelector('[data-role="threadname"]');
    var sub = $root.querySelector('[data-role="threadsub"]');
    var thread = getThread(ui.peer, false);

    if (ui.peer === "community") {
      var info = roomInfo(state.settings.room);
      if (avatar) {
        avatar.textContent = info.emoji;
        avatar.style.setProperty("--cm-avatar-bg", "#6c5ce7");
      }
      if (name) name.textContent = info.name;
      if (sub) {
        if (isAiRoom()) {
          sub.innerHTML = '<span class="cm-dot online"></span>' +
            (ui.aiBusy ? "Lucky AI is typing…" : "Lucky AI · private to this phone");
        } else {
          var online = onlineCount();
          sub.innerHTML = '<span class="cm-dot online"></span>#' + escapeHTML(slugFor(state.settings.room)) +
            " · " + (online ? online + " online" : "no one else online yet") +
            (cryptoAvailable() ? " · 🔒 encrypted" : " · ⚠ unencrypted");
        }
      }
      return;
    }

    var contact = contactFor(ui.peer);
    if (avatar) {
      avatar.textContent = contact ? contact.emoji : "🙂";
      avatar.style.setProperty("--cm-avatar-bg", colorFor(ui.peer));
    }
    if (name) name.textContent = contact ? displayName(contact) : ui.peer;
    if (sub) {
      var onlineNow = isOnline(contact);
      sub.innerHTML = (onlineNow
        ? '<span class="cm-dot online"></span>online · '
        : '<span class="cm-dot"></span>offline · ') +
        (cryptoAvailable() ? "🔒 encrypted · " : "⚠ unencrypted · ") +
        escapeHTML(ui.peer);
    }

  }

  function updateComposer() {
    if (!$root || !state) return;
    var input = $root.querySelector('[data-role="input"]');
    var send = $root.querySelector('[data-action="send"]');
    var attach = $root.querySelector('[data-action="pick-image"]');
    var counter = $root.querySelector('[data-role="counter"]');
    var hint = $root.querySelector('[data-role="hint"]');
    if (!input) return;

    if (ui.mode === "thread" && ui.peer) {
      if (ui.peer === "community") {
        input.placeholder = isAiRoom()
          ? "Ask Lucky AI anything…"
          : "Message #" + slugFor(state.settings.room) + "…";
      } else {
        var contact = contactFor(ui.peer);
        input.placeholder = "Message " + (contact ? displayName(contact) : "friend") + "…";
      }
    } else {
      input.placeholder = "Message…";
    }

    if (hint) {
      if (ui.mode === "thread" && ui.peer === "community" && isAiRoom()) {
        hint.textContent = "Lucky AI replies here · stays on this phone";
      } else if (ui.mode === "thread" && ui.peer === "community") {
        hint.textContent = cryptoAvailable()
          ? "🔒 End-to-end encrypted · everyone with this room code can read it"
          : "⚠ Encryption unavailable on this device";
      } else if (ui.mode === "thread") {
        hint.textContent = cryptoAvailable()
          ? "🔒 End-to-end encrypted · only this friend can read it"
          : "⚠ Encryption unavailable on this device";
      } else {
        hint.textContent = "Tap send to post";
      }
    }

    if (attach) {
      attach.disabled = !(ui.mode === "thread" && ui.peer) ||
        (ui.peer === "community" && isAiRoom());
    }

    var length = String(input.value || "").length;
    if (send) send.disabled = !String(input.value || "").trim();
    if (counter) counter.textContent = length > 900 ? length + "/1200" : "";
  }

  /* ------------------------------------------------------------------ *
   * UI: chats list
   * ------------------------------------------------------------------ */

  function renderHome() {
    if (!$root) return;
    var view = $root.querySelector('[data-role="view"]');
    if (!view) return;
    view.innerHTML = chatsHTML();
    renderTabs();
    updateSidebar();
  }

  function chatsHTML() {
    if (!state) return "";
    var html = "";
    if (state.welcome) html += welcomeHTML();

    html += roomsHTML();

    var community = getThread("community", true);
    html += '<div class="cm-section-title">Your rooms <span>' +
      escapeHTML(roomInfo(state.settings.room).name) + "</span></div>";
    html += threadRowHTML("community", community);

    var threads = directThreads();
    if (threads.length) {
      html += '<div class="cm-section-title">Direct chats <span>' + threads.length + "</span></div>";
    }
    threads.forEach(function (thread) {
      html += threadRowHTML(thread.peer, thread);
    });

    if (!threads.length) {
      html += '<div class="cm-empty">' +
        '<span class="icon account_box"></span>' +
        'No direct chats yet.<br>Open <b>People</b> to add a friend by their Community ID.' +
        "</div>";
    }

    return '<div class="cm-list">' + html + "</div>";
  }

  function roomsHTML(showHead) {
    var current = roomSlug();
    var chips = ROOMS.map(function (room) {
      var active = room.slug === current ? " active" : "";
      return '<button type="button" class="cm-roomchip' + active + '" data-action="join-room" data-slug="' +
        escapeHTML(room.slug) + '" title="' + escapeHTML(room.desc) + '">' +
        '<span class="cm-roomchip-emoji">' + room.emoji + "</span>" +
        '<span class="cm-roomchip-name">' + escapeHTML(room.name) + "</span>" +
        "</button>";
    }).join("");
    return '<div class="cm-rooms-wrap">' +
      (showHead === false ? "" : '<div class="cm-rooms-head">Rooms</div>') +
      '<div class="cm-rooms">' + chips + "</div>" +
      "</div>";
  }

  function joinRoom(slug) {
    if (!state || !slug) return;
    var target = null;
    for (var i = 0; i < ROOMS.length; i += 1) {
      if (ROOMS[i].slug === slug) {
        target = ROOMS[i];
        break;
      }
    }
    if (!target) return;

    if (roomSlug() === target.slug) {
      openThread("community");
      return;
    }

    state.settings.room = target.slug;
    ensureCommunityThread();
    if (target.slug === "ai") ensureAiWelcome(getThread("community", true));
    ui.tab = "chats";
    ui.mode = "tabs";
    ui.peer = null;
    removeThreadBackAction();
    saveState();
    updateSidebar();
    pollNow();
    toastMsg("Joined " + target.emoji + " " + target.name);
    openThread("community");
  }

  function welcomeHTML() {
    return '<div class="cm-welcome">' +
      '<button type="button" class="cm-welcome-dismiss" data-action="dismiss-welcome" aria-label="Dismiss"><span class="icon clearclose"></span></button>' +
      "<h2>Welcome to Community 👋</h2>" +
      "<p>Your unique ID was created and saved on this phone. Share it with a friend who installed this plugin so you can chat directly.</p>" +
      "<p>Pick a room above — tap <b>AI Room</b> to chat with Lucky AI, and use the photo button to share pictures in rooms or direct chats.</p>" +
      '<div class="cm-idbox"><code>' + escapeHTML(state.user.id) + "</code>" +
      '<button type="button" class="cm-chip" data-action="copy-id">Copy</button></div>' +
      '<div class="cm-welcome-actions">' +
      '<button type="button" class="cm-btn" data-action="copy-invite">Copy invite</button>' +
      '<button type="button" class="cm-btn" data-action="tab" data-tab="people">Find people</button>' +
      "</div></div>";
  }

  function threadRowHTML(peer, thread) {
    var isCommunity = peer === "community";
    var info = isCommunity ? roomInfo(state.settings.room) : null;
    var contact = isCommunity ? null : contactFor(peer);
    var name = isCommunity ? info.name : (contact ? displayName(contact) : peer);
    var avatar = isCommunity ? info.emoji : (contact ? contact.emoji : "🙂");
    var color = isCommunity ? "#6c5ce7" : colorFor(peer);
    var online = !isCommunity && isOnline(contact);
    var unread = thread ? thread.unread || 0 : 0;
    var lastTs = thread ? thread.lastTs || 0 : 0;

    return '<div class="cm-row' + (isCommunity ? " cm-row-room" : "") +
      '" role="button" tabindex="0" data-action="open-thread" data-peer="' + escapeHTML(peer) + '">' +
      '<span class="cm-avatar-wrap">' +
        '<span class="cm-avatar" style="--cm-avatar-bg:' + color + '">' + escapeHTML(avatar) + "</span>" +
        (online ? '<span class="cm-online-dot"></span>' : "") +
      "</span>" +
      '<span class="cm-rowmain">' +
        '<span class="cm-rownames">' +
          '<span class="cm-rowname">' + escapeHTML(name) + "</span>" +
          '<span class="cm-rowtime">' + escapeHTML(formatListTime(lastTs)) + "</span>" +
        "</span>" +
        '<span class="cm-rowpreview">' + escapeHTML(previewText(thread, peer)) + "</span>" +
      "</span>" +
      (unread > 0 ? '<span class="cm-badge">' + (unread > 99 ? "99+" : unread) + "</span>" : "") +
      "</div>";
  }

  function previewText(thread, peer) {
    if (!thread || !thread.messages.length) {
      if (peer === "community") return roomInfo(state.settings.room).desc;
      return "No messages yet — say hi!";
    }
    var last = thread.messages[thread.messages.length - 1];
    var text = String(last.text || "").replace(/\s+/g, " ").trim();
    if (text.length > 74) text = text.slice(0, 72) + "…";
    var prefix = "";
    if (last.mine) prefix = "You: ";
    else if (peer === "community") {
      prefix = last.from === AI_ID ? "Lucky AI: " : (last.name || "Someone") + ": ";
    }
    if (last.image && text === "📷 Photo") {
      return prefix + "📷 Photo";
    }
    if (last.image) {
      return prefix + "📷 " + text;
    }
    return prefix + text;
  }

  /* ------------------------------------------------------------------ *
   * UI: messages
   * ------------------------------------------------------------------ */

  function renderThreadMessages(forceBottom) {
    if (!$root) return;
    var box = $root.querySelector('[data-role="messages"]');
    if (!box) return;
    var nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 110;
    box.innerHTML = messagesHTML();
    if (forceBottom || nearBottom) {
      requestAnimationFrame(function () {
        box.scrollTop = box.scrollHeight;
      });
    }
    updateComposer();
  }

  function messagesHTML() {
    if (!state || !ui.peer) return "";
    var thread = getThread(ui.peer, false);
    if (!thread || !thread.messages.length) {
      return emptyThreadHTML() + (isAiRoom() && ui.peer === "community" ? typingHTML() : "");
    }

    var html = "";
    var previousDay = "";
    thread.messages.forEach(function (message) {
      var key = dayKey(message.ts);
      if (key !== previousDay) {
        html += '<div class="cm-day">' + escapeHTML(formatDay(message.ts)) + "</div>";
        previousDay = key;
      }
      html += messageHTML(message);
    });
    if (isAiRoom() && ui.peer === "community" && ui.aiBusy) {
      html += typingHTML();
    }
    return html;
  }

  function formatMessageText(value) {
    var out = escapeHTML(value);
    out = out.replace(/`([^`\n]+)`/g, "<code>$1</code>");
    out = out.replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>");
    return out.replace(/\n/g, "<br>");
  }

  function typingHTML() {
    return '<div class="cm-msg theirs cm-msg-ai cm-typing">' +
      '<span class="cm-avatar cm-avatar-xs" style="--cm-avatar-bg:#e17055">🤖</span>' +
      '<div class="cm-bubblewrap">' +
        '<div class="cm-msgname">Lucky AI</div>' +
        '<div class="cm-bubble cm-typing-bubble"><span></span><span></span><span></span></div>' +
      "</div></div>";
  }

  function messageHTML(message) {
    var mine = !!message.mine;
    var isAi = message.from === AI_ID;
    var contact = contactFor(message.from);
    var name = message.name || (isAi ? AI_NAME : (contact ? displayName(contact) : "Someone"));
    var emoji = isAi ? "🤖" : (contact ? contact.emoji : emojiFor(message.from));
    var color = isAi ? "#e17055" : colorFor(message.from);

    var status = "";
    if (mine) {
      if (message.status === "failed") {
        status = '<button type="button" class="cm-retry" data-action="retry" data-id="' +
          escapeHTML(message.id) + '">Tap to retry</button>';
      } else if (message.status === "sending") {
        status = '<span class="cm-msgstatus sending">◷</span>';
      } else {
        status = '<span class="cm-msgstatus sent">✓</span>';
      }
    }

    var showAuthor = !mine && (ui.peer === "community" || isAi);
    var avatar = showAuthor
      ? '<span class="cm-avatar cm-avatar-xs" style="--cm-avatar-bg:' + color + '">' +
        escapeHTML(emoji) + "</span>"
      : "";
    var author = showAuthor
      ? '<div class="cm-msgname">' + escapeHTML(name) + "</div>"
      : "";

    var bubble = "";
    if (message.image) {
      bubble += '<button type="button" class="cm-imagebtn" data-action="view-image" data-id="' +
        escapeHTML(message.id) + '" aria-label="Open photo">' +
        '<img class="cm-image" src="' + escapeHTML(message.image) + '" alt="Shared photo" loading="lazy">' +
        "</button>";
    }
    if (message.text && !(message.image && message.text === "📷 Photo")) {
      bubble += '<div class="cm-text">' + formatMessageText(message.text) + "</div>";
    }
    if (!bubble) bubble = '<div class="cm-text">📷 Photo</div>';

    return '<div class="cm-msg ' + (mine ? "mine" : "theirs") +
      (isAi ? " cm-msg-ai" : "") + '" data-msg-id="' +
      escapeHTML(message.id) + '">' + avatar +
      '<div class="cm-bubblewrap">' + author +
        '<div class="cm-bubble' + (message.image ? " cm-bubble-media" : "") + '">' + bubble + "</div>" +
        '<div class="cm-msgmeta"><span>' + escapeHTML(formatClock(message.ts)) + "</span>" + status + "</div>" +
      "</div></div>";
  }

  function emptyThreadHTML() {
    if (!ui.peer) return "";
    if (ui.peer === "community") {
      var info = roomInfo(state.settings.room);
      var extra = isAiRoom()
        ? "Ask Lucky AI a question below — it replies here privately on this phone."
        : "No messages in this room yet. Say hello — anyone using this room will see it.";
      return '<div class="cm-thread-empty">' +
        '<span class="cm-avatar cm-avatar-lg" style="--cm-avatar-bg:#6c5ce7">' + info.emoji + "</span>" +
        "<h3>" + escapeHTML(info.name) + "</h3>" +
        "<p>" + escapeHTML(extra) + "</p>" +
        "</div>";
    }
    var contact = contactFor(ui.peer);
    return '<div class="cm-thread-empty">' +
      '<span class="cm-avatar cm-avatar-lg" style="--cm-avatar-bg:' + colorFor(ui.peer) + '">' +
      escapeHTML(contact ? contact.emoji : "🙂") + "</span>" +
      "<h3>" + escapeHTML(contact ? displayName(contact) : ui.peer) + "</h3>" +
      "<p>This is the beginning of your direct chat. Say hi 👋</p>" +
      "</div>";
  }

  /* ------------------------------------------------------------------ *
   * UI: people
   * ------------------------------------------------------------------ */

  function peopleHTML() {
    if (!state) return "";
    var contacts = Object.keys(state.contacts).map(function (id) {
      return state.contacts[id];
    });
    contacts.sort(function (a, b) {
      var onlineDiff = (isOnline(b) ? 1 : 0) - (isOnline(a) ? 1 : 0);
      if (onlineDiff) return onlineDiff;
      return displayName(a).localeCompare(displayName(b));
    });

    var list = contacts.map(contactRowHTML).join("");
    if (!list) {
      list = '<div class="cm-empty">' +
        '<span class="icon account_box"></span>' +
        "No one here yet.<br>Add a friend by their <b>CM-XXXX-XXXX</b> ID, or say hello in the community room so people appear automatically." +
        "</div>";
    }

    return '<div class="cm-card">' +
        '<div class="cm-profile">' +
          '<span class="cm-avatar cm-avatar-lg" style="--cm-avatar-bg:' + colorFor(state.user.id) + '">' +
            escapeHTML(state.user.emoji) + "</span>" +
          '<div class="cm-profile-main">' +
            '<div class="cm-profile-name">' + escapeHTML(state.user.name) + "</div>" +
            '<div class="cm-profile-sub">This is you</div>' +
          "</div>" +
          '<button type="button" class="cm-chip" data-action="copy-id">Copy ID</button>' +
        "</div>" +
        '<div class="cm-idbox"><code>' + escapeHTML(state.user.id) + "</code></div>" +
        '<p class="cm-card-p">Share your invite so a friend can add you. It includes your secure key so direct chats can be encrypted from the first message.</p>' +
      "</div>" +

      '<div class="cm-card">' +
        '<h3>Add a friend</h3>' +
        '<form data-form="add-contact" autocomplete="off">' +
          '<label class="cm-label" for="cm-add-id">Their Community ID</label>' +
          '<input class="cm-input" id="cm-add-id" name="id" type="text" placeholder="CM-XXXX-XXXX or paste an invite" autocapitalize="characters" spellcheck="false">' +
          '<label class="cm-label" for="cm-add-name">Nickname (optional)</label>' +
          '<input class="cm-input" id="cm-add-name" name="name" type="text" placeholder="e.g. Alex" maxlength="40">' +
          '<div class="cm-button-row"><button type="submit" class="cm-btn primary">Add contact</button></div>' +
        "</form>" +
      "</div>" +

      '<div class="cm-section-title">People you know <span>' + contacts.length + "</span></div>" +
      '<div class="cm-list">' + list + "</div>";
  }

  function contactRowHTML(contact) {
    var online = isOnline(contact);
    var sub = online
      ? "Online now"
      : (contact.lastSeen ? "Seen " + relativeTime(contact.lastSeen) : "Not seen yet");

    return '<div class="cm-row" role="button" tabindex="0" data-action="open-thread" data-peer="' +
      escapeHTML(contact.id) + '">' +
      '<span class="cm-avatar-wrap">' +
        '<span class="cm-avatar" style="--cm-avatar-bg:' + colorFor(contact.id) + '">' +
          escapeHTML(contact.emoji) + "</span>" +
        (online ? '<span class="cm-online-dot"></span>' : "") +
      "</span>" +
      '<span class="cm-rowmain">' +
        '<span class="cm-rownames"><span class="cm-rowname">' + escapeHTML(displayName(contact)) + "</span></span>" +
        '<span class="cm-rowpreview">' + escapeHTML(sub) + " · " + escapeHTML(contact.id) + "</span>" +
      "</span>" +
      '<span class="cm-rowactions">' +
        '<button type="button" class="cm-iconbtn" data-action="open-thread" data-peer="' +
          escapeHTML(contact.id) + '" title="Chat"><span class="icon chat_bubble"></span></button>' +
        '<button type="button" class="cm-iconbtn" data-action="remove-contact" data-id="' +
          escapeHTML(contact.id) + '" title="Remove contact"><span class="icon delete"></span></button>' +
      "</span>" +
      "</div>";
  }

  /* ------------------------------------------------------------------ *
   * UI: settings / me
   * ------------------------------------------------------------------ */

  function meHTML() {
    if (!state) return "";
    var statusText = ui.status === "online"
      ? "Online"
      : (ui.status === "offline" ? "Offline — check your internet connection" : "Connecting");
    var lastSync = ui.lastSync ? relativeTime(ui.lastSync) : "not yet";

    return '<div class="cm-card">' +
        '<h3>Your profile</h3>' +
        '<div class="cm-profile">' +
          '<span class="cm-avatar cm-avatar-lg" style="--cm-avatar-bg:' + colorFor(state.user.id) + '">' +
            escapeHTML(state.user.emoji) + "</span>" +
          '<div class="cm-profile-main">' +
            '<div class="cm-profile-name">' + escapeHTML(state.user.name) + "</div>" +
            '<div class="cm-profile-sub">Tap “Change avatar” to pick a new one</div>' +
          "</div>" +
          '<button type="button" class="cm-chip" data-action="avatar-next">Change avatar</button>' +
        "</div>" +
        '<label class="cm-label" for="cm-name">Display name</label>' +
        '<div class="cm-inline">' +
          '<input class="cm-input" id="cm-name" data-role="nameinput" type="text" maxlength="40" value="' + escapeHTML(state.user.name) + '">' +
          '<button type="button" class="cm-btn primary" data-action="save-name">Save</button>' +
        "</div>" +
      "</div>" +

      '<div class="cm-card">' +
        "<h3>Your unique ID</h3>" +
        '<div class="cm-idbox"><code>' + escapeHTML(state.user.id) + "</code>" +
          '<button type="button" class="cm-chip" data-action="copy-id">Copy</button></div>' +
        '<p>This ID was generated once on this phone and is saved locally. It is how friends find you. Keep a backup if you reinstall Acode.</p>' +
        '<div class="cm-button-row">' +
          '<button type="button" class="cm-btn" data-action="copy-invite">Copy invite message</button>' +
        "</div>" +
      "</div>" +

      '<div class="cm-card">' +
        "<h3>Community rooms</h3>" +
        roomsHTML(false) +
        '<div class="cm-inline">' +
          '<span class="cm-hash">#</span>' +
          '<input class="cm-input" data-role="roominput" type="text" maxlength="32" value="' + escapeHTML(state.settings.room) + '" spellcheck="false">' +
          '<button type="button" class="cm-btn primary" data-action="save-room">Join</button>' +
        "</div>" +
        "<p>Pick a preset room above or type your own room code. Everyone who wants to chat together must use the same room code.</p>" +
        '<div class="cm-button-row"><button type="button" class="cm-btn" data-action="copy-room">Copy room code</button></div>' +
      "</div>" +

      '<div class="cm-card">' +
        "<h3>Notifications</h3>" +
        '<label class="cm-toggle">' +
          '<input type="checkbox" data-role="notify" ' + (state.settings.notify ? "checked" : "") + '>' +
          "<span>Notify me when a new message arrives</span>" +
        "</label>" +
      "</div>" +

      '<details class="cm-card">' +
        "<summary>Advanced connection</summary>" +
        '<label class="cm-label" for="cm-relay">Relay server</label>' +
        '<div class="cm-inline">' +
          '<input class="cm-input" id="cm-relay" data-role="relayinput" type="text" value="' + escapeHTML(state.settings.relay) + '" spellcheck="false">' +
          '<button type="button" class="cm-btn primary" data-action="save-relay">Save</button>' +
        "</div>" +
        "<p>The default relay is ntfy.sh. Only change this if you have a compatible self-hosted relay. Changing it clears the sync position.</p>" +
      "</details>" +

      '<div class="cm-card">' +
        "<h3>Data</h3>" +
        '<div class="cm-button-row">' +
          '<button type="button" class="cm-btn" data-action="export">Export backup</button>' +
          '<button type="button" class="cm-btn" data-action="import">Import backup</button>' +
        "</div>" +
        '<div class="cm-button-row">' +
          '<button type="button" class="cm-btn danger" data-action="clear-chats">Clear all messages</button>' +
          '<button type="button" class="cm-btn danger" data-action="reset-id">Reset my identity</button>' +
        "</div>" +
      "</div>" +

      '<div class="cm-card">' +
        "<h3>About</h3>" +
        '<p class="cm-muted">Community Chat v' + VERSION + " · Status: " + escapeHTML(statusText) +
          " · Last sync: " + escapeHTML(lastSync) + "</p>" +
        '<p class="cm-muted">🔒 End-to-end encrypted. Room messages use AES-256-GCM with a key derived from the room code. Direct messages use ECDH P-256 key exchange plus AES-256-GCM, so only you and your friend can read them. The relay stores ciphertext, not your messages.</p>' +
        '<p class="cm-muted">Your private key stays on this phone and is only included in backups you export. Keep a backup if you reinstall Acode. Preset rooms use public room codes, so create your own private room code for sensitive chats. Lucky AI chat stays on this phone.</p>' +
        (ui.lastError ? '<p class="cm-muted">Last connection error: ' + escapeHTML(ui.lastError) + "</p>" : "") +
      "</div>";
  }

  /* ------------------------------------------------------------------ *
   * UI: sidebar app
   * ------------------------------------------------------------------ */

  function renderSidebar() {
    if (!sidebarEl || !state) return;
    var online = onlineCount();
    var unread = unreadTotal();
    sidebarEl.innerHTML = '<div class="cm-side">' +
      '<div class="cm-side-title"><span class="icon chat_bubble"></span>Community</div>' +
      '<div class="cm-side-user">' +
        '<span class="cm-avatar cm-avatar-sm" style="--cm-avatar-bg:' + colorFor(state.user.id) + '">' +
          escapeHTML(state.user.emoji) + "</span>" +
        "<div style=\"min-width:0;flex:1 1 auto\">" +
          "<b>" + escapeHTML(state.user.name) + "</b>" +
          "<small>" + escapeHTML(state.user.id) + "</small>" +
        "</div>" +
      "</div>" +
      '<button type="button" class="cm-side-btn" data-side-action="open">Open chat</button>' +
      '<div class="cm-side-stats">' +
        escapeHTML(roomInfo(state.settings.room).emoji + " " + roomInfo(state.settings.room).name) +
        " · " + online + " online" +
        (unread ? " · " + unread + " unread" : "") +
      "</div>" +
      '<button type="button" class="cm-side-link" data-side-action="community">Go to the community room →</button>' +
      "</div>";
  }

  function updateSidebar() {
    renderSidebar();
  }

  function onSidebarClick(event) {
    var target = event.target.closest ? event.target.closest("[data-side-action]") : null;
    if (!target) return;
    var action = target.dataset.sideAction;
    if (action === "open") {
      openPage();
    } else if (action === "community") {
      openPage();
      setTimeout(function () {
        openThread("community");
      }, 40);
    }
  }

  /* ------------------------------------------------------------------ *
   * UI: navigation
   * ------------------------------------------------------------------ */

  function openPage(tab) {
    ensureUI();
    if (!pageRef) return;
    if (tab) {
      ui.tab = tab;
      ui.mode = "tabs";
      ui.peer = null;
    }
    if (!pageRef.isConnected && typeof pageRef.show === "function") {
      pageRef.show();
    }
    if (ui.mode === "thread" && ui.peer) pushThreadBackAction();
    render();
    pollNow();
  }

  function switchTab(tab) {
    if (!state || !tab) return;
    ui.tab = tab;
    ui.mode = "tabs";
    ui.peer = null;
    removeThreadBackAction();
    render();
  }

  function openThread(peer, fromNotification) {
    if (!state) return;
    if (peer !== "community") {
      peer = normalizeId(peer);
      if (!peer) return;
    }
    ensureUI();
    if (!pageRef) return;
    if (!pageRef.isConnected && typeof pageRef.show === "function") {
      pageRef.show();
    }

    ui.mode = "thread";
    ui.peer = peer;
    ui.tab = "chats";

    var thread = getThread(peer, true);
    if (thread) {
      thread.unread = 0;
      if (peer === "community" && isAiRoom()) ensureAiWelcome(thread);
    }
    saveState();

    pushThreadBackAction();
    render();
    updateSidebar();

    if (!fromNotification) {
      var fine = false;
      try {
        fine = window.matchMedia && window.matchMedia("(pointer: fine)").matches;
      } catch (e) {
        fine = false;
      }
      if (fine) {
        setTimeout(function () {
          var input = $root && $root.querySelector('[data-role="input"]');
          if (input) input.focus();
        }, 220);
      }
    }
  }

  function closeThread() {
    ui.mode = "tabs";
    ui.peer = null;
    removeThreadBackAction();
    render();
    updateSidebar();
  }

  function pushThreadBackAction() {
    var actionStack = safeRequire("actionStack");
    if (!actionStack) return;
    try {
      actionStack.remove(THREAD_ACTION_ID);
      actionStack.push({
        id: THREAD_ACTION_ID,
        action: closeThread
      });
    } catch (e) {
      /* ignore */
    }
  }

  function removeThreadBackAction() {
    var actionStack = safeRequire("actionStack");
    if (!actionStack) return;
    try {
      actionStack.remove(THREAD_ACTION_ID);
    } catch (e) {
      /* ignore */
    }
  }

  /* ------------------------------------------------------------------ *
   * Events
   * ------------------------------------------------------------------ */

  function onClick(event) {
    var target = event.target.closest ? event.target.closest("[data-action]") : null;
    if (!target) return;
    var action = target.dataset.action;

    if (action === "tab") {
      switchTab(target.dataset.tab);
    } else if (action === "open-thread") {
      openThread(target.dataset.peer);
    } else if (action === "back") {
      closeThread();
    } else if (action === "sync") {
      setStatus("connecting");
      pollNow();
      toastMsg("Checking for new messages…", 1600);
    } else if (action === "open-room") {
      switchTab("me");
      setTimeout(focusRoomInput, 160);
    } else if (action === "copy-id") {
      copyId();
    } else if (action === "copy-invite") {
      copyInvite();
    } else if (action === "copy-room") {
      copyRoom();
    } else if (action === "dismiss-welcome") {
      state.welcome = false;
      saveState();
      render();
      updateSidebar();
    } else if (action === "join-room") {
      joinRoom(target.dataset.slug);
    } else if (action === "pick-image") {
      pickImage();
    } else if (action === "view-image") {
      openImageModal(target.dataset.id);
    } else if (action === "send") {
      sendMessage();
    } else if (action === "retry") {
      retryMessage(target.dataset.id);
    } else if (action === "avatar-next") {
      nextAvatar();
    } else if (action === "save-name") {
      saveName();
    } else if (action === "save-room") {
      saveRoom();
    } else if (action === "save-relay") {
      saveRelay();
    } else if (action === "remove-contact") {
      removeContact(target.dataset.id);
    } else if (action === "thread-menu") {
      threadMenu();
    } else if (action === "export") {
      exportModal();
    } else if (action === "import") {
      importModal();
    } else if (action === "clear-chats") {
      clearAllChats();
    } else if (action === "reset-id") {
      resetIdentity();
    } else if (action === "close-modal") {
      closeModal();
    }
  }

  function onSubmit(event) {
    var form = event.target.closest ? event.target.closest("[data-form]") : null;
    if (!form) return;
    event.preventDefault();
    if (form.dataset.form === "add-contact") {
      addContactFromForm(form);
    }
  }

  function onInput(event) {
    var input = event.target;
    if (!input || input.dataset.role !== "input") return;
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 126) + "px";
    updateComposer();
  }

  function onChange(event) {
    var input = event.target;
    if (!input || input.dataset.role !== "imagefile") return;
    var file = input.files && input.files[0];
    input.value = "";
    if (file) processImageFile(file);
  }

  function onKeyDown(event) {
    if (event.key === "Escape" && ui.modal) {
      closeModal();
      return;
    }
    if (event.target && event.target.dataset && event.target.dataset.role === "input") {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        sendMessage();
      }
    }
  }

  /* ------------------------------------------------------------------ *
   * Images
   * ------------------------------------------------------------------ */

  function pickImage() {
    if (!state || ui.mode !== "thread" || !ui.peer) return;
    if (ui.peer === "community" && isAiRoom()) {
      toastMsg("Lucky AI reads text only. Share photos in the other rooms or direct chats.");
      return;
    }
    var input = $root && $root.querySelector('[data-role="imagefile"]');
    if (input) input.click();
  }

  function readFileAsDataURL(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        resolve(String(reader.result || ""));
      };
      reader.onerror = function () {
        reject(new Error("Could not read that image"));
      };
      reader.readAsDataURL(file);
    });
  }

  function compressImage(dataUrl) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        try {
          var width = Number(img.width) || 0;
          var height = Number(img.height) || 0;
          if (!width || !height) {
            reject(new Error("That image could not be opened"));
            return;
          }
          var scale = Math.min(1, 1280 / Math.max(width, height));
          width = Math.max(1, Math.round(width * scale));
          height = Math.max(1, Math.round(height * scale));

          var canvas = document.createElement("canvas");
          var ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Image tools are not available"));
            return;
          }

          var quality = 0.82;
          var out = "";
          for (var i = 0; i < 12; i += 1) {
            canvas.width = width;
            canvas.height = height;
            ctx = canvas.getContext("2d");
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            out = canvas.toDataURL("image/jpeg", quality);
            if (out.length <= MAX_IMAGE_CHARS) break;
            if (quality > 0.52) {
              quality -= 0.12;
            } else {
              width = Math.max(1, Math.round(width * 0.72));
              height = Math.max(1, Math.round(height * 0.72));
              quality = 0.7;
            }
          }
          if (!out || out.length > MAX_IMAGE_CHARS) {
            reject(new Error("That photo is still too large. Try a smaller one."));
            return;
          }
          resolve(out);
        } catch (e) {
          reject(new Error("Could not prepare that image"));
        }
      };
      img.onerror = function () {
        reject(new Error("Could not open that image"));
      };
      img.src = dataUrl;
    });
  }

  function processImageFile(file) {
    if (!file) return;
    var looksLikeImage = /^image\//i.test(file.type || "") ||
      /\.(png|jpe?g|gif|webp|bmp)$/i.test(file.name || "");
    if (!looksLikeImage) {
      toastMsg("Please choose a photo or image file");
      return;
    }
    if (file.size > 15000000) {
      toastMsg("That photo is too big. Choose one under 15 MB.");
      return;
    }
    toastMsg("Preparing photo…", 1800);
    readFileAsDataURL(file)
      .then(compressImage)
      .then(function (dataUrl) {
        sendImage(dataUrl);
      })
      .catch(function (error) {
        toastMsg(error && error.message ? error.message : "Could not add that image");
      });
  }

  function sendImage(dataUrl) {
    if (!state || ui.mode !== "thread" || !ui.peer) return;
    if (ui.peer === "community" && isAiRoom()) {
      toastMsg("Lucky AI reads text only. Share photos in the other rooms or direct chats.");
      return;
    }
    var image = sanitizeImage(dataUrl);
    if (!image) {
      toastMsg("That image is too large. Try a smaller photo.");
      return;
    }

    var peer = ui.peer;
    var thread = getThread(peer, true);
    if (!thread) return;

    var now = Date.now();
    var slug = roomSlug();
    var topic = peer === "community" ? topicFor(slug) : dmTopicFor(peer);
    var message = {
      id: uid(),
      from: state.user.id,
      name: state.user.name,
      text: "",
      image: image,
      ts: now,
      mine: true,
      status: "sending"
    };
    thread.messages.push(message);
    thread.lastTs = now;
    thread.unread = 0;
    saveState();
    renderThreadMessages(true);

    deliverMessage(peer, message, topic, slug)
      .then(function () {
        message.status = "sent";
        saveState();
        setStatus("online");
        renderThreadMessages();
        updateSidebar();
      })
      .catch(function (error) {
        message.status = "failed";
        saveState();
        setStatus("offline", error && error.message ? error.message : String(error));
        renderThreadMessages();
        updateSidebar();
        var reason = error && error.message ? error.message : "";
        if (reason && /secure key|Encryption|encrypt/i.test(reason)) {
          toastMsg(reason + " Tap the photo to retry.", 5200);
        } else {
          toastMsg("Photo saved on this phone but not sent. Tap it to retry.");
        }
      });
  }

  function findMessage(messageId) {
    if (!state || !ui.peer) return null;
    var thread = getThread(ui.peer, false);
    if (!thread) return null;
    for (var i = 0; i < thread.messages.length; i += 1) {
      if (thread.messages[i].id === messageId) return thread.messages[i];
    }
    return null;
  }

  function openImageModal(messageId) {
    var message = findMessage(messageId);
    if (!message || !message.image) return;
    var modal = openModal("Photo");
    modal.body.innerHTML = '<div class="cm-photo-view"><img src="' +
      escapeHTML(message.image) + '" alt="Shared photo"></div>' +
      (message.text && message.text !== "📷 Photo"
        ? '<p class="cm-muted">' + formatMessageText(message.text) + "</p>"
        : "");
    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "cm-btn";
    closeBtn.textContent = "Close";
    closeBtn.onclick = function () {
      modal.close();
    };
    modal.actions.appendChild(closeBtn);
  }

  /* ------------------------------------------------------------------ *
   * Contact actions
   * ------------------------------------------------------------------ */

  function addContactFromForm(form) {
    if (!state) return;
    var idInput = form.querySelector('[name="id"]');
    var nameInput = form.querySelector('[name="name"]');
    var raw = String(idInput ? idInput.value : "");
    var id = normalizeId(raw);
    if (!id) {
      var idMatch = raw.match(/CM-[A-Z0-9]{4}-[A-Z0-9]{4}/i);
      if (idMatch) id = normalizeId(idMatch[0]);
    }
    if (!id) {
      toastMsg("Enter a valid ID like CM-ABCD-1234");
      if (idInput) idInput.focus();
      return;
    }
    if (id === state.user.id) {
      toastMsg("That is your own ID 🙂");
      return;
    }

    var keyMatch = raw.match(/(?:secure\s+key|key)\s*:\s*([A-Za-z0-9+/=]{60,300})/i);
    var publicKey = keyMatch ? cleanPublicKey(keyMatch[1]) : "";

    var existing = !!state.contacts[id];
    var alias = cleanName(nameInput ? nameInput.value : "");
    var contact = upsertContact(id, null, null, false);
    if (!contact) return;
    contact.auto = false;
    contact.alias = alias;
    if (alias) contact.name = alias;
    if (publicKey) {
      contact.publicKey = publicKey;
      delete dmKeyPromises[id];
    }
    if (nameInput) nameInput.value = "";
    if (idInput) idInput.value = "";

    saveState();
    render();
    updateSidebar();
    toastMsg(existing ? "Contact updated" : "Contact added");
  }

  function removeContact(id) {
    if (!state) return;
    var contactId = normalizeId(id);
    var contact = contactFor(contactId);
    if (!contact) return;

    confirmDialog(
      "Remove contact",
      "Remove " + displayName(contact) + " (" + contactId + ")? Their messages on this phone will be deleted too.",
      "Remove",
      function () {
        delete state.contacts[contactId];
        Object.keys(state.threads).forEach(function (key) {
          if (state.threads[key] && state.threads[key].peer === contactId) {
            delete state.threads[key];
          }
        });
        if (ui.peer === contactId) {
          ui.mode = "tabs";
          ui.peer = null;
          removeThreadBackAction();
        }
        saveState();
        render();
        updateSidebar();
        toastMsg("Contact removed");
      },
      true
    );
  }

  /* ------------------------------------------------------------------ *
   * Profile / settings actions
   * ------------------------------------------------------------------ */

  function copyId() {
    if (!state) return;
    copyText(state.user.id).then(function (ok) {
      toastMsg(ok ? "Your Community ID was copied" : "Could not copy — select the ID manually");
    });
  }

  function copyInvite() {
    if (!state) return;
    ensureIdentityKeys().then(function () {
      var keyLine = state.crypto && state.crypto.publicKey
        ? "\nSecure key: " + state.crypto.publicKey
        : "";
      var text = "Chat with me on Acode Community!\n\n" +
        "My ID: " + state.user.id + "\n" +
        "Room: " + roomInfo(state.settings.room).name + " (#" + slugFor(state.settings.room) + ")" +
        keyLine + "\n\n" +
        "Install the Community Chat plugin in Acode, open People → Add contact and paste this whole message.";
      return copyText(text);
    }).then(function (ok) {
      toastMsg(ok ? "Invite copied" : "Could not copy the invite");
    }, function () {
      toastMsg("Could not copy the invite");
    });
  }

  function copyRoom() {
    if (!state) return;
    copyText(state.settings.room).then(function (ok) {
      toastMsg(ok ? "Room code copied" : "Could not copy the room code");
    });
  }

  function nextAvatar() {
    if (!state) return;
    var index = AVATARS.indexOf(state.user.emoji);
    state.user.emoji = AVATARS[(index + 1 + AVATARS.length) % AVATARS.length];
    saveState();
    publishPresence();
    render();
    updateSidebar();
  }

  function saveName() {
    if (!state || !$root) return;
    var input = $root.querySelector('[data-role="nameinput"]');
    var name = cleanName(input ? input.value : "");
    if (!name) {
      toastMsg("Please enter a display name");
      if (input) input.focus();
      return;
    }
    state.user.name = name;
    saveState();
    publishPresence();
    render();
    updateSidebar();
    toastMsg("Name saved");
  }

  function saveRoom() {
    if (!state || !$root) return;
    var input = $root.querySelector('[data-role="roominput"]');
    var room = cleanRoom(input ? input.value : "");
    if (!room) {
      toastMsg("Enter a room code, for example general");
      if (input) input.focus();
      return;
    }
    if (slugFor(room) === roomSlug()) {
      state.settings.room = room;
      saveState();
      render();
      toastMsg("You are already in #" + room);
      return;
    }

    state.settings.room = room;
    ensureCommunityThread();
    if (isAiRoom()) ensureAiWelcome(getThread("community", true));
    ui.tab = "chats";
    ui.mode = "tabs";
    ui.peer = null;
    removeThreadBackAction();
    saveState();
    render();
    updateSidebar();
    pollNow();
    toastMsg("Joined #" + room);
  }

  function saveRelay() {
    if (!state || !$root) return;
    var input = $root.querySelector('[data-role="relayinput"]');
    var relay = cleanRelay(input ? input.value : "");
    if (!relay) {
      toastMsg("Enter a full http:// or https:// relay URL");
      if (input) input.focus();
      return;
    }
    state.settings.relay = relay;
    state.cursors = {};
    state.dmCursor = null;
    saveState();
    render();
    pollNow();
    toastMsg("Relay updated");
  }

  function focusRoomInput() {
    if (!$root) return;
    var input = $root.querySelector('[data-role="roominput"]');
    if (input) {
      input.focus();
      try {
        input.select();
      } catch (e) {
        /* ignore */
      }
    }
  }

  /* ------------------------------------------------------------------ *
   * Thread actions
   * ------------------------------------------------------------------ */

  function threadMenu() {
    if (!state || !ui.peer) return;
    if (ui.peer === "community") {
      switchTab("me");
      setTimeout(focusRoomInput, 160);
      return;
    }

    var peer = ui.peer;
    var contact = contactFor(peer);
    var modal = openModal("Chat options");
    modal.body.innerHTML = '<div class="cm-profile">' +
      '<span class="cm-avatar cm-avatar-lg" style="--cm-avatar-bg:' + colorFor(peer) + '">' +
        escapeHTML(contact ? contact.emoji : "🙂") + "</span>" +
      '<div class="cm-profile-main">' +
        '<div class="cm-profile-name">' + escapeHTML(contact ? displayName(contact) : peer) + "</div>" +
        '<div class="cm-profile-sub">' + escapeHTML(peer) + " · " +
          (isOnline(contact) ? "online" : "offline") + "</div>" +
      "</div></div>" +
      '<p class="cm-muted">Direct messages are delivered through the public relay and are only shown on phones that have the plugin and know your ID.</p>';

    var copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "cm-btn";
    copyBtn.textContent = "Copy ID";
    copyBtn.onclick = function () {
      copyText(peer).then(function (ok) {
        toastMsg(ok ? "ID copied" : "Could not copy the ID");
      });
    };

    var clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "cm-btn";
    clearBtn.textContent = "Clear chat";
    clearBtn.onclick = function () {
      modal.close();
      confirmClearThread(peer);
    };

    var removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "cm-btn danger";
    removeBtn.textContent = "Remove contact";
    removeBtn.onclick = function () {
      modal.close();
      removeContact(peer);
    };

    modal.actions.appendChild(copyBtn);
    modal.actions.appendChild(clearBtn);
    modal.actions.appendChild(removeBtn);
  }

  function confirmClearThread(peer) {
    if (!state) return;
    confirmDialog(
      "Clear chat",
      "Delete all messages in this chat from this phone? The other person keeps their copy.",
      "Clear chat",
      function () {
        var key = threadKey(peer);
        delete state.threads[key];
        if (peer === "community") {
          ensureCommunityThread();
          if (isAiRoom()) ensureAiWelcome(getThread("community", true));
        }
        if (ui.peer === peer && !state.threads[key]) {
          ui.mode = "tabs";
          ui.peer = null;
          removeThreadBackAction();
        }
        saveState();
        render();
        updateSidebar();
        toastMsg("Chat cleared");
      },
      true
    );
  }

  function clearAllChats() {
    if (!state) return;
    confirmDialog(
      "Clear all messages",
      "Delete every chat and message stored on this phone? Your contacts, profile and ID will be kept.",
      "Clear everything",
      function () {
        state.threads = {};
        ensureCommunityThread();
        if (isAiRoom()) ensureAiWelcome(getThread("community", true));
        ui.mode = "tabs";
        ui.peer = null;
        removeThreadBackAction();
        saveState();
        render();
        updateSidebar();
        toastMsg("All messages cleared");
      },
      true
    );
  }

  function resetIdentity() {
    if (!state) return;
    confirmDialog(
      "Reset identity",
      "This creates a new Community ID and deletes your contacts and chats on this phone. Friends will no longer be able to reach you at the old ID. Export a backup first if you are unsure.",
      "Reset everything",
      function () {
        state.user = makeUser();
        state.contacts = {};
        state.threads = {};
        state.cursors = {};
        state.dmCursor = null;
        state.crypto = null;
        state.welcome = true;
        resetCryptoCaches();
        ensureCommunityThread();
        if (isAiRoom()) ensureAiWelcome(getThread("community", true));
        ui.tab = "chats";
        ui.mode = "tabs";
        ui.peer = null;
        removeThreadBackAction();
        saveState();
        render();
        updateSidebar();
        ensureIdentityKeys().then(function (ok) {
          if (!ok) return;
          publishPublicKey(true);
          publishPresence();
        });
        toastMsg("New ID: " + state.user.id, 5000);
      },
      true
    );
  }

  /* ------------------------------------------------------------------ *
   * Clipboard
   * ------------------------------------------------------------------ */

  function copyText(text) {
    return new Promise(function (resolve) {
      try {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
          navigator.clipboard.writeText(text).then(function () {
            resolve(true);
          }, function () {
            resolve(fallbackCopy(text));
          });
          return;
        }
      } catch (e) {
        /* ignore */
      }
      resolve(fallbackCopy(text));
    });
  }

  function fallbackCopy(text) {
    try {
      var area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.top = "-1000px";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      var ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch (e) {
      return false;
    }
  }

  /* ------------------------------------------------------------------ *
   * Modals
   * ------------------------------------------------------------------ */

  function openModal(title) {
    closeModal();
    var host = $root || document.body;
    var overlay = document.createElement("div");
    overlay.className = "cm-modal";
    overlay.innerHTML = '<div class="cm-modal-card" role="dialog" aria-modal="true">' +
      '<div class="cm-modal-head"><strong></strong>' +
        '<button type="button" class="cm-iconbtn" data-action="close-modal" aria-label="Close"><span class="icon clearclose"></span></button>' +
      "</div>" +
      '<div class="cm-modal-body"></div>' +
      '<div class="cm-modal-actions"></div>' +
      "</div>";
    var titleEl = overlay.querySelector("strong");
    if (titleEl) titleEl.textContent = title;
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) closeModal();
    });
    host.appendChild(overlay);
    ui.modal = {
      overlay: overlay,
      body: overlay.querySelector(".cm-modal-body"),
      actions: overlay.querySelector(".cm-modal-actions"),
      close: closeModal
    };
    return ui.modal;
  }

  function closeModal() {
    if (ui.modal && ui.modal.overlay && ui.modal.overlay.parentNode) {
      ui.modal.overlay.parentNode.removeChild(ui.modal.overlay);
    }
    ui.modal = null;
  }

  function confirmDialog(title, message, confirmLabel, onConfirm, danger) {
    var modal = openModal(title);
    var text = document.createElement("p");
    text.textContent = message;
    modal.body.appendChild(text);

    var cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "cm-btn";
    cancel.textContent = "Cancel";
    cancel.onclick = function () {
      modal.close();
    };

    var ok = document.createElement("button");
    ok.type = "button";
    ok.className = "cm-btn " + (danger ? "danger" : "primary");
    ok.textContent = confirmLabel;
    ok.onclick = function () {
      modal.close();
      onConfirm();
    };

    modal.actions.appendChild(cancel);
    modal.actions.appendChild(ok);
  }

  function exportModal() {
    if (!state) return;
    var payload = {
      app: APP_TAG,
      version: VERSION,
      exportedAt: new Date().toISOString(),
      state: state
    };
    var json = JSON.stringify(payload, null, 2);
    var modal = openModal("Backup");
    var info = document.createElement("p");
    info.textContent = "This backup contains your Community ID, contacts, message history and your private encryption key. Anyone with the backup can read your direct messages, so keep it somewhere safe.";
    modal.body.appendChild(info);

    var area = document.createElement("textarea");
    area.className = "cm-modal-textarea";
    area.readOnly = true;
    area.value = json;
    modal.body.appendChild(area);

    var copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "cm-btn";
    copyBtn.textContent = "Copy backup";
    copyBtn.onclick = function () {
      copyText(json).then(function (ok) {
        toastMsg(ok ? "Backup copied" : "Could not copy — select the text manually");
      });
    };

    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "cm-btn primary";
    closeBtn.textContent = "Close";
    closeBtn.onclick = closeModal;

    modal.actions.appendChild(copyBtn);
    modal.actions.appendChild(closeBtn);
  }

  function importModal() {
    if (!state) return;
    var modal = openModal("Import backup");
    var info = document.createElement("p");
    info.textContent = "Paste a Community backup below. Importing replaces your ID, contacts and messages on this phone.";
    modal.body.appendChild(info);

    var area = document.createElement("textarea");
    area.className = "cm-modal-textarea";
    area.placeholder = "Paste the backup JSON here…";
    modal.body.appendChild(area);

    var cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "cm-btn";
    cancel.textContent = "Cancel";
    cancel.onclick = closeModal;

    var load = document.createElement("button");
    load.type = "button";
    load.className = "cm-btn primary";
    load.textContent = "Import";
    load.onclick = function () {
      var raw = String(area.value || "").trim();
      if (!raw) {
        toastMsg("Paste a backup first");
        return;
      }
      var parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (e) {
        toastMsg("That is not valid JSON");
        return;
      }
      var incoming = parsed && parsed.state ? parsed.state : parsed;
      if (!incoming || typeof incoming !== "object" || !incoming.user || !normalizeId(incoming.user.id)) {
        toastMsg("This does not look like a Community backup");
        return;
      }
      modal.close();
      confirmDialog(
        "Replace my data?",
        "This will replace your current ID, contacts and messages with the backup. This cannot be undone.",
        "Import backup",
        function () {
          state = normalizeState(incoming);
          state.dmCursor = null;
          resetCryptoCaches();
          ensureCommunityThread();
          if (isAiRoom()) ensureAiWelcome(getThread("community", true));
          saveState();
          ui.tab = "chats";
          ui.mode = "tabs";
          ui.peer = null;
          removeThreadBackAction();
          render();
          updateSidebar();
          pollNow();
          var restoredCrypto = !!(state.crypto && state.crypto.publicKey && state.crypto.privateJwk);
          if (restoredCrypto) state.crypto.publishedAt = 0;
          (restoredCrypto ? Promise.resolve(true) : ensureIdentityKeys()).then(function (ok) {
            if (!ok) return;
            publishPublicKey(true);
            publishPresence();
          });
          toastMsg("Backup imported");
        },
        false
      );
    };

    modal.actions.appendChild(cancel);
    modal.actions.appendChild(load);
  }

  /* ------------------------------------------------------------------ *
   * Acode plugin lifecycle
   * ------------------------------------------------------------------ */

  function injectStyle() {
    var existing = document.getElementById("community-chat-style");
    if (existing) return;
    var link = document.createElement("link");
    link.id = "community-chat-style";
    link.rel = "stylesheet";
    link.href = baseUrl + "style.css?v=" + VERSION;
    document.head.appendChild(link);
  }

  function registerCommands() {
    var commands = safeRequire("commands");
    if (!commands) return;
    try {
      if (typeof commands.addCommand === "function") {
        commands.addCommand({
          name: PLUGIN_ID + ".open",
          description: "Community: Open chat",
          exec: function () {
            openPage();
            return true;
          }
        });
        commands.addCommand({
          name: PLUGIN_ID + ".copy-id",
          description: "Community: Copy my ID",
          exec: function () {
            copyId();
            return true;
          }
        });
      }
    } catch (e) {
      console.warn("[Community] Could not register commands", e);
    }
  }

  function registerSidebar() {
    var sidebarApps = safeRequire("sidebarApps");
    if (!sidebarApps) return;
    try {
      sidebarApps.add(
        "chat_bubble",
        "community-chat",
        "Community",
        function (container) {
          sidebarEl = container;
          renderSidebar();
          container.addEventListener("click", onSidebarClick);
          return function () {
            container.removeEventListener("click", onSidebarClick);
            sidebarEl = null;
          };
        },
        false,
        function () {
          renderSidebar();
        }
      );
    } catch (e) {
      console.warn("[Community] Could not register sidebar app", e);
    }
  }

  function onVisibilityChange() {
    if (document.hidden) {
      schedulePoll(POLL_SLOW_MS);
    } else {
      pollNow();
    }
  }

  function init(pluginBaseUrl, page, options) {
    if (!window.acode) return;
    acodeApi = window.acode;
    running = true;

    var base = String(pluginBaseUrl || "");
    baseUrl = base ? (base.charAt(base.length - 1) === "/" ? base : base + "/") : "";
    pageRef = page || null;

    toast = safeRequire("toast") || window.toast || null;

    state = loadState();
    if (!loadedFromStorage) state.welcome = true;
    ensureCommunityThread();
    if (isAiRoom()) ensureAiWelcome(getThread("community", true));

    /* Save immediately so the generated ID exists on the phone even if the
       user never opens the plugin. */
    saveState();

    injectStyle();
    registerCommands();
    registerSidebar();

    document.addEventListener("visibilitychange", onVisibilityChange);

    ensureIdentityKeys().then(function (ok) {
      if (!ok) return;
      publishPublicKey(true);
      publishPresence();
    });

    setTimeout(function () {
      publishPresence();
    }, 1400);
    presenceTimer = setInterval(function () {
      publishPresence();
    }, PRESENCE_MS);
    tickTimer = setInterval(function () {
      if ($root && pageRef && pageRef.isConnected) {
        renderStatus();
        updateSidebar();
      }
    }, 30000);

    pollNow();

    if (options && options.firstInit) {
      setTimeout(function () {
        openPage();
      }, 650);
    }
  }

  function unmount() {
    running = false;
    if (pollTimer) clearTimeout(pollTimer);
    if (presenceTimer) clearInterval(presenceTimer);
    if (tickTimer) clearInterval(tickTimer);
    pollTimer = null;
    presenceTimer = null;
    tickTimer = null;

    try {
      saveState();
    } catch (e) {
      /* ignore */
    }

    document.removeEventListener("visibilitychange", onVisibilityChange);

    var commands = safeRequire("commands");
    if (commands && typeof commands.removeCommand === "function") {
      try {
        commands.removeCommand(PLUGIN_ID + ".open");
        commands.removeCommand(PLUGIN_ID + ".copy-id");
      } catch (e) {
        /* ignore */
      }
    }

    var sidebarApps = safeRequire("sidebarApps");
    if (sidebarApps && typeof sidebarApps.remove === "function") {
      try {
        sidebarApps.remove("community-chat");
      } catch (e) {
        /* ignore */
      }
    }

    removeThreadBackAction();

    if (pageRef && pageRef.isConnected && typeof pageRef.hide === "function") {
      try {
        pageRef.hide();
      } catch (e) {
        /* ignore */
      }
    }

    closeModal();

    var styleTag = document.getElementById("community-chat-style");
    if (styleTag) styleTag.remove();

    if ($root) {
      $root.removeEventListener("click", onClick);
      $root.removeEventListener("submit", onSubmit);
      $root.removeEventListener("input", onInput);
      $root.removeEventListener("keydown", onKeyDown);
      $root.removeEventListener("change", onChange);
      $root.remove();
    }

    $root = null;
    sidebarEl = null;
    pageRef = null;
    state = null;
    acodeApi = null;
  }

  /* ------------------------------------------------------------------ *
   * Boot
   * ------------------------------------------------------------------ */

  if (window.acode && typeof window.acode.setPluginInit === "function") {
    acodeApi = window.acode;
    acodeApi.setPluginInit(PLUGIN_ID, init);
    if (typeof acodeApi.setPluginUnmount === "function") {
      acodeApi.setPluginUnmount(PLUGIN_ID, unmount);
    }
  }
})();
