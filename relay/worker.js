/**
 * Community Relay
 * ------------------------------------------------------------
 * A small, self-hosted relay for the Community Chat Acode plugin.
 *
 * The plugin speaks a subset of the ntfy HTTP API:
 *
 *   POST /<topic>                         publish an encrypted envelope
 *   GET  /<topic>/json?poll=1&limit=200   poll for messages
 *        &since=all|<message-id>|<unix-seconds>
 *
 * It stores the encrypted envelope exactly as received. It cannot read
 * message text, images, token receipts or airdrop claim keys.
 *
 * Storage is Cloudflare D1. Each topic keeps the newest 1,000 messages,
 * so the relay stays small and has no per-day message quota.
 *
 * Deploy: see README.md in this folder.
 */

const RELAY_VERSION = "1.0.0";
const DEFAULT_PREFIX = "acode-community-v1-";
const DEFAULT_KEEP = 1000;
const DEFAULT_MAX_BODY = 1024 * 1024; // 1 MiB; the plugin's largest image is ~300 KiB.
const MAX_LIMIT = 500;
const DEFAULT_LIMIT = 200;
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, PUT, OPTIONS",
  "access-control-allow-headers": "*",
  "access-control-max-age": "86400"
};

function config(env) {
  const source = env || {};
  let prefix = source.TOPIC_PREFIX == null ? DEFAULT_PREFIX : String(source.TOPIC_PREFIX);
  if (!/^[A-Za-z0-9_-]*$/.test(prefix)) prefix = DEFAULT_PREFIX;

  const keep = parseInt(source.KEEP_PER_TOPIC, 10);
  const maxBody = parseInt(source.MAX_BODY_BYTES, 10);

  return {
    prefix: prefix,
    keep: isFinite(keep) && keep >= 1 ? Math.min(keep, 10000) : DEFAULT_KEEP,
    maxBody: isFinite(maxBody) && maxBody >= 1024
      ? Math.min(maxBody, 5 * 1024 * 1024)
      : DEFAULT_MAX_BODY
  };
}

function withCors(status, body, headers) {
  const out = new Headers(headers || {});
  Object.keys(CORS).forEach(function (key) {
    out.set(key, CORS[key]);
  });
  out.set("x-content-type-options", "nosniff");
  out.set("referrer-policy", "no-referrer");
  return new Response(body, { status: status, headers: out });
}

function jsonResponse(data, status, extra) {
  const headers = Object.assign({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  }, extra || {});
  return withCors(status || 200, JSON.stringify(data), headers);
}

function textResponse(body, status, contentType) {
  return withCors(status || 200, body, {
    "content-type": contentType || "text/plain; charset=utf-8",
    "cache-control": "no-store"
  });
}

function makeId() {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let out = "m";
  for (let i = 0; i < bytes.length; i += 1) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

function parseLimit(value) {
  const number = parseInt(value, 10);
  if (!isFinite(number) || number <= 0) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, number);
}

function sleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

function topicFromPath(parts, cfg) {
  if (!parts.length) return "";
  let topic = parts[0];
  try {
    topic = decodeURIComponent(topic);
  } catch (e) {
    return "";
  }

  if (cfg.prefix) {
    if (topic.indexOf(cfg.prefix) !== 0) return "";
    const suffix = topic.slice(cfg.prefix.length);
    if (!/^[A-Za-z0-9_-]{1,80}$/.test(suffix)) return "";
    return topic;
  }

  if (!/^[A-Za-z0-9_-]{1,64}$/.test(topic)) return "";
  return topic;
}

function byteLength(value) {
  return new TextEncoder().encode(value).length;
}

