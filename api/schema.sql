-- Community Bot API — Cloudflare D1 schema
-- Run:  wrangler d1 execute community-bot-api --remote --file=./schema.sql

CREATE TABLE IF NOT EXISTS bots (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  owner TEXT DEFAULT '',
  token TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  commands TEXT DEFAULT '[]',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS bot_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bot_id TEXT NOT NULL,
  chat_id TEXT NOT NULL,
  direction TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bot_messages_updates
  ON bot_messages (bot_id, direction, id);
