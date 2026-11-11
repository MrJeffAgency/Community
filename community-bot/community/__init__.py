"""Community Bot SDK — build Telegram-style bots for Community Chat.

This package is the small, dependency-light counterpart of the Community Bot
API (see ``api/`` in the plugin repository). It mirrors the shape of
``python-telegram-bot`` that most bot examples use, so a bot can be written as:

    from community import Update
    from community.ext import Application, CommandHandler, ContextTypes

    async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        await update.effective_message.reply_text("Hi!")

    app = Application.builder().token("cmb_...").build()
    app.add_handler(CommandHandler("start", start))
    app.run_polling(allowed_updates=Update.ALL_TYPES)

Environment variables
---------------------
COMMUNITY_API_URL   Bot API root (default: the public Community API)
COMMUNITY_BOT_TOKEN Bot token from BotFather (``cmb_...``)
COMMUNITY_POLL_INTERVAL Seconds between long-poll requests (default 1.5)
"""

from ._bot import Bot, CommunityError, DEFAULT_API_URL
from ._types import Chat, Message, Update, User

__version__ = "1.0.0"

__all__ = [
    "Bot",
    "Chat",
    "CommunityError",
    "DEFAULT_API_URL",
    "Message",
    "Update",
    "User",
    "__version__",
]
