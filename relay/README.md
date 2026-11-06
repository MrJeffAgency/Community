# Community Relay

A tiny, self-hosted relay for the **Community Chat** Acode plugin.

It replaces the public `ntfy.envs.net` relay, so the community is no longer
limited to a few thousand messages per day. It runs on Cloudflare's free
plan and stores end-to-end encrypted envelopes in D1.

> **Everyone you chat with must use the same relay.** The relay is the
> meeting point. If two people are on different relays, their messages
> will not meet.

---

## One-click deploy (recommended)

You need a free Cloudflare account.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/MrJeffAgency/Community/tree/main/relay)

The button will:

1. Copy this folder to your own GitHub account.
2. Create a D1 database and bind it as `DB`.
3. Apply the SQL migration.
4. Deploy the Worker and give you a URL like
   `https://community-relay.your-name.workers.dev`.

Open that URL in a browser. You should see the **Community Relay** page
with a green **Online** badge. If you see a `500` error, the database
binding or migration did not finish; open the Worker's **Logs** tab in the
Cloudflare dashboard.

### Connect the plugin

1. Open **Community Chat** in Acode.
2. Go to **Me → Advanced connection → Relay server**.
3. Paste the `https://…workers.dev` URL.
4. Tap **Save**, then **Test**. You should see “Relay is online”.
5. Tap **Share** and send the URL to the people you chat with. They must
   paste the same URL.

That's it. New rooms and direct chats will use the new relay. Old messages
stay on the old relay; the plugin starts a fresh sync position when you
change relays.

---

## Manual deploy (terminal)

```bash
cd relay
npm install

# Log in to Cloudflare (opens a browser).
npx wrangler login

# Deploy. Wrangler 4.45+ creates the D1 database automatically and
# writes its id into wrangler.toml.
npm run deploy
```

`npm run deploy` runs:

```bash
wrangler deploy
wrangler d1 migrations apply DB --remote
```

If your Wrangler version does not create D1 automatically:

```bash
npx wrangler d1 create community-relay
# Copy database_id into wrangler.toml, then:
npm run deploy
```

### Custom domain

In the Cloudflare dashboard open **Workers & Pages → community-relay →
Settings → Domains & Routes → Add custom domain**. Use any domain you
already have on Cloudflare. Then use that URL in the plugin instead of the
`workers.dev` URL.

---

## What it stores

| Data | Visible to the relay? |
| --- | --- |
| Message text | No — encrypted on the phone |
| Photos | No — encrypted on the phone |
| Token receipts | No — encrypted on the phone |
| Airdrop claim keys | No — encrypted on the phone |
| Community ID, display name, emoji | Yes — needed for routing and presence |
| Public encryption key | Yes — public by design |
| Timestamps and room topic | Yes |

The relay never receives a private key, a wallet seed phrase, or a room
password. It cannot read or forge messages.

The newest **1,000 messages per room** are kept. Older messages are
deleted automatically. The plugin keeps its own copy of the conversation
on the phone.

---

## Limits and cost

The free Cloudflare plan is enough for a small community:

- **D1:** 5 GB storage, 5 million rows read/day, 100,000 rows written/day.
- **Workers:** 100,000 requests/day.

A text message is one row write. A presence update is one row write every
15 minutes. The plugin polls every few seconds, but each poll only reads
new rows; an idle poll is cheap. If the community grows past the free
limits, Cloudflare's paid plan starts at $5/month.

There is **no per-day message quota** in the relay code. The old
`ntfy.envs.net` limit (about 17,000 messages/day) is gone.

You can change the retention and body limit in `wrangler.toml`:

```toml
[vars]
TOPIC_PREFIX = "acode-community-v1-"
KEEP_PER_TOPIC = "1000"
MAX_BODY_BYTES = "1048576"
```

`MAX_BODY_BYTES` is 1 MiB by default. The plugin compresses photos before
sending, so a photo is normally well under 300 KiB. If you raise it, keep
it below Cloudflare's request limits and redeploy.

`TOPIC_PREFIX` must match the plugin's topic prefix. Leave it alone unless
you know what you are changing.

---

## Local development

The Worker is a single file (`worker.js`) with no runtime dependencies.
The tests use Node's built-in SQLite, so they run on a phone:

```bash
cd relay
node test.mjs
```

Expected output: `41 passed, 0 failed`.

To run the real Worker locally you need a platform that can run
`workerd` (desktop Linux, macOS or Windows):

```bash
npm install
npm run db:local
npm run dev
```

Then open `http://localhost:8787`.

---

## Troubleshooting

**The plugin says “Relay is online” but messages do not arrive.**
Both people must use the same relay URL. Open **Me → Advanced connection**
and compare the URLs character by character. Changing the relay clears the
sync position, so the next poll starts from the newest messages.

**`500 relay database is not configured`**
The `DB` binding is missing. In the Cloudflare dashboard open the Worker →
**Settings → Bindings** and add a **D1 database** binding named `DB`.

**`500 could not read messages` / `no such table: messages`**
The migration did not run. Run `npx wrangler d1 migrations apply DB --remote`
from the `relay` folder, or open the deploy button again.

**`400 invalid topic`**
The `TOPIC_PREFIX` in `wrangler.toml` does not match the plugin's prefix.
Restore `acode-community-v1-` and redeploy.

**`413 message too large`**
Raise `MAX_BODY_BYTES` in `wrangler.toml`, or send a smaller photo.

**I lost the Worker URL.**
Cloudflare dashboard → **Workers & Pages → community-relay**. The URL is
shown on the overview page.

---

## Removing the relay

```bash
npx wrangler delete
npx wrangler d1 delete community-relay
```

Deleting the Worker stops all traffic. Deleting the D1 database removes
the stored envelopes. People's phones keep their own copies of the chats.

---

## Security notes

- The relay is public by design: anyone who knows a room topic can read
  the encrypted envelopes. The room key is derived from the room code and
  never leaves the phone. Use a private room code for a private room.
- The topic prefix (`acode-community-v1-`) keeps random scanners from
  using the relay as a general-purpose message board.
- Bodies are capped at 1 MiB and each topic keeps 1,000 messages, which
  limits storage abuse. There is no account system and no per-user quota.
- Do not commit a real `database_id` to a public repository. Each
  deployment should create its own database. The placeholder in
  `wrangler.toml` is intentional.
- If you want to restrict access further, put Cloudflare Access in front
  of the Worker, or add a secret header check. The stock plugin does not
  send an auth header, so that requires a plugin change.

---

## Files

```
relay/
  worker.js                  the whole relay
  wrangler.toml              Worker + D1 configuration
  migrations/0001_init.sql   database schema
  test.mjs                   local tests (Node 22.5+)
  package.json               deploy and test scripts
```

License: MIT, same as Community Chat.
