-- Community Relay schema.
-- Run with: npx wrangler d1 migrations apply DB --remote
-- The deploy button runs this automatically.

CREATE TABLE IF NOT EXISTS messages (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  topic TEXT NOT NULL,
  id TEXT NOT NULL UNIQUE,
  ts INTEGER NOT NULL,
  body TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_topic_seq ON messages (topic, seq);
CREATE INDEX IF NOT EXISTS idx_messages_topic_ts ON messages (topic, ts);
