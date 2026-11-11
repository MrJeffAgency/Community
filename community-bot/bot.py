"""Telegram community bot with API-backed search, storage, and save commands."""
from __future__ import annotations

import json
import logging
import os
import random
from datetime import datetime
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import httpx
from dotenv import load_dotenv
from community import Update
from community.ext import Application, CommandHandler, ContextTypes

# Load only this project's .env; never read or print unrelated environment files.
load_dotenv(Path(__file__).with_name(".env"))

logging.basicConfig(
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
)
logger = logging.getLogger("community_bot")

API_BASE_URL = os.getenv("COMMUNITY_API_URL", "https://community-bot-api.hdo-box.workers.dev").rstrip("/")
API_KEY = os.getenv("COMMUNITY_API_KEY", "").strip()
API_AUTH_HEADER = os.getenv("API_AUTH_HEADER", "Authorization").strip()
API_AUTH_SCHEME = os.getenv("API_AUTH_SCHEME", "Bearer").strip()
API_SEARCH_PATH = os.getenv("API_SEARCH_PATH", "/search")
API_STORAGE_PATH = os.getenv("API_STORAGE_PATH", "/storage")
API_SAVE_PATH = os.getenv("API_SAVE_PATH", "/save")
API_TIMEOUT = float(os.getenv("API_TIMEOUT_SECONDS", "15"))

JOKES = [
    "Why did the developer go broke? Because they used up all their cache.",
    "Why do programmers prefer dark mode? Because light attracts bugs.",
    "A SQL query walks into a bar, sees two tables, and asks: ‘Can I join you?’",
]
QUOTES = [
    "It always seems impossible until it’s done. — Nelson Mandela",
    "The secret of getting ahead is getting started. — Mark Twain",
    "Great things are done by a series of small things brought together. — Vincent van Gogh",
]
FACTS = [
    "Octopuses have three hearts.",
    "A day on Venus is longer than its year.",
    "Honey can remain edible for a very long time when sealed and stored properly.",
]


def _api_headers() -> dict[str, str]:
    headers = {"Accept": "application/json"}
    if API_KEY:
        value = f"{API_AUTH_SCHEME} {API_KEY}".strip()
        headers[API_AUTH_HEADER] = value
    return headers


def _api_path(value: str) -> str:
    return "/" + value.strip().lstrip("/")


def _format_api_response(response: httpx.Response) -> str:
    if not response.content:
        return "Done. The API returned an empty response."
    try:
        data: Any = response.json()
        if isinstance(data, str):
            text = data
        else:
            text = json.dumps(data, ensure_ascii=False, indent=2)
    except (ValueError, json.JSONDecodeError):
        text = response.text.strip()
    return text[:3500] + ("\n… (response truncated)" if len(text) > 3500 else "")


async def call_api(method: str, path: str, *, params: dict[str, Any] | None = None,
                   payload: dict[str, Any] | None = None) -> str:
    url = API_BASE_URL + _api_path(path)
    async with httpx.AsyncClient(timeout=API_TIMEOUT) as client:
        response = await client.request(
            method,
            url,
            headers=_api_headers(),
            params=params,
            json=payload,
        )
    if response.status_code == 401 or response.status_code == 403:
        raise RuntimeError(
            "The API rejected authentication. Set COMMUNITY_API_KEY and, if needed, "
            "adjust API_AUTH_HEADER/API_AUTH_SCHEME in this project's .env."
        )
    if response.status_code >= 400:
        detail = response.text.strip().replace("\n", " ")[:300]
        raise RuntimeError(f"API returned HTTP {response.status_code}" + (f": {detail}" if detail else "."))
    return _format_api_response(response)