async function publish(request, env, topic, cfg) {
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > cfg.maxBody) {
    return jsonResponse({ error: "message too large", code: 413 }, 413);
  }

  let body;
  try {
    body = await request.text();
  } catch (e) {
    return jsonResponse({ error: "could not read message", code: 400 }, 400);
  }

  if (!body) {
    return jsonResponse({ error: "empty message", code: 400 }, 400);
  }
  if (byteLength(body) > cfg.maxBody) {
    return jsonResponse({ error: "message too large", code: 413 }, 413);
  }

  const ts = Date.now();
  const id = makeId();
  let stored = false;

  /* D1 serialises writes, but retry once or twice in case two requests
     race for the same topic. */
  for (let attempt = 0; attempt < 5 && !stored; attempt += 1) {
    try {
      await env.DB.prepare(
        "INSERT INTO messages (topic, id, ts, body) VALUES (?, ?, ?, ?)"
      ).bind(topic, id, ts, body).run();
      stored = true;
    } catch (e) {
      if (attempt === 4) {
        return jsonResponse({ error: "could not store message", code: 500 }, 500);
      }
      await sleep(10 + attempt * 20);
    }
  }

  /* Best effort: keep only the newest N messages for this topic. A failed
     trim must never make a successfully stored message look unsent. */
  try {
    await env.DB.prepare(
      "DELETE FROM messages WHERE topic = ? AND seq <= " +
      "(SELECT COALESCE(MAX(seq), 0) - ? FROM messages WHERE topic = ?)"
    ).bind(topic, cfg.keep, topic).run();
  } catch (e) {
    /* ignore */
  }

  return jsonResponse({
    id: id,
    time: Math.floor(ts / 1000),
    event: "message",
    topic: topic,
    message: body
  });
}

async function newest(env, topic, limit) {
  const result = await env.DB.prepare(
    "SELECT id, ts, body FROM messages WHERE topic = ? " +
    "ORDER BY seq DESC LIMIT ?"
  ).bind(topic, limit).all();
  return (result.results || []).slice().reverse();
}

async function poll(env, topic, url, cfg) {
  const since = (url.searchParams.get("since") || "all").trim();
  const limit = parseLimit(url.searchParams.get("limit"));
  let rows;

  try {
    if (since === "all" || since === "") {
      rows = await newest(env, topic, limit);
    } else if (/^\d+$/.test(since)) {
      const after = Number(since) * 1000;
      const result = await env.DB.prepare(
        "SELECT id, ts, body FROM messages WHERE topic = ? AND ts > ? " +
        "ORDER BY seq ASC LIMIT ?"
      ).bind(topic, after, limit).all();
      rows = result.results || [];
    } else {
      const found = await env.DB.prepare(
        "SELECT seq FROM messages WHERE id = ? AND topic = ?"
      ).bind(since, topic).first();

      if (found && found.seq != null) {
        const result = await env.DB.prepare(
          "SELECT id, ts, body FROM messages WHERE topic = ? AND seq > ? " +
          "ORDER BY seq ASC LIMIT ?"
        ).bind(topic, found.seq, limit).all();
        rows = result.results || [];
      } else {
        /* The cursor is from a trimmed message or another relay. Return
           the newest messages instead of silently skipping the room. */
        rows = await newest(env, topic, limit);
      }
    }
  } catch (e) {
    return jsonResponse({ error: "could not read messages", code: 500 }, 500);
  }

  const lines = rows.map(function (row) {
    return JSON.stringify({
      id: row.id,
      time: Math.floor(Number(row.ts) / 1000),
      event: "message",
      topic: topic,
      message: row.body
    });
  });

  return textResponse(
    lines.length ? lines.join("\n") + "\n" : "",
    200,
    "application/x-ndjson; charset=utf-8"
  );
}

