# Community Bot (Python)

A Community Chat bot built with the official Python SDK (`community/`). It talks
to the live Bot API at `https://community-bot-api.hdo-box.workers.dev` — the same
API the APK and the Acode plugin use — so replies appear in the app chat.

Commands: `/start`, `/help`, `/search`, `/time`, `/storage`, `/save`, `/ping`,
`/id`, `/whoami`, `/joke`, `/quote`, `/fact`, `/about`.

## Setup

1. In Community Chat open **Me → Community bots → BotFather** and run
   `/newbot <name> <username>` (or reuse an existing bot with `/token <username>`).
   BotFather shows a `cmb_...` token and a Community ID like `CM-B0T9-4K2M`.
2. Copy `.env.example` to `.env` and set:

   ```ini
   COMMUNITY_BOT_TOKEN=cmb_...
   COMMUNITY_API_KEY=cmb_...      # same token; used by /search, /storage, /save
   ```

3. Install and run:

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   python bot.py
   ```

The bot uses long polling, so no public webhook is needed. Keep the process
running while you want the bot online.

## The SDK (`community/`)

The `community` package in this folder is a small, readable SDK:

```python
from community import Update
from community.ext import Application, CommandHandler, ContextTypes

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.effective_message.reply_text("Hi!")

app = Application.builder().token("cmb_...").build()
app.add_handler(CommandHandler("start", start))
app.run_polling(allowed_updates=Update.ALL_TYPES)
```

It supports `Update`, `Message.reply_text`, `User`, `Chat`, `Application.builder()
.token().build()`, `Application.add_handler`, `Application.add_error_handler`,
`run_polling`, `CommandHandler`, `MessageHandler`, `CallbackContext` (`context.args`,
`context.error`) and `ContextTypes.DEFAULT_TYPE`.

Extras on the bot object: `get_me()`, `get_updates()`, `send_message()`,
`set_commands()`, `search()`, `storage()`, `save()`.

Environment: `COMMUNITY_API_URL` (API root) and `COMMUNITY_POLL_INTERVAL` (seconds,
default `1.5`).

## API integration used by the commands

| Command | Request |
| --- | --- |
| `/search <q>` | `GET /search?q=<q>` |
| `/storage [q]` | `GET /storage?q=<q>` |
| `/save <text>` | `POST /save` with `{ "content": "...", "user_id": "...", "chat_id": "..." }` |

All three need `Authorization: Bearer <bot token>`; the short paths are aliases
for `/v1/bots/me/search`, `/v1/bots/me/storage` and `/v1/bots/me/save`.

`/time` uses the system timezone; set `BOT_TIMEZONE` to an IANA name
(for example `Europe/London`) to override it.

## Secret safety

`.env` is git-ignored. Never commit bot tokens or share them in chat. If a token
leaks, open BotFather and run `/token <username>` to rotate it, then update `.env`.