async def reply_api(update: Update, context: ContextTypes.DEFAULT_TYPE, method: str, path: str,
                    *, params: dict[str, Any] | None = None,
                    payload: dict[str, Any] | None = None) -> None:
    message = update.effective_message
    if message is None:
        return
    try:
        result = await call_api(method, path, params=params, payload=payload)
    except httpx.TimeoutException:
        result = "The API took too long to respond. Please try again."
    except httpx.RequestError as exc:
        logger.warning("API request failed: %s", type(exc).__name__)
        result = "I couldn't reach the API. Please try again later."
    except RuntimeError as exc:
        result = str(exc)
    await message.reply_text(result)


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.effective_message.reply_text(
        "Hi! I’m the community bot. Use /help to see what I can do."
    )


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.effective_message.reply_text(
        "Commands:\n"
        "/start — welcome message\n"
        "/help — show commands\n"
        "/search <query> — search using the community API\n"
        "/time — show the current time\n"
        "/storage [query] — check API storage\n"
        "/save <text> — save text through the API\n"
        "/ping — check whether I’m responding\n"
        "/id — show this chat and your user ID\n"
        "/whoami — show your Telegram profile details\n"
        "/joke, /quote, /fact — get a random item\n"
        "/about — bot information"
    )


async def search(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = " ".join(context.args).strip()
    if not query:
        await update.effective_message.reply_text("Usage: /search <query>")
        return
    await reply_api(update, context, "GET", API_SEARCH_PATH, params={"q": query})


async def storage(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = " ".join(context.args).strip()
    params = {"q": query} if query else None
    await reply_api(update, context, "GET", API_STORAGE_PATH, params=params)


async def save(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    content = " ".join(context.args).strip()
    if not content:
        await update.effective_message.reply_text("Usage: /save <text to save>")
        return
    user = update.effective_user
    chat = update.effective_chat
    payload = {
        "content": content,
        "user_id": user.id if user else None,
        "chat_id": chat.id if chat else None,
    }
    await reply_api(update, context, "POST", API_SAVE_PATH, payload=payload)


async def time_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    tz_name = os.getenv("BOT_TIMEZONE", "")
    try:
        now = datetime.now(ZoneInfo(tz_name)) if tz_name else datetime.now().astimezone()
    except ZoneInfoNotFoundError:
        now = datetime.now().astimezone()
        logger.warning("Unknown BOT_TIMEZONE; using system local time")
    await update.effective_message.reply_text(now.strftime("%A, %Y-%m-%d %H:%M:%S %Z"))


async def ping(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.effective_message.reply_text("Pong — I’m online.")


async def id_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    chat = update.effective_chat
    await update.effective_message.reply_text(
        f"Chat ID: {chat.id if chat else 'unknown'}\nUser ID: {user.id if user else 'unknown'}"
    )


async def whoami(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    if user is None:
        await update.effective_message.reply_text("I couldn't read your Telegram profile.")
        return
    username = f"@{user.username}" if user.username else "not set"
    await update.effective_message.reply_text(
        f"Name: {user.full_name}\nUsername: {username}\nUser ID: {user.id}"
    )


async def joke(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.effective_message.reply_text(random.choice(JOKES))


async def quote(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.effective_message.reply_text(random.choice(QUOTES))


async def fact(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.effective_message.reply_text(random.choice(FACTS))


async def about(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.effective_message.reply_text(
        "Community Bot: a Telegram bot with utility commands and community API-backed search, storage, and save features."
    )


async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
    # Avoid logging update contents or credential-bearing request details.
    logger.error("Unhandled bot error: %s", type(context.error).__name__ if context.error else "unknown")
    if isinstance(update, Update) and update.effective_message:
        await update.effective_message.reply_text("Something went wrong. Please try again.")


def main() -> None:
    token = (os.getenv("COMMUNITY_BOT_TOKEN") or os.getenv("BOT_TOKEN") or "").strip()
    if not token:
        raise SystemExit(
            "Missing community token. Add COMMUNITY_BOT_TOKEN=... to /home/ubuntu/community-bot/.env"
        )
    app = Application.builder().token(token).build()
    for command, callback in [
        ("start", start), ("help", help_command), ("search", search),
        ("time", time_command), ("storage", storage), ("save", save),
        ("ping", ping), ("id", id_command), ("whoami", whoami),
        ("joke", joke), ("quote", quote), ("fact", fact), ("about", about),
    ]:
        app.add_handler(CommandHandler(command, callback))
    app.add_error_handler(error_handler)
    logger.info("Bot starting in long-polling mode")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