function escapeHTML(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function landingPage(url, cfg) {
  const origin = escapeHTML(url.origin);
  const keep = String(cfg.keep);
  const size = (cfg.maxBody / 1024 / 1024).toFixed(1).replace(/\.0$/, "");
  return "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\">" +
    "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">" +
    "<meta name=\"color-scheme\" content=\"light dark\">" +
    "<title>Community Relay</title>" +
    "<style>" +
    ":root{color-scheme:light dark}body{font-family:system-ui,-apple-system,sans-serif;max-width:38rem;margin:0 auto;padding:2rem 1.25rem 3rem;line-height:1.6}" +
    "h1{font-size:1.7rem;margin:0 0 .25rem}h2{font-size:1.05rem;margin:1.8rem 0 .5rem}" +
    "p,li{font-size:1rem}.muted{opacity:.72}.badge{display:inline-block;padding:.2rem .55rem;border-radius:999px;background:#22c55e22;color:#15803d;font-size:.8rem;font-weight:700}" +
    "code{background:#8881;padding:.15rem .35rem;border-radius:.35rem;word-break:break-all;font-size:.92em}" +
    "a{color:#5b4bdb}ol{padding-left:1.25rem}li{margin:.45rem 0}" +
    "footer{margin-top:2.5rem;padding-top:1rem;border-top:1px solid #8883;font-size:.85rem}" +
    "@media(prefers-color-scheme:dark){.badge{color:#4ade80}}" +
    "</style></head><body>" +
    "<h1>Community Relay</h1>" +
    "<p><span class=\"badge\">Online</span> A self-hosted relay for the <strong>Community Chat</strong> Acode plugin.</p>" +
    "<p class=\"muted\">No account. No ads. No per-day message quota.</p>" +
    "<h2>Relay URL</h2>" +
    "<p><code>" + origin + "</code></p>" +
    "<h2>Connect the plugin</h2>" +
    "<ol>" +
    "<li>Open <strong>Community Chat</strong> in Acode.</li>" +
    "<li>Go to <strong>Me &rarr; Advanced connection &rarr; Relay server</strong>.</li>" +
    "<li>Paste the relay URL above and tap <strong>Save</strong>.</li>" +
    "<li>Tap <strong>Test</strong> to confirm the relay is online.</li>" +
    "</ol>" +
    "<p>Everyone you chat with must use the same relay. Use <strong>Share</strong> in the plugin to send them the URL.</p>" +
    "<h2>What this server stores</h2>" +
    "<p>Message text, images, token receipts and airdrop claim keys are encrypted on the phone. The relay only stores the encrypted envelope. Routing metadata (Community ID, display name, emoji, public key and timestamp) is visible to the relay.</p>" +
    "<p class=\"muted\">The newest " + keep + " messages per room are kept. Each message can be up to " + size + " MB.</p>" +
    "<footer><a href=\"/v1/health\">Health check</a> &middot; " +
    "<a href=\"https://github.com/MrJeffAgency/Community/tree/main/relay\">Source &amp; deployment guide</a> &middot; " +
    "Community Relay v" + RELAY_VERSION + "</footer>" +
    "</body></html>";
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return withCors(204, null, {});
    }

    if (!env || !env.DB) {
      return jsonResponse({ error: "relay database is not configured", code: 500 }, 500);
    }

    const cfg = config(env);
    const parts = url.pathname.split("/").filter(Boolean);

    if (request.method === "GET" && parts.length === 2 && parts[0] === "v1" && parts[1] === "health") {
      return jsonResponse({
        healthy: true,
        role: "active",
        relay: "community",
        version: RELAY_VERSION,
        retention: cfg.keep,
        maxBody: cfg.maxBody
      });
    }

    if (request.method === "GET" && parts.length === 0) {
      return textResponse(landingPage(url, cfg), 200, "text/html; charset=utf-8");
    }

    if (request.method === "GET" && parts.length === 1 && parts[0] === "robots.txt") {
      return textResponse("User-agent: *\nDisallow: /\n", 200, "text/plain; charset=utf-8");
    }

    const topic = topicFromPath(parts, cfg);
    if (!topic) {
      return jsonResponse({ error: "invalid topic", code: 400 }, 400);
    }

    if ((request.method === "POST" || request.method === "PUT") && parts.length === 1) {
      return publish(request, env, topic, cfg);
    }

    if (request.method === "GET" && parts.length === 2 && parts[1] === "json") {
      return poll(env, topic, url, cfg);
    }

    return jsonResponse({ error: "not found", code: 404 }, 404);
  }
};
