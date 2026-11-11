/**
 * Community Bot API
 * ------------------------------------------------------------
 * A small Cloudflare Worker + D1 database that lets Community
 * bots run outside the phone, Telegram-style.
 *
 * A bot owner creates a bot (in BotFather or with POST /v1/bots),
 * then runs a script that polls GET /v1/bots/me/getUpdates and
 * replies with POST /v1/bots/me/sendMessage.
 *
 * Endpoints
 *   GET    /health
 *   POST   /v1/bots                          create a bot
 *   GET    /v1/bots/me                       bot info (auth)
 *   DELETE /v1/bots/me                       delete the bot (auth)
 *   POST   /v1/bots/me/token                 rotate the token (auth)
 *   POST   /v1/bots/me/commands              set commands (auth)
 *   POST   /v1/bots/me/sendMessage           send a message (auth)
 *   GET    /v1/bots/me/getUpdates?offset=0   poll incoming messages (auth)
 *   POST   /v1/bots/:username/sendMessage    send a message to a bot (public)
 *
 * Auth: Authorization: Bearer <bot token> (or ?token=<bot token>).
 *
 * Deploy: see README.md in this folder.
 */

const VERSION = "1.0.0";
const MAX_TEXT = 4000;
const MAX_COMMANDS = 50;

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
  "access-control-allow-headers": "authorization, content-type",
  "access-control-max-age": "86400"
};

function json(data, status, extra) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: Object.assign({
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }, CORS, extra || {})
  });
}

function fail(status, message) {
  return json({ ok: false, error: message }, status);
}

function randomHex(bytes) {
  const data = new Uint8Array(bytes);
  crypto.getRandomValues(data);
  return Array.from(data, (b) => b.toString(16).padStart(2, "0")).join("");
}

function newBotId() {
  return "BOT-" + randomHex(4).toUpperCase();
}

function newToken() {
  return "cmb_" + randomHex(24);
}

function sanitizeUsername(value) {
  return String(value || "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .slice(0, 32);
}

function sanitizeText(value) {
  return String(value == null ? "" : value).slice(0, MAX_TEXT);
}

function sanitizeCommands(value) {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, MAX_COMMANDS)
    .map((item) => ({
      command: String((item && item.command) || "").replace(/^\//, "").slice(0, 32),
      description: String((item && item.description) || "").slice(0, 256)
    }))
    .filter((item) => item.command);
}

async function readJson(request) {
  try {
    return await request.json();
  } catch (e) {
    return null;
  }
}

function botJson(row) {
  if (!row) return null;
  let commands = [];
  try {
    commands = JSON.parse(row.commands || "[]");
  } catch (e) {
    commands = [];
  }
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    owner: row.owner || "",
    description: row.description || "",
    commands: commands,
    created_at: row.created_at
  };
}

async function authenticate(request, env, url) {
  const header = request.headers.get("authorization") || "";
  let token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (!token) token = url.searchParams.get("token") || "";
  if (!token) return null;
  const row = await env.DB.prepare("SELECT * FROM bots WHERE token = ?").bind(token).first();
  return row || null;
}

async function createBot(request, env) {
  const body = (await readJson(request)) || {};
  const username = sanitizeUsername(body.username);
  const name = String(body.name || username || "Community Bot").slice(0, 64);
  if (!username) return fail(400, "username is required");
  if (!/^[a-z0-9_]{3,32}$/.test(username)) return fail(400, "username must be 3-32 letters, numbers or _");
  if (["me", "new", "health", "v1"].indexOf(username) !== -1) return fail(400, "username is reserved");

  const existing = await env.DB.prepare("SELECT id FROM bots WHERE username = ?").bind(username).first();
  if (existing) return fail(409, "username is already taken");

  let id = String(body.id || "").trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9-]{3,23}$/.test(id)) id = newBotId();
  const token = newToken();
  const now = Date.now();

  await env.DB.prepare(
    "INSERT INTO bots (id, username, name, owner, token, description, commands, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  )
    .bind(
      id,
      username,
      name,
      String(body.owner || "").slice(0, 80),
      token,
      String(body.description || "").slice(0, 500),
      JSON.stringify(sanitizeCommands(body.commands)),
      now
    )
    .run();

  return json({
    ok: true,
    bot: { id, username, name, owner: String(body.owner || "").slice(0, 80), token, description: String(body.description || ""), commands: sanitizeCommands(body.commands) }
  }, 201);
}

