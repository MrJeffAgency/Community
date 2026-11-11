# Community Bot API

A small Cloudflare Worker + D1 backend that lets Community bots run outside the
phone — the same idea as the Telegram Bot API.

**Live deployment:** `https://community-bot-api.hdo-box.workers.dev`
(Cloudflare account `f5792b58f23f6504f452eebf6678871a`, D1 database
`community-bot-api`, id `9c432159-ac70-4144-9f60-73ece5c842f9`).
The plugin and the APK use this URL by default.

```bash
curl https://community-bot-api.hdo-box.workers.dev/health
# {"ok":true,"service":"community-bot-api","version":"1.0.0"}
```

The plugin and the APK can create and DM bots on the phone without this API. Set
**Me → Community bots → Community Bot API base URL** to turn on real bots that a
script on a server can answer.

## Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/health` | no | Service check |
| `POST` | `/v1/bots` | no | Create a bot: `{ id?, name, username, owner }` → `{ bot: { id, username, token } }` |
| `GET` | `/v1/bots/me` | token | Bot info |
| `DELETE` | `/v1/bots/me` | token | Delete the bot and its messages |
| `POST` | `/v1/bots/me/token` | token | Rotate the token |
| `POST` | `/v1/bots/me/commands` | token | Replace commands: `{ commands: [{ command, description }] }` |
| `POST` | `/v1/bots/me/sendMessage` | token | Send a message: `{ chat_id, text }` |
| `GET` | `/v1/bots/me/getUpdates?offset=0` | token | Poll incoming messages |
| `POST` | `/v1/bots/:username/sendMessage` | no | Send a message **to** a bot: `{ from, text }` |

Auth is `Authorization: Bearer <bot token>` or `?token=<bot token>`.

## Deploy (re-deploy or a fresh account)

```bash
cd api
npm install -g wrangler

wrangler login
wrangler d1 create community-bot-api
# copy the database_id from the output into wrangler.toml

wrangler d1 execute community-bot-api --remote --file=./schema.sql
wrangler deploy
```

Wrangler prints a URL like:

```
https://community-bot-api.<your-subdomain>.workers.dev
```

Put that URL in **Me → Community bots → Community Bot API base URL** in the
plugin or the APK. New bots created in BotFather are registered automatically
and get a real token.

## Example bot (Node.js)

```js
const BASE = "https://community-bot-api.example.workers.dev";
const TOKEN = "cmb_..."; // from /token in BotFather

let offset = 0;

async function poll() {
  const res = await fetch(`${BASE}/v1/bots/me/getUpdates?offset=${offset}`, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  });
  const data = await res.json();
  for (const update of data.updates || []) {
    offset = Math.max(offset, update.update_id);
    await fetch(`${BASE}/v1/bots/me/sendMessage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: update.message.chat_id,
        text: "Echo: " + update.message.text
      })
    });
  }
}

setInterval(poll, 2000);
```

## Notes

- Messages are plain text in D1. Do not send secrets, private keys or wallet
  recovery words through a bot.
- Each bot token can only read its own messages.
- The API has no built-in account system: the token is the bot identity.