async function sendMessage(env, bot, body, publicFrom) {
  body = body || {};
  const text = sanitizeText(publicFrom ? body.text : body.text);
  if (!text.trim()) return fail(400, "text is required");
  const chatId = String(publicFrom || body.chat_id || body.chatId || "").slice(0, 80);
  if (!chatId) return fail(400, "chat_id is required");
  const now = Date.now();
  const result = await env.DB.prepare(
    "INSERT INTO bot_messages (bot_id, chat_id, direction, text, created_at) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(bot.id, chatId, publicFrom ? "in" : "out", text, now)
    .run();
  return json({
    ok: true,
    message: {
      id: result.meta && result.meta.last_row_id ? result.meta.last_row_id : now,
      chat_id: chatId,
      direction: publicFrom ? "in" : "out",
      text,
      created_at: now
    }
  }, 201);
}

async function getUpdates(env, bot, url) {
  const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 50));
  const rows = await env.DB.prepare(
    "SELECT id, chat_id, text, created_at FROM bot_messages WHERE bot_id = ? AND direction = 'in' AND id > ? ORDER BY id ASC LIMIT ?"
  )
    .bind(bot.id, offset, limit)
    .all();
  const updates = (rows.results || []).map((row) => ({
    update_id: row.id,
    message: { chat_id: row.chat_id, text: row.text, date: Math.floor(row.created_at / 1000) }
  }));
  return json({ ok: true, updates, next_offset: updates.length ? updates[updates.length - 1].update_id : offset });
}

async function handle(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";

  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  if (path === "/" || path === "/health") {
    return json({ ok: true, service: "community-bot-api", version: VERSION });
  }

  if (path === "/v1/bots" && request.method === "POST") {
    return createBot(request, env);
  }

  // Public: anyone can send a message to a bot by username.
  const publicMatch = path.match(/^\/v1\/bots\/([a-zA-Z0-9_]+)\/sendMessage$/);
  if (publicMatch && publicMatch[1].toLowerCase() !== "me" && request.method === "POST") {
    const bot = await env.DB.prepare("SELECT * FROM bots WHERE username = ?").bind(sanitizeUsername(publicMatch[1])).first();
    if (!bot) return fail(404, "bot not found");
    const body = (await readJson(request)) || {};
    return sendMessage(env, bot, body, String(body.from || body.chat_id || "anonymous").slice(0, 80));
  }

  const bot = await authenticate(request, env, url);
  if (!bot) return fail(401, "invalid bot token");

  if (path === "/v1/bots/me") {
    if (request.method === "GET") return json({ ok: true, bot: botJson(bot) });
    if (request.method === "DELETE") {
      await env.DB.prepare("DELETE FROM bot_messages WHERE bot_id = ?").bind(bot.id).run();
      await env.DB.prepare("DELETE FROM bots WHERE id = ?").bind(bot.id).run();
      return json({ ok: true });
    }
  }

  if (path === "/v1/bots/me/token" && request.method === "POST") {
    const token = newToken();
    await env.DB.prepare("UPDATE bots SET token = ? WHERE id = ?").bind(token, bot.id).run();
    return json({ ok: true, token });
  }

  if (path === "/v1/bots/me/commands" && request.method === "POST") {
    const body = (await readJson(request)) || {};
    const commands = sanitizeCommands(body.commands);
    await env.DB.prepare("UPDATE bots SET commands = ? WHERE id = ?").bind(JSON.stringify(commands), bot.id).run();
    return json({ ok: true, commands });
  }

  if (path === "/v1/bots/me/sendMessage" && request.method === "POST") {
    return sendMessage(env, bot, (await readJson(request)) || {}, "");
  }

  if (path === "/v1/bots/me/getUpdates" && request.method === "GET") {
    return getUpdates(env, bot, url);
  }

  return fail(404, "not found");
}

export default {
  async fetch(request, env) {
    if (!env.DB) return fail(500, "D1 database is not bound (env.DB)");
    try {
      return await handle(request, env);
    } catch (error) {
      return fail(500, String((error && error.message) || error));
    }
  }
};
